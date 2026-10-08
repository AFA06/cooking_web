"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, destroySession } from "@/server/auth";

export interface AuthState {
  error?: string;
}

// Only allow same-site relative redirects.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/recipes";
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting").max(80),
  email: z.string().trim().toLowerCase().email("To‘g‘ri email kiriting").max(254),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo‘lishi kerak").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("To‘g‘ri email kiriting"),
  password: z.string().min(1, "Parolingizni kiriting").max(72),
});

// Compared against when the email is unknown, to keep response time similar.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5bQ7O8ZIOTbN0vJj5X9i1x4zV5g3a2K";

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) return { error: "Bu email bilan hisob allaqachon mavjud. Tizimga kirib ko‘ring." };

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(schema.users).values({ name, email, passwordHash }).returning({ id: schema.users.id });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Email yoki parol noto‘g‘ri." };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
