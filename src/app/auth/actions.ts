"use server";

import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkPassword, normalizeUzPhone, parseIdentifier } from "@/lib/auth-rules";
import { createSession, destroyAllSessions, destroySession } from "@/server/auth";
import { TTL_MINUTES, createChallenge, getOpenChallenge, resendChallenge, verifyChallenge } from "@/server/challenges";
import { DeliveryUnavailable, deliverCode, sendAccountExistsNotice } from "@/server/notify";
import { WINDOW, allow, clear, peek, record } from "@/server/rate-limit";
import { clientKey, keyedHash, safeEqual } from "@/server/security";

export interface AuthState {
  error?: string;
  ok?: string;
}

const TOO_MANY = "Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.";
const BAD_CODE = "Kod noto‘g‘ri yoki muddati tugagan.";
const UNAVAILABLE = "SMS xizmati hozircha ishlamayapti. Birozdan so‘ng qayta urinib ko‘ring.";
const GENERIC_SENT = "Agar hisob mavjud bo‘lsa, kod yuborildi.";

// Only allow same-site relative redirects.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/recipes";
}

const withNext = (path: string, next: string) => (next && next !== "/recipes" ? `${path}&next=${encodeURIComponent(next)}` : path);
const text = (formData: FormData, name: string, max = 300) => {
  const v = formData.get(name);
  return typeof v === "string" ? v.slice(0, max) : "";
};

/**
 * A pending signup is tied to the browser that started it. Without this, someone could start a signup
 * for another person's number with a password they chose, and the real owner, typing the SMS code
 * they receive, would complete an account the attacker can sign in to.
 */
const BIND_COOKIE = "signup_bind";

async function bindToBrowser(): Promise<string> {
  const secret = randomBytes(24).toString("hex");
  (await cookies()).set(BIND_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth",
    maxAge: 60 * 60,
  });
  return keyedHash("bind", secret);
}

async function isBoundToThisBrowser(expected: string | undefined): Promise<boolean> {
  const secret = (await cookies()).get(BIND_COOKIE)?.value;
  return !!expected && !!secret && safeEqual(keyedHash("bind", secret), expected);
}

// Compared against when the account is unknown, so response time does not reveal whether it exists.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5bQ7O8ZIOTbN0vJj5X9i1x4zV5g3a2K";

/* ───────────── Sign-in ───────────── */

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const wrong = { error: "Telefon yoki email, yoki parol noto‘g‘ri." };
  const ident = parseIdentifier(text(formData, "identifier", 254));
  const password = text(formData, "password", 200);
  if (!ident || !password) return wrong;

  const ip = await clientKey();
  const idKey = keyedHash("ident", ident.value);
  // Failures are counted per caller and per account, for known and unknown accounts alike,
  // so a lockout tells an attacker nothing about which accounts exist.
  if ((await peek("login-fail", ip, WINDOW.quarterHour)) >= 30 || (await peek("login-fail", idKey, WINDOW.quarterHour)) >= 8) {
    return { error: "Juda ko‘p noto‘g‘ri urinish. 15 daqiqadan so‘ng qayta urinib ko‘ring." };
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(ident.kind === "phone" ? eq(schema.users.phone, ident.value) : eq(schema.users.email, ident.value))
    .limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await Promise.all([record("login-fail", ip), record("login-fail", idKey)]);
    return wrong;
  }

  await clear("login-fail", idKey);
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

/* ───────────── Sign-up, verified by SMS ───────────── */

const signupSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting").max(80),
  phone: z.string().max(40),
  password: z.string().max(200),
});

