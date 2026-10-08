"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser, type CurrentUser } from "@/server/auth";
import { persistRecipe } from "@/server/recipe-write";
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
  revalidatePath("/creators");
  revalidatePath("/");
}

/* ───────────── Users ───────────── */

const userSchema = z.object({
  name: z.string().trim().min(2, "Ism juda qisqa").max(80),
  email: z.string().trim().toLowerCase().email("To‘g‘ri email kiriting").max(254),
  role: z.enum(["user", "creator", "admin"]),
});

export async function updateUser(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  if (!uuid.safeParse(userId).success) return { error: "Noto‘g‘ri foydalanuvchi." };
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (userId === admin.id && parsed.data.role !== "admin") return { error: "O‘zingizning admin huquqingizni olib tashlay olmaysiz." };

  const [taken] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, parsed.data.email), ne(schema.users.id, userId)))
    .limit(1);
  if (taken) return { error: "Bu email boshqa hisobga tegishli." };

  await db.update(schema.users).set(parsed.data).where(eq(schema.users.id, userId));
  revalidatePath("/admin", "layout");
  return { ok: "Saqlandi." };
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
  name: z.string().trim().min(2, "Ism juda qisqa").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(60)
    .regex(/^[a-z0-9-]*$/, "Manzil faqat lotin harflari, raqam va chiziqchadan iborat bo‘lishi kerak"),
  bio: z.string().trim().max(500),
  avatarUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Rasm havolasi http:// yoki https:// bilan boshlanishi kerak"),
  isFoundingCreator: z.boolean(),
  isFeatured: z.boolean(),
});

function parseCreator(formData: FormData) {
  return creatorSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    bio: formData.get("bio") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
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

export async function createCreator(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCreator(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const slug = d.slug || slugify(d.name) || "ijodkor";
  if (await slugTaken(slug)) return { error: "Bu manzil band. Boshqasini tanlang." };

  const [row] = await db
    .insert(schema.creators)
    .values({ ...d, slug, bio: d.bio || null, avatarUrl: d.avatarUrl || null })
    .returning({ id: schema.creators.id });
  refreshPublic();
  redirect(`/admin/creators/${row.id}`);
}

export async function updateCreator(creatorId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!uuid.safeParse(creatorId).success) return { error: "Noto‘g‘ri ijodkor." };
  const parsed = parseCreator(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!d.slug) return { error: "Manzil bo‘sh bo‘lmasligi kerak." };
  if (await slugTaken(d.slug, creatorId)) return { error: "Bu manzil band. Boshqasini tanlang." };

  await db
    .update(schema.creators)
    .set({ ...d, bio: d.bio || null, avatarUrl: d.avatarUrl || null })
    .where(eq(schema.creators.id, creatorId));
  refreshPublic();
  return { ok: "Saqlandi." };
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
  await db.delete(schema.recipes).where(eq(schema.recipes.id, recipeId));
  refreshPublic();
  redirect("/admin/recipes");
}

/** Saves any recipe. `creatorId` is the owner for a new recipe and ignored when editing. */
export async function adminSaveRecipe(
  creatorId: string | null,
  recipeId: string | null,
  input: RecipeInput,
  publish: boolean,
): Promise<{ error: string } | { id: string }> {
  await requireAdmin();
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (recipeId && !uuid.safeParse(recipeId).success) return { error: "Noto‘g‘ri retsept." };
  if (!recipeId && !uuid.safeParse(creatorId).success) return { error: "Ijodkor tanlanmagan." };

  const result = await persistRecipe({ recipeId, creatorId, ownerOnly: false, data: parsed.data, publish });
  if ("error" in result) return result;
  refreshPublic();
  revalidatePath(`/recipes/${result.slug}`);
  return { id: result.id };
}
