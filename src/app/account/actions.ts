"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkPassword, normalizeEmail, normalizeUzPhone } from "@/lib/auth-rules";
import { isUsernameAllowed, normalizeUsername } from "@/lib/profile";
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

const SIGNED_OUT: AccountState = { error: "Sessiya tugagan. Qaytadan tizimga kiring." };

/**
 * Every sensitive change asks for the current password. Wrong guesses are counted in the database
 * (not in server memory, which serverless instances do not share), per account.
 */
async function confirmPassword(userId: string, password: string): Promise<AccountState | null> {
  const key = keyedHash("pw", userId);
  if ((await peek("pw-fail", key, WINDOW.quarterHour)) >= 5) {
    return { error: "Juda ko‘p noto‘g‘ri urinish. 15 daqiqadan so‘ng qayta urinib ko‘ring." };
  }
  const [row] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (row && (await bcrypt.compare(password, row.hash))) {
    await clear("pw-fail", key);
    return null;
  }
  await record("pw-fail", key);
  return { error: "Joriy parol noto‘g‘ri." };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting").max(80, "Ism juda uzun"),
  username: z.string().max(40),
});

export async function updateProfile(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = profileSchema.safeParse({ name: formData.get("name"), username: formData.get("username") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const username = normalizeUsername(parsed.data.username) || null;
  if (username && !isUsernameAllowed(username)) {
    return { error: "Foydalanuvchi nomi 3–24 ta belgi: lotin harflari, raqamlar va “_”. Harf bilan boshlansin." };
  }

  if (username) {
    const [taken] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.username, username), ne(schema.users.id, user.id)))
      .limit(1);
    if (taken) return { error: "Bu foydalanuvchi nomi band. Boshqasini tanlang." };
  }

  try {
    await db.update(schema.users).set({ name: parsed.data.name, username }).where(eq(schema.users.id, user.id));
  } catch {
    // The unique index is the final word if two people pick the same name at once.
    return { error: "Bu foydalanuvchi nomi band. Boshqasini tanlang." };
  }
  revalidatePath("/", "layout");
  return { ok: "Profil saqlandi." };
}

const CANNOT_USE = "Bu raqam yoki emaildan foydalanib bo‘lmaydi. Boshqasini kiriting.";
const BAD_CODE = "Kod noto‘g‘ri yoki muddati tugagan.";
const changeSchema = z.object({ value: z.string().max(254), currentPassword: z.string().min(1, "Joriy parolni kiriting").max(72) });

type ContactKind = "phone" | "email";

/** Step one: needs the password, then sends a code to the NEW number or email. Nothing changes yet. */
async function startContactChange(kind: ContactKind, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = changeSchema.safeParse({ value: formData.get("value") ?? "", currentPassword: formData.get("currentPassword") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const value = kind === "phone" ? normalizeUzPhone(parsed.data.value) : normalizeEmail(parsed.data.value);
  if (!value) return { error: kind === "phone" ? "Telefon raqami noto‘g‘ri. Masalan: +998 90 123 45 67" : "To‘g‘ri email kiriting" };
  if (value === (kind === "phone" ? user.phone : user.email)) return { error: kind === "phone" ? "Bu sizning hozirgi raqamingiz." : "Bu sizning hozirgi emailingiz." };

  if (!(await allow("contact-change", keyedHash("user", user.id), 6, WINDOW.hour))) return { error: "Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring." };
  const denied = await confirmPassword(user.id, parsed.data.currentPassword);
  if (denied) return denied;

  const [taken] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(kind === "phone" ? eq(schema.users.phone, value) : eq(schema.users.email, value))
    .limit(1);
  if (taken) return { error: CANNOT_USE };
  if (!(await allow("send-dest", keyedHash("dest", value), 6, WINDOW.hour))) return { error: "Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring." };

  const channel = kind === "phone" ? "sms" : "email";
  const purpose = kind === "phone" ? "phone_change" : "email_change";
  const created = await createChallenge({ purpose, channel, destination: value, userId: user.id });
  try {
    await deliverCode(channel, value, created.code, purpose, TTL_MINUTES[channel]);
  } catch (e) {
    await db.delete(schema.authChallenges).where(eq(schema.authChallenges.id, created.id));
    console.error("contact change delivery failed:", e instanceof Error ? e.message : "unknown");
    return { error: e instanceof DeliveryUnavailable ? "Kod yuborish xizmati hozircha ishlamayapti." : "Kod yuborib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring." };
  }
  return { challengeId: created.id, sentTo: value };
}

/** Step two: the code proves the person controls the new number or email, and only then does it replace the old one. */
async function confirmContactChange(kind: ContactKind, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const challengeId = String(formData.get("challengeId") ?? "");
  const retry = { challengeId, sentTo: String(formData.get("sentTo") ?? "") };
  if (!(await allow("verify-user", keyedHash("user", user.id), 20, WINDOW.hour))) return { ...retry, error: "Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring." };

  const row = await verifyChallenge(challengeId, String(formData.get("code") ?? "").trim(), kind === "phone" ? "phone_change" : "email_change");
  // A code issued to one account must never complete a change on another.
  if (!row || row.userId !== user.id || !row.destination) return { ...retry, error: BAD_CODE };

  try {
    await db
      .update(schema.users)
      .set(kind === "phone" ? { phone: row.destination, phoneVerifiedAt: new Date() } : { email: row.destination, emailVerifiedAt: new Date() })
      .where(eq(schema.users.id, user.id));
  } catch {
    return { error: CANNOT_USE };
  }
  await destroyOtherSessions(user.id);
  revalidatePath("/", "layout");
  return { ok: kind === "phone" ? "Telefon raqami tasdiqlandi va yangilandi." : "Email tasdiqlandi va yangilandi." };
}

export const startPhoneChange = async (_: AccountState, formData: FormData) => startContactChange("phone", formData);
export const confirmPhoneChange = async (_: AccountState, formData: FormData) => confirmContactChange("phone", formData);
export const startEmailChange = async (_: AccountState, formData: FormData) => startContactChange("email", formData);
export const confirmEmailChange = async (_: AccountState, formData: FormData) => confirmContactChange("email", formData);

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Joriy parolni kiriting").max(72),
  newPassword: z.string().min(8, "Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak").max(200),
  confirmPassword: z.string().max(72),
});

export async function changePassword(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { currentPassword, newPassword, confirmPassword: repeated } = parsed.data;
  if (newPassword !== repeated) return { error: "Yangi parollar bir xil emas." };
  if (newPassword === currentPassword) return { error: "Yangi parol eskisidan farq qilishi kerak." };
  const weak = checkPassword(newPassword, user.phone);
  if (weak) return { error: weak };

  const denied = await confirmPassword(user.id, currentPassword);
  if (denied) return denied;

  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(newPassword, 12) }).where(eq(schema.users.id, user.id));
  await destroyOtherSessions(user.id);
  return { ok: "Parol yangilandi. Boshqa qurilmalardagi sessiyalar yopildi." };
}