export async function startSignup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const phone = normalizeUzPhone(parsed.data.phone);
  if (!phone) return { error: "Telefon raqami noto‘g‘ri. Masalan: +998 90 123 45 67" };
  const weak = checkPassword(parsed.data.password, phone);
  if (weak) return { error: weak };

  const ip = await clientKey();
  const phoneKey = keyedHash("dest", phone);
  if (!(await allow("signup-ip", ip, 10, WINDOW.hour)) || !(await allow("send-dest", phoneKey, 6, WINDOW.hour))) return { error: TOO_MANY };

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  // Hash even when the number is taken, so both paths cost the same time.
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  let challengeId: string;
  try {
    if (existing) {
      // Same screens and same answer as a real signup, so the form cannot be used to probe who has an account.
      // The number's owner is told by SMS instead.
      ({ id: challengeId } = await createChallenge({ purpose: "signup", channel: "sms", destination: phone, inert: true }));
      await sendAccountExistsNotice(phone);
    } else {
      const created = await createChallenge({
        purpose: "signup",
        channel: "sms",
        destination: phone,
        payload: { name: parsed.data.name, passwordHash, bind: await bindToBrowser() },
      });
      challengeId = created.id;
      try {
        await deliverCode("sms", phone, created.code, "signup", TTL_MINUTES.sms);
      } catch (e) {
        await db.delete(schema.authChallenges).where(eq(schema.authChallenges.id, created.id));
        throw e;
      }
    }
  } catch (e) {
    console.error("signup delivery failed:", e instanceof Error ? e.message : "unknown");
    return { error: e instanceof DeliveryUnavailable ? UNAVAILABLE : "Kod yuborib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring." };
  }

  redirect(withNext(`/auth/verify?c=${challengeId}`, safeNext(formData.get("next"))));
}

export async function verifySignup(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await allow("verify-ip", await clientKey(), 40, WINDOW.hour))) return { error: TOO_MANY };
  const row = await verifyChallenge(text(formData, "challengeId", 64), text(formData, "code", 12).trim(), "signup");
  if (!row || row.payload?.inert === "1" || !row.payload?.passwordHash || !row.destination) return { error: BAD_CODE };
  if (!(await isBoundToThisBrowser(row.payload.bind))) return { error: "Bu so‘rov boshqa qurilmadan boshlangan. Hisob yaratishni shu qurilmada qaytadan boshlang." };

  let userId: string;
  try {
    const [user] = await db
      .insert(schema.users)
      .values({ name: row.payload.name ?? "", phone: row.destination, phoneVerifiedAt: new Date(), passwordHash: row.payload.passwordHash })
      .returning({ id: schema.users.id });
    userId = user.id;
  } catch {
    // Someone else completed a signup for this number first.
    return { error: "Bu raqam bilan hisob allaqachon mavjud. Tizimga kiring." };
  }
  await createSession(userId);
  redirect(safeNext(formData.get("next")));
}

/** Sends the signup code again (same challenge, new code). */
export async function resendSignupCode(_: AuthState, formData: FormData): Promise<AuthState> {
  const id = text(formData, "challengeId", 64);
  const ip = await clientKey();
  if (!(await allow("resend-ip", ip, 15, WINDOW.hour))) return { error: TOO_MANY };
  const open = await getOpenChallenge(id, "signup");
  if (!open || !open.destination) return { error: "Kod muddati tugagan. Qaytadan boshlang." };
  if (open.payload?.inert === "1") return { ok: "Kod yuborildi." };
  if (!(await allow("send-dest", keyedHash("dest", open.destination), 6, WINDOW.hour))) return { error: TOO_MANY };

  const next = await resendChallenge(id, "signup", "sms");
  if (!next) return { error: "Biroz kuting, so‘ng qayta urinib ko‘ring." };
  try {
    await deliverCode("sms", open.destination, next.code, "signup", TTL_MINUTES.sms);
  } catch (e) {
    console.error("signup resend failed:", e instanceof Error ? e.message : "unknown");
    return { error: UNAVAILABLE };
  }
  return { ok: "Yangi kod yuborildi." };
}

/* ───────────── Forgot password ───────────── */

/**
 * Starts a reset. The answer and the next screen are identical whether or not the account exists.
 * The code goes to the account's verified email when it has one, otherwise to its verified phone.
 */
