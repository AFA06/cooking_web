"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkPassword, normalizeEmail, normalizeUzPhone } from "@/lib/auth-rules";
import { isUsernameAllowed, normalizeUsername } from "@/lib/profile";
import { getT } from "@/i18n/server";
import { destroyOtherSessions, getCurrentUser } from "@/server/auth";
import { TTL_MINUTES, createChallenge, verifyChallenge } from "@/server/challenges";
import { DeliveryUnavailable, deliverCode } from "@/server/notify";
import { WINDOW, allow, clear, peek, record } from "@/server/rate-limit";
import { keyedHash } from "@/server/security";

export interface AccountState {
  error?: string;
  ok?: string;
  /** Set once a code has been sent: the form switches to asking for it. */
  challengeId?: string;
  sentTo?: string;
}


/**
 * Every sensitive change asks for the current password. Wrong guesses are counted in the database
 * (not in server memory, which serverless instances do not share), per account.
 */
async function confirmPassword(userId: string, password: string): Promise<AccountState | null> {
  const t = await getT();
  const key = keyedHash("pw", userId);
  if ((await peek("pw-fail", key, WINDOW.quarterHour)) >= 5) {
    return { error: t("acct.err.locked") };
  }
  const [row] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (row && (await bcrypt.compare(password, row.hash))) {
    await clear("pw-fail", key);
    return null;
  }
  await record("pw-fail", key);
  return { error: t("acct.err.wrongPw") };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "auth.err.name").max(80, "acct.err.nameLong"),
  username: z.string().max(40),
});

export async function updateProfile(_: AccountState, formData: FormData): Promise<AccountState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("acct.err.signedOut") };
  const parsed = profileSchema.safeParse({ name: formData.get("name"), username: formData.get("username") ?? "" });
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };

  const username = normalizeUsername(parsed.data.username) || null;
  if (username && !isUsernameAllowed(username)) {
    return { error: t("acct.err.username") };
  }

  if (username) {
    const [taken] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.username, username), ne(schema.users.id, user.id)))
      .limit(1);
    if (taken) return { error: t("acct.err.usernameTaken") };
  }

  try {
    await db.update(schema.users).set({ name: parsed.data.name, username }).where(eq(schema.users.id, user.id));
  } catch {
    // The unique index is the final word if two people pick the same name at once.
    return { error: t("acct.err.usernameTaken") };
  }
  revalidatePath("/", "layout");
  return { ok: t("profile.saved") };
}

const CANNOT_USE = "acct.err.cannotUse";
const BAD_CODE = "auth.a.badCode";
const changeSchema = z.object({ value: z.string().max(254), currentPassword: z.string().min(1, "acct.err.enterCurrentPw").max(72) });

type ContactKind = "phone" | "email";

/** Step one: needs the password, then sends a code to the NEW number or email. Nothing changes yet. */
async function startContactChange(kind: ContactKind, formData: FormData): Promise<AccountState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("acct.err.signedOut") };
  const parsed = changeSchema.safeParse({ value: formData.get("value") ?? "", currentPassword: formData.get("currentPassword") });
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };

  const value = kind === "phone" ? normalizeUzPhone(parsed.data.value) : normalizeEmail(parsed.data.value);
  if (!value) return { error: kind === "phone" ? t("acct.err.phone") : t("auth.err.email") };
  if (value === (kind === "phone" ? user.phone : user.email)) return { error: kind === "phone" ? t("acct.err.sameNumber") : t("acct.err.sameEmail") };

  if (!(await allow("contact-change", keyedHash("user", user.id), 6, WINDOW.hour))) return { error: t("auth.a.tooMany") };
  const denied = await confirmPassword(user.id, parsed.data.currentPassword);
  if (denied) return denied;

  const [taken] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(kind === "phone" ? eq(schema.users.phone, value) : eq(schema.users.email, value))
    .limit(1);
  if (taken) return { error: t(CANNOT_USE) };
  if (!(await allow("send-dest", keyedHash("dest", value), 6, WINDOW.hour))) return { error: t("auth.a.tooMany") };

  const channel = kind === "phone" ? "sms" : "email";
  const purpose = kind === "phone" ? "phone_change" : "email_change";
  const created = await createChallenge({ purpose, channel, destination: value, userId: user.id });
  try {
    await deliverCode(channel, value, created.code, purpose, TTL_MINUTES[channel], t);
  } catch (e) {
    await db.delete(schema.authChallenges).where(eq(schema.authChallenges.id, created.id));
    console.error("contact change delivery failed:", e instanceof Error ? e.message : "unknown");
    return { error: e instanceof DeliveryUnavailable ? t("acct.err.deliveryDown") : t("auth.a.sendFailed") };
  }
  return { challengeId: created.id, sentTo: value };
}

/** Step two: the code proves the person controls the new number or email, and only then does it replace the old one. */
async function confirmContactChange(kind: ContactKind, formData: FormData): Promise<AccountState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("acct.err.signedOut") };
  const challengeId = String(formData.get("challengeId") ?? "");
  const retry = { challengeId, sentTo: String(formData.get("sentTo") ?? "") };
  if (!(await allow("verify-user", keyedHash("user", user.id), 20, WINDOW.hour))) return { ...retry, error: t("auth.a.tooMany") };

  const row = await verifyChallenge(challengeId, String(formData.get("code") ?? "").trim(), kind === "phone" ? "phone_change" : "email_change");
  // A code issued to one account must never complete a change on another.
  if (!row || row.userId !== user.id || !row.destination) return { ...retry, error: t(BAD_CODE) };

  try {
    await db
      .update(schema.users)
      .set(kind === "phone" ? { phone: row.destination, phoneVerifiedAt: new Date() } : { email: row.destination, emailVerifiedAt: new Date() })
      .where(eq(schema.users.id, user.id));
  } catch {
    return { error: t(CANNOT_USE) };
  }
  await destroyOtherSessions(user.id);
  revalidatePath("/", "layout");
  return { ok: kind === "phone" ? t("acct.phoneUpdated") : t("acct.emailVerified") };
}

export const startPhoneChange = async (_: AccountState, formData: FormData) => startContactChange("phone", formData);
export const confirmPhoneChange = async (_: AccountState, formData: FormData) => confirmContactChange("phone", formData);
export const startEmailChange = async (_: AccountState, formData: FormData) => startContactChange("email", formData);
export const confirmEmailChange = async (_: AccountState, formData: FormData) => confirmContactChange("email", formData);

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "acct.err.enterCurrentPw").max(72),
  newPassword: z.string().min(8, "acct.err.newPwShort").max(200),
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
  const weak = checkPassword(newPassword, user.phone);
  if (weak) return { error: t(weak) };

  const denied = await confirmPassword(user.id, currentPassword);
  if (denied) return denied;

  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(newPassword, 12) }).where(eq(schema.users.id, user.id));
  await destroyOtherSessions(user.id);
  return { ok: t("acct.pwUpdated") };
}
