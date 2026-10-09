"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { isUsernameAllowed, normalizePhone, normalizeUsername } from "@/lib/profile";
import { destroyOtherSessions, getCurrentUser } from "@/server/auth";

export interface AccountState {
  error?: string;
  ok?: string;
}

const SIGNED_OUT: AccountState = { error: "Sessiya tugagan. Qaytadan tizimga kiring." };

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
  if (isLocked(userId)) return { error: "Juda ko‘p noto‘g‘ri urinish. 15 daqiqadan so‘ng qayta urinib ko‘ring." };
  const [row] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (row && (await bcrypt.compare(password, row.hash))) {
    wrongPasswords.delete(userId);
    return null;
  }
  const entry = wrongPasswords.get(userId) ?? { count: 0, since: Date.now() };
  wrongPasswords.set(userId, { count: entry.count + 1, since: entry.since });
  return { error: "Joriy parol noto‘g‘ri." };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting").max(80, "Ism juda uzun"),
  username: z.string().max(40),
  phone: z.string().max(30),
});

export async function updateProfile(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = profileSchema.safeParse({ name: formData.get("name"), username: formData.get("username") ?? "", phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const username = normalizeUsername(parsed.data.username) || null;
  if (username && !isUsernameAllowed(username)) {
    return { error: "Foydalanuvchi nomi 3–24 ta belgi: lotin harflari, raqamlar va “_”. Harf bilan boshlansin." };
  }
  const phone = parsed.data.phone.trim() ? normalizePhone(parsed.data.phone) : null;
  if (parsed.data.phone.trim() && !phone) return { error: "Telefon raqami noto‘g‘ri. Masalan: +998 90 123 45 67" };

  if (username) {
    const [taken] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.username, username), ne(schema.users.id, user.id)))
      .limit(1);
    if (taken) return { error: "Bu foydalanuvchi nomi band. Boshqasini tanlang." };
  }

  try {
    await db.update(schema.users).set({ name: parsed.data.name, username, phone }).where(eq(schema.users.id, user.id));
  } catch {
    // The unique index is the final word if two people pick the same name at once.
    return { error: "Bu foydalanuvchi nomi band. Boshqasini tanlang." };
  }
  revalidatePath("/", "layout");
  return { ok: "Profil saqlandi." };
}

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("To‘g‘ri email kiriting").max(254),
  currentPassword: z.string().min(1, "Joriy parolni kiriting").max(72),
});

export async function changeEmail(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const parsed = emailSchema.safeParse({ email: formData.get("email"), currentPassword: formData.get("currentPassword") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, currentPassword } = parsed.data;
  if (email === user.email) return { error: "Bu sizning hozirgi emailingiz." };

  const denied = await confirmPassword(user.id, currentPassword);
  if (denied) return denied;

  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (taken) return { error: "Bu emaildan foydalanib bo‘lmaydi. Boshqasini kiriting." };
  try {
    await db.update(schema.users).set({ email }).where(eq(schema.users.id, user.id));
  } catch {
    return { error: "Bu emaildan foydalanib bo‘lmaydi. Boshqasini kiriting." };
  }
  await destroyOtherSessions(user.id);
  revalidatePath("/", "layout");
  return { ok: "Email yangilandi. Endi shu email bilan kirasiz." };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Joriy parolni kiriting").max(72),
  newPassword: z.string().min(8, "Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak").max(72, "Parol juda uzun"),
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

  const denied = await confirmPassword(user.id, currentPassword);
  if (denied) return denied;

  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(newPassword, 12) }).where(eq(schema.users.id, user.id));
  await destroyOtherSessions(user.id);
  return { ok: "Parol yangilandi. Boshqa qurilmalardagi sessiyalar yopildi." };
}