export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const ident = parseIdentifier(text(formData, "identifier", 254));
  if (!ident) return { error: "Telefon raqamingiz yoki emailingizni to‘g‘ri kiriting." };

  const ip = await clientKey();
  if (!(await allow("reset-ip", ip, 10, WINDOW.hour)) || !(await allow("reset-ident", keyedHash("ident", ident.value), 5, WINDOW.hour))) {
    return { error: TOO_MANY };
  }

  let challengeId: string = randomUUID(); // a decoy: the reset screen cannot tell it from a real one
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email, emailVerifiedAt: schema.users.emailVerifiedAt, phone: schema.users.phone, phoneVerifiedAt: schema.users.phoneVerifiedAt })
    .from(schema.users)
    .where(ident.kind === "phone" ? eq(schema.users.phone, ident.value) : eq(schema.users.email, ident.value))
    .limit(1);

  if (user) {
    const viaEmail = user.email && user.emailVerifiedAt ? user.email : null;
    const viaSms = user.phone && user.phoneVerifiedAt ? user.phone : null;
    const channel = viaEmail ? "email" : viaSms ? "sms" : null;
    const destination = viaEmail ?? viaSms;
    if (channel && destination && (await allow("send-dest", keyedHash("dest", destination), 6, WINDOW.hour))) {
      const created = await createChallenge({ purpose: "password_reset", channel, userId: user.id });
      challengeId = created.id;
      // Delivered after the response, so a real account does not answer more slowly than a decoy.
      after(async () => {
        try {
          await deliverCode(channel, destination, created.code, "password_reset", TTL_MINUTES[channel]);
        } catch (e) {
          console.error("reset delivery failed:", e instanceof Error ? e.message : "unknown");
        }
      });
    }
  }
  redirect(`/auth/reset?c=${challengeId}`);
}

/**
 * Re-sends a reset code. `via=sms` switches an email reset to the phone for people who cannot reach
 * their inbox. The reply never says whether the account or the channel exists.
 */
export async function resendPasswordResetCode(_: AuthState, formData: FormData): Promise<AuthState> {
  const id = text(formData, "challengeId", 64);
  const viaSms = text(formData, "via", 8) === "sms";
  const reply: AuthState = { ok: GENERIC_SENT };
  if (!(await allow("resend-ip", await clientKey(), 15, WINDOW.hour))) return { error: TOO_MANY };

  const open = await getOpenChallenge(id, "password_reset");
  if (!open?.userId) return reply;
  const [user] = await db
    .select({ email: schema.users.email, emailVerifiedAt: schema.users.emailVerifiedAt, phone: schema.users.phone, phoneVerifiedAt: schema.users.phoneVerifiedAt })
    .from(schema.users)
    .where(eq(schema.users.id, open.userId))
    .limit(1);
  if (!user) return reply;

  const email = user.email && user.emailVerifiedAt ? user.email : null;
  const phone = user.phone && user.phoneVerifiedAt ? user.phone : null;
  const channel = viaSms ? (phone ? "sms" : null) : open.channel === "email" && email ? "email" : phone ? "sms" : null;
  const destination = channel === "email" ? email : phone;
  if (!channel || !destination) return reply;
  if (!(await allow("send-dest", keyedHash("dest", destination), 6, WINDOW.hour))) return reply;

  const next = await resendChallenge(id, "password_reset", channel);
  if (!next) return reply;
  after(async () => {
    try {
      await deliverCode(channel, destination, next.code, "password_reset", TTL_MINUTES[channel]);
    } catch (e) {
      console.error("reset resend failed:", e instanceof Error ? e.message : "unknown");
    }
  });
  return reply;
}

export async function completePasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await allow("verify-ip", await clientKey(), 40, WINDOW.hour))) return { error: TOO_MANY };
  const password = text(formData, "newPassword", 200);
  if (password !== text(formData, "confirmPassword", 200)) return { error: "Parollar bir xil emas." };
  // Checked before the code is spent, so a weak password does not burn it.
  const weak = checkPassword(password);
  if (weak) return { error: weak };

  const row = await verifyChallenge(text(formData, "challengeId", 64), text(formData, "code", 12).trim(), "password_reset");
  if (!row?.userId) return { error: BAD_CODE };

  const [user] = await db
    .update(schema.users)
    .set({ passwordHash: await bcrypt.hash(password, 12) })
    .where(eq(schema.users.id, row.userId))
    .returning({ phone: schema.users.phone, email: schema.users.email });
  if (!user) return { error: BAD_CODE };

  // Anyone who held the old password or an old session is out, and no other reset code stays usable.
  await destroyAllSessions(row.userId);
  await db
    .update(schema.authChallenges)
    .set({ consumedAt: new Date() })
    .where(and(eq(schema.authChallenges.userId, row.userId), isNull(schema.authChallenges.consumedAt)));
  await Promise.all(
    [user.phone, user.email].filter((v): v is string => !!v).map((v) => clear("login-fail", keyedHash("ident", v))),
  );
  redirect("/auth/login?reset=1");
}
