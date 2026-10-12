"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { isUsernameAllowed, normalizePhone, normalizeUsername } from "@/lib/profile";
import { getT } from "@/i18n/server";
import { destroyOtherSessions, getCurrentUser } from "@/server/auth";

export interface AccountState {
  error?: string;
  ok?: string;
}


/**
 * Slows down password guessing through the settings forms. Counts wrong passwords per account
 * in this server instance; a correct password clears the count.
 */
const MAX_WRONG = 5;
const WINDOW_MS = 15 * 60 * 1000;
const wrongPasswords = new Map<string, { count: number; since: number }>();

function isLocked(userId: string): boolean {
  const entry = wrongPasswords.get(userId);
  if (!entry) return false;
  if (Date.now() - entry.since > WINDOW_MS) {
    wrongPasswords.delete(userId);
    return false;
  }
  return entry.count >= MAX_WRONG;
}

/** Checks the current password; every sensitive change goes through here. */
async function confirmPassword(userId: string, password: string): Promise<AccountState | null> {
  const t = await getT();
  if (isLocked(userId)) return { error: t("acct.err.locked") };
  const [row] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (row && (await bcrypt.compare(password, row.hash))) {
    wrongPasswords.delete(userId);
    return null;
  }
  const entry = wrongPasswords.get(userId) ?? { count: 0, since: Date.now() };
  wrongPasswords.set(userId, { count: entry.count + 1, since: entry.since });
  return { error: t("acct.err.wrongPw") };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "auth.err.name").max(80, "acct.err.nameLong"),
  username: z.string().max(40),
  phone: z.string().max(30),
});

export async function updateProfile(_: AccountState, formData: FormData): Promise<AccountState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("acct.err.signedOut") };
  const parsed = profileSchema.safeParse({ name: formData.get("name"), username: formData.get("username") ?? "", phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };

  const username = normalizeUsername(parsed.data.username) || null;
  if (username && !isUsernameAllowed(username)) {
    return { error: t("acct.err.username") };
  }
  const phone = parsed.data.phone.trim() ? normalizePhone(parsed.data.phone) : null;
  if (parsed.data.phone.trim() && !phone) return { error: t("acct.err.phone") };

  if (username) {
    const [taken] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.username, username), ne(schema.users.id, user.id)))
      .limit(1);
    if (taken) return { error: t("acct.err.usernameTaken") };
  }

  try {
    await db.update(schema.users).set({ name: parsed.data.name, username, phone }).where(eq(schema.users.id, user.id));
  } catch {
    // The unique index is the final word if two people pick the same name at once.
    return { error: t("acct.err.usernameTaken") };
  }
  revalidatePath("/", "layout");
  return { ok: t("profile.saved") };
}

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("auth.err.email").max(254),
  currentPassword: z.string().min(1, "acct.err.enterCurrentPw").max(72),
});

export async function changeEmail(_: AccountState, formData: FormData): Promise<AccountState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("acct.err.signedOut") };
  const parsed = emailSchema.safeParse({ email: formData.get("email"), currentPassword: formData.get("currentPassword") });
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const { email, currentPassword } = parsed.data;
  if (email === user.email) return { error: t("acct.err.sameEmail") };

  const denied = await confirmPassword(user.id, currentPassword);
  if (denied) return denied;

  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (taken) return { error: t("acct.err.emailTaken") };
  try {
    await db.update(schema.users).set({ email }).where(eq(schema.users.id, user.id));
  } catch {
    return { error: t("acct.err.emailTaken") };
  }
  await destroyOtherSessions(user.id);
  revalidatePath("/", "layout");
  return { ok: t("acct.emailUpdated") };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "acct.err.enterCurrentPw").max(72),
  newPassword: z.string().min(8, "acct.err.newPwShort").max(72, "acct.err.pwLong"),
  confirmPassword: z.string().max(72),
});

export async function changePassword(_: AccountState, formData: FormData): Promise<AccountState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("acct.err.signedOut") };
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const { currentPassword, newPassword, confirmPassword: repeated } = parsed.data;
  if (newPassword !== repeated) return { error: t("acct.err.pwMismatch") };
  if (newPassword === currentPassword) return { error: t("acct.err.pwSame") };

  const denied = await confirmPassword(user.id, currentPassword);
  if (denied) return denied;

  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(newPassword, 12) }).where(eq(schema.users.id, user.id));
  await destroyOtherSessions(user.id);
  return { ok: t("acct.pwUpdated") };
}
