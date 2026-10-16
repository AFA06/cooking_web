"use server";

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { destroyOtherSessions, getCurrentUser, type CurrentUser } from "@/server/auth";
import { listRecipeMedia, removeAssets } from "@/server/media";
import { persistRecipe } from "@/server/recipe-write";
import { getStorage } from "@/server/storage";
import { normalizePhone } from "@/lib/profile";
import { TELEGRAM_PATTERN, normalizeTelegram } from "@/server/orders";
import { recipeInputSchema, slugify, type RecipeInput } from "@/lib/recipe-schema";

export interface FormState {
  error?: string;
  ok?: string;
}

async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");
  return user;
}

const uuid = z.string().uuid();

function refreshPublic() {
  revalidatePath("/admin", "layout");
  revalidatePath("/recipes");
  revalidateTag("recipes", { expire: 0 });
  revalidatePath("/creators");
  revalidatePath("/");
}

/* ───────────── Users ───────────── */

const userSchema = z.object({
  name: z.string().trim().min(2, "err.nameShort").max(80),
  /** Optional: phone-only accounts have none. */
  email: z.string().trim().toLowerCase().max(254).refine((v) => v === "" || z.string().email().safeParse(v).success, "auth.err.email"),
  role: z.enum(["user", "creator", "admin"]),
});

export async function updateUser(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const admin = await requireAdmin();
  if (!uuid.safeParse(userId).success) return { error: t("adm.err.badUser") };
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  if (userId === admin.id && parsed.data.role !== "admin") return { error: t("adm.roleHintSelf") };

  const email = parsed.data.email || null;
  if (email) {
    const [taken] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.email, email), ne(schema.users.id, userId)))
      .limit(1);
    if (taken) return { error: t("adm.err.emailTaken") };
  }

  const [current] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  // An email typed by an admin has not been proven by its owner, so it cannot receive recovery codes.
  const emailChanged = (current?.email ?? null) !== email;
  await db
    .update(schema.users)
    .set({ name: parsed.data.name, role: parsed.data.role, email, ...(emailChanged ? { emailVerifiedAt: null } : {}) })
    .where(eq(schema.users.id, userId));
  revalidatePath("/admin", "layout");
  return { ok: t("adm.saved") };
}

export async function deleteUser(userId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!uuid.safeParse(userId).success || userId === admin.id) return;
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  revalidatePath("/admin", "layout");
  redirect("/admin/users");
}

/* ───────────── Creators ───────────── */

const creatorSchema = z.object({
  name: z.string().trim().min(2, "err.nameShort").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(60)
    .regex(/^[a-z0-9-]*$/, "adm.err.slugFormat"),
  bio: z.string().trim().max(500),
  avatarUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "err.imgUrl"),
  /** Where buyers of this creator's premium recipes are sent. Empty = not selling yet. */
  telegramUsername: z
    .string()
    .transform(normalizeTelegram)
    .refine((v) => v === "" || TELEGRAM_PATTERN.test(v), "adm.err.telegram"),
  isFoundingCreator: z.boolean(),
  isFeatured: z.boolean(),
});

function parseCreator(formData: FormData) {
  return creatorSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    bio: formData.get("bio") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
    telegramUsername: formData.get("telegramUsername") ?? "",
    isFoundingCreator: formData.get("isFoundingCreator") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.creators.id })
    .from(schema.creators)
    .where(exceptId ? and(eq(schema.creators.slug, slug), ne(schema.creators.id, exceptId)) : eq(schema.creators.slug, slug))
    .limit(1);
  return !!row;
}

export interface NewBloggerState {
  error?: string;
  /** Shown once after the account is made, so the admin can hand it over. */
  created?: { creatorId: string; name: string; login: string; password: string };
}

/**
 * Adds a blogger in one step: their sign-in account (phone + temporary password, role "creator") and their
 * public profile, linked together. The password is returned once and must be changed at first sign-in.
 */
export async function createBlogger(_: NewBloggerState, formData: FormData): Promise<NewBloggerState> {
  const t = await getT();
  await requireAdmin();
  const parsed = parseCreator(formData);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const d = parsed.data;
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { error: t("adm.login.badPhone") };
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (taken) return { error: t("adm.login.phoneTaken") };
  const slug = d.slug || slugify(d.name) || "bloger";
  if (await slugTaken(slug)) return { error: t("adm.err.slugTaken") };

  const password = temporaryPassword();
  const [user] = await db
    .insert(schema.users)
    .values({ name: d.name, phone, phoneVerifiedAt: new Date(), passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true, role: "creator" })
    .returning({ id: schema.users.id });
  try {
    const [row] = await db
      .insert(schema.creators)
      .values({ ...d, slug, userId: user.id, bio: d.bio || null, avatarUrl: d.avatarUrl || null, telegramUsername: d.telegramUsername || null })
      .returning({ id: schema.creators.id });
    refreshPublic();
    return { created: { creatorId: row.id, name: d.name, login: phone, password } };
  } catch {
    // No half-made bloggers: without a profile the account is removed again.
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    return { error: t("adm.err.slugTaken") };
  }
}

