"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { createSession, destroySession } from "@/server/auth";
import { WINDOW, allow, clear, lockedForMinutes, record } from "@/server/rate-limit";
import { clientKey, keyedHash } from "@/server/security";

export interface AuthState {
  error?: string;
}

// Only allow same-site relative redirects.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/recipes";
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "auth.err.name").max(80),
  email: z.string().trim().toLowerCase().email("auth.err.email").max(254),
  password: z.string().min(8, "auth.err.pwShort").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("auth.err.email"),
  password: z.string().min(1, "auth.err.pwEnter").max(72),
});

/** Wrong passwords allowed per account (and in total per address) before the lock, and how long it lasts. */
const MAX_FAILURES = 4;
const MAX_FAILURES_PER_ADDRESS = 15;
const LOCK_WINDOW = WINDOW.hour;

/** Signups allowed from one address, and from everywhere together, so bots cannot flood the database. */
const SIGNUPS_PER_ADDRESS_HOUR = 5;
const SIGNUPS_PER_ADDRESS_DAY = 15;
const SIGNUPS_ANYWHERE_PER_10_MIN = 60;

// Compared against when the email is unknown, to keep response time similar.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5bQ7O8ZIOTbN0vJj5X9i1x4zV5g3a2K";

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  // A field real people never see: scripts that fill every input give themselves away. Answered
  // exactly like a rate limit, so the bot learns nothing.
  if (String(formData.get("hp_contact") ?? "") !== "") return { error: t("auth.a.tooMany") };

  // Every attempt counts, valid or not, and before the expensive password hashing.
  const ip = await clientKey();
  const withinLimits =
    (await allow("signup-ip-hour", ip, SIGNUPS_PER_ADDRESS_HOUR, WINDOW.hour)) &&
    (await allow("signup-ip-day", ip, SIGNUPS_PER_ADDRESS_DAY, WINDOW.day)) &&
    (await allow("signup-all", "all", SIGNUPS_ANYWHERE_PER_10_MIN, 10 * WINDOW.minute));
  if (!withinLimits) return { error: t("auth.a.tooMany") };

  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const { name, email, password } = parsed.data;

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) return { error: t("auth.err.exists") };

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(schema.users).values({ name, email, passwordHash }).returning({ id: schema.users.id });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const { email, password } = parsed.data;

  // Failures are counted per account and per address, for known and unknown accounts alike, so a
  // lock tells an attacker nothing about which accounts exist. While locked the password is not
  // even checked, and further attempts do not extend the lock.
  const ip = await clientKey();
  const account = keyedHash("account", email);
  const minutes = Math.max(
    await lockedForMinutes("login-fail", account, MAX_FAILURES, LOCK_WINDOW),
    await lockedForMinutes("login-fail-ip", ip, MAX_FAILURES_PER_ADDRESS, LOCK_WINDOW),
  );
  if (minutes > 0) return { error: t("auth.err.locked", { time: t("time.min", { count: minutes }) }) };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await Promise.all([record("login-fail", account), record("login-fail-ip", ip)]);
    return { error: t("auth.err.wrong") };
  }

  await clear("login-fail", account);
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