export async function updateCreator(creatorId: string, _: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  await requireAdmin();
  if (!uuid.safeParse(creatorId).success) return { error: t("adm.err.badCreator") };
  const parsed = parseCreator(formData);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const d = parsed.data;
  if (!d.slug) return { error: t("adm.err.slugEmpty") };
  if (await slugTaken(d.slug, creatorId)) return { error: t("adm.err.slugTaken") };

  await db
    .update(schema.creators)
    .set({ ...d, bio: d.bio || null, avatarUrl: d.avatarUrl || null, telegramUsername: d.telegramUsername || null })
    .where(eq(schema.creators.id, creatorId));
  refreshPublic();
  return { ok: t("adm.saved") };
}

/** Readable temporary password: no look-alike characters, about 60 bits. */
function temporaryPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set: string, n: number) => Array.from({ length: n }, () => set[randomInt(set.length)]).join("");
  return `${pick(letters, 4)}-${pick(digits, 4)}-${pick(letters, 4)}`;
}

/**
 * Gives a creator a way to sign in. If the profile has no account yet, creates one from the phone number;
 * if it has, issues a new temporary password. The password is shown once and must be changed at first sign-in.
 */
export async function issueCreatorLogin(creatorId: string, _: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  await requireAdmin();
  if (!uuid.safeParse(creatorId).success) return { error: t("adm.err.badCreator") };
  const [creator] = await db.select({ id: schema.creators.id, name: schema.creators.name, userId: schema.creators.userId }).from(schema.creators).where(eq(schema.creators.id, creatorId)).limit(1);
  if (!creator) return { error: t("adm.err.badCreator") };

  const password = temporaryPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  if (creator.userId) {
    const [user] = await db.update(schema.users).set({ passwordHash, mustChangePassword: true }).where(eq(schema.users.id, creator.userId)).returning({ phone: schema.users.phone, email: schema.users.email });
    await destroyOtherSessions(creator.userId);
    return { ok: t("adm.login.done", { login: user?.phone ?? user?.email ?? "", password }) };
  }

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { error: t("adm.login.badPhone") };
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (taken) return { error: t("adm.login.phoneTaken") };

  const [user] = await db
    .insert(schema.users)
    .values({ name: creator.name, phone, phoneVerifiedAt: new Date(), passwordHash, mustChangePassword: true, role: "creator" })
    .returning({ id: schema.users.id });
  await db.update(schema.creators).set({ userId: user.id }).where(eq(schema.creators.id, creatorId));
  revalidatePath("/admin", "layout");
  return { ok: t("adm.login.done", { login: phone, password }) };
}

export async function setCreatorFlag(creatorId: string, flag: "isFoundingCreator" | "isFeatured", value: boolean): Promise<void> {
  await requireAdmin();
  if (!uuid.safeParse(creatorId).success) return;
  await db.update(schema.creators).set({ [flag]: value }).where(eq(schema.creators.id, creatorId));
  refreshPublic();
}

/** Deletes the creator profile and, by cascade, all of their recipes. The linked user account is kept. */
export async function deleteCreator(creatorId: string): Promise<void> {
  await requireAdmin();
  if (!uuid.safeParse(creatorId).success) return;
  const [row] = await db
    .delete(schema.creators)
    .where(eq(schema.creators.id, creatorId))
    .returning({ userId: schema.creators.userId });
  if (row?.userId) {
    await db.update(schema.users).set({ role: "user" }).where(and(eq(schema.users.id, row.userId), eq(schema.users.role, "creator")));
  }
  refreshPublic();
  redirect("/admin/creators");
}

/* ───────────── Blocking ───────────── */

/** Blocks or unblocks a person. A block ends every session at once; admins cannot block themselves. */
export async function setUserBlocked(userId: string, blocked: boolean): Promise<void> {
  const admin = await requireAdmin();
  if (!uuid.safeParse(userId).success || userId === admin.id) return;
  await db.update(schema.users).set({ blockedAt: blocked ? new Date() : null }).where(eq(schema.users.id, userId));
  if (blocked) await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  revalidatePath("/admin", "layout");
}

/* ───────────── Creator requests ───────────── */

/**
 * Approves a request: the person keeps their own account and gets a creator profile linked to it,
 * filled from the request (name, Instagram, Telegram). They see the studio the next time they open the site.
 */
export async function approveApplication(applicationId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!uuid.safeParse(applicationId).success) return;
  const [app] = await db.select().from(schema.creatorApplications).where(eq(schema.creatorApplications.id, applicationId)).limit(1);
  if (!app || app.status !== "pending") return;

  const [existing] = await db.select({ id: schema.creators.id }).from(schema.creators).where(eq(schema.creators.userId, app.userId)).limit(1);
  let creatorId = existing?.id;
  if (!creatorId) {
    const base = slugify(app.fullName) || "ijodkor";
    let slug = base;
    for (let i = 0; i < 5 && (await slugTaken(slug)); i++) slug = `${base}-${randomInt(1000, 9999)}`;
    const handle = app.telegram ? normalizeTelegram(app.telegram) : "";
    const socialLinks: Record<string, string> = {};
    if (app.instagram) socialLinks.instagram = app.instagram;
    if (app.telegram) socialLinks.telegram = app.telegram;
    const [row] = await db
      .insert(schema.creators)
      .values({ userId: app.userId, slug, name: app.fullName, socialLinks, telegramUsername: TELEGRAM_PATTERN.test(handle) ? handle : null })
      .returning({ id: schema.creators.id });
    creatorId = row.id;
  }
  await db.update(schema.users).set({ role: "creator" }).where(and(eq(schema.users.id, app.userId), eq(schema.users.role, "user")));
  await db
    .update(schema.creatorApplications)
    .set({ status: "approved", reviewedBy: admin.id, reviewedAt: new Date() })
    .where(eq(schema.creatorApplications.id, applicationId));
  refreshPublic();
  redirect(`/admin/creators/${creatorId}?approved=1`);
}

export async function rejectApplication(applicationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const admin = await requireAdmin();
  if (!uuid.safeParse(applicationId).success) return { error: t("adm.err.badUser") };
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  await db
    .update(schema.creatorApplications)
    .set({ status: "rejected", adminNote: note || null, reviewedBy: admin.id, reviewedAt: new Date() })
    .where(and(eq(schema.creatorApplications.id, applicationId), eq(schema.creatorApplications.status, "pending")));
  revalidatePath("/admin", "layout");
  return { ok: t("apply.adm.rejectedOk") };
}

/* ───────────── Recipes ───────────── */

export async function setRecipeFeatured(recipeId: string, value: boolean): Promise<void> {
  await requireAdmin();
  if (!uuid.safeParse(recipeId).success) return;
  await db.update(schema.recipes).set({ isFeatured: value }).where(eq(schema.recipes.id, recipeId));
  refreshPublic();
}

export async function setRecipeStatusAsAdmin(recipeId: string, status: "draft" | "published"): Promise<void> {
  await requireAdmin();
  if (!uuid.safeParse(recipeId).success) return;
  const [current] = await db
    .select({ publishedAt: schema.recipes.publishedAt })
    .from(schema.recipes)
    .where(eq(schema.recipes.id, recipeId))
    .limit(1);
  if (!current) return;
  await db
    .update(schema.recipes)
    .set({ status, updatedAt: new Date(), publishedAt: status === "published" ? (current.publishedAt ?? new Date()) : current.publishedAt })
    .where(eq(schema.recipes.id, recipeId));
  refreshPublic();
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  await requireAdmin();
  if (!uuid.safeParse(recipeId).success) return;
  // The recipe's uploaded files go with it: found first, removed from storage once the recipe is gone.
  const media = await listRecipeMedia(recipeId);
  await db.delete(schema.recipes).where(eq(schema.recipes.id, recipeId));
  const storage = getStorage();
  if (storage) await removeAssets(storage, media);
  refreshPublic();
  redirect("/admin/recipes");
}

/** Saves any recipe. `creatorId` is the owner for a new recipe and ignored when editing. */
export async function adminSaveRecipe(
  creatorId: string | null,
  recipeId: string | null,
  input: RecipeInput,
  publish: boolean,
): Promise<{ error: string } | { id: string; stepIds: string[] }> {
  const t = await getT();
  const admin = await requireAdmin();
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  if (recipeId && !uuid.safeParse(recipeId).success) return { error: t("adm.err.badRecipe") };
  if (!recipeId && !uuid.safeParse(creatorId).success) return { error: t("err.noCreator") };

  const result = await persistRecipe({ recipeId, creatorId, ownerOnly: false, data: parsed.data, publish, actor: admin });
  if ("error" in result) return { error: t(result.error) };
  refreshPublic();
  revalidatePath(`/recipes/${result.slug}`);
  return { id: result.id, stepIds: result.stepIds };
}
