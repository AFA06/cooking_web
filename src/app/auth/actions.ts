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
import { getT } from "@/i18n/server";
import { createSession, destroyAllSessions, destroySession } from "@/server/auth";
import { TTL_MINUTES, createChallenge, getOpenChallenge, resendChallenge, verifyChallenge } from "@/server/challenges";
import { DeliveryUnavailable, deliverCode, sendAccountExistsNotice } from "@/server/notify";
import { WINDOW, allow, clear, lockedForMinutes, record } from "@/server/rate-limit";
import { clientKey, keyedHash, safeEqual } from "@/server/security";

export interface AuthState {
  error?: string;
  ok?: string;
}

// Message keys; every one is translated with t() where it is returned.
const TOO_MANY = "auth.a.tooMany";
const BAD_CODE = "auth.a.badCode";
const UNAVAILABLE = "auth.a.unavailable";
const GENERIC_SENT = "auth.a.genericSent";

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

/** Wrong passwords allowed per account (and in total per address) before the lock, and how long it lasts. */
const MAX_FAILURES = 4;
const MAX_FAILURES_PER_ADDRESS = 15;
const LOCK_WINDOW = WINDOW.hour;

/** Signups allowed from one address, and from everywhere together, so bots cannot flood the database or the SMS balance. */
const SIGNUPS_PER_ADDRESS_HOUR = 5;
const SIGNUPS_PER_ADDRESS_DAY = 15;
const SIGNUPS_ANYWHERE_PER_10_MIN = 60;

/* ───────────── Sign-in ───────────── */

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const wrong = { error: t("auth.a.loginWrong") };
  const ident = parseIdentifier(text(formData, "identifier", 254));
  const password = text(formData, "password", 200);
  if (!ident || !password) return wrong;

  // Failures are counted per account and per address, for known and unknown accounts alike, so a
  // lock tells an attacker nothing about which accounts exist. While locked the password is not
  // even checked, and further attempts do not extend the lock.
  const ip = await clientKey();
  const idKey = keyedHash("ident", ident.value);
  const minutes = Math.max(
    await lockedForMinutes("login-fail", idKey, MAX_FAILURES, LOCK_WINDOW),
    await lockedForMinutes("login-fail-ip", ip, MAX_FAILURES_PER_ADDRESS, LOCK_WINDOW),
  );
  if (minutes > 0) return { error: t("auth.err.locked", { time: t("time.min", { count: minutes }) }) };

  const [user] = await db
    .select()
    .from(schema.users)
    .where(ident.kind === "phone" ? eq(schema.users.phone, ident.value) : eq(schema.users.email, ident.value))
    .limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await Promise.all([record("login-fail", idKey), record("login-fail-ip", ip)]);
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
  name: z.string().trim().min(2, "auth.err.name").max(80),
  phone: z.string().max(40),
  password: z.string().max(200),
});

export async function startSignup(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  // A field real people never see: scripts that fill every input give themselves away. Answered
  // exactly like a rate limit, so the bot learns nothing.
  if (text(formData, "hp_contact") !== "") return { error: t(TOO_MANY) };
  const parsed = signupSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone"), password: formData.get("password") });
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const phone = normalizeUzPhone(parsed.data.phone);
  if (!phone) return { error: t("acct.err.phone") };
  const weak = checkPassword(parsed.data.password, phone);
  if (weak) return { error: t(weak) };

  const ip = await clientKey();
  const phoneKey = keyedHash("dest", phone);
  const withinLimits =
    (await allow("signup-ip-hour", ip, SIGNUPS_PER_ADDRESS_HOUR, WINDOW.hour)) &&
    (await allow("signup-ip-day", ip, SIGNUPS_PER_ADDRESS_DAY, WINDOW.day)) &&
    (await allow("signup-all", "all", SIGNUPS_ANYWHERE_PER_10_MIN, 10 * WINDOW.minute)) &&
    (await allow("send-dest", phoneKey, 6, WINDOW.hour));
  if (!withinLimits) return { error: t(TOO_MANY) };

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  // Hash even when the number is taken, so both paths cost the same time.
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  let challengeId: string;
  try {
    if (existing) {
      // Same screens and same answer as a real signup, so the form cannot be used to probe who has an account.
      // The number's owner is told by SMS instead.
      ({ id: challengeId } = await createChallenge({ purpose: "signup", channel: "sms", destination: phone, inert: true }));
      await sendAccountExistsNotice(phone, t);
    } else {
      const created = await createChallenge({
        purpose: "signup",
        channel: "sms",
        destination: phone,
        payload: { name: parsed.data.name, passwordHash, bind: await bindToBrowser() },
      });
      challengeId = created.id;
      try {
        await deliverCode("sms", phone, created.code, "signup", TTL_MINUTES.sms, t);
      } catch (e) {
        await db.delete(schema.authChallenges).where(eq(schema.authChallenges.id, created.id));
        throw e;
      }
    }
  } catch (e) {
    console.error("signup delivery failed:", e instanceof Error ? e.message : "unknown");
    return { error: e instanceof DeliveryUnavailable ? t(UNAVAILABLE) : t("auth.a.sendFailed") };
  }

  redirect(withNext(`/auth/verify?c=${challengeId}`, safeNext(formData.get("next"))));
}

export async function verifySignup(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  if (!(await allow("verify-ip", await clientKey(), 40, WINDOW.hour))) return { error: t(TOO_MANY) };
  const row = await verifyChallenge(text(formData, "challengeId", 64), text(formData, "code", 12).trim(), "signup");
  if (!row || row.payload?.inert === "1" || !row.payload?.passwordHash || !row.destination) return { error: t(BAD_CODE) };
  if (!(await isBoundToThisBrowser(row.payload.bind))) return { error: t("auth.a.wrongBrowser") };

  let userId: string;
  try {
    const [user] = await db
      .insert(schema.users)
      .values({ name: row.payload.name ?? "", phone: row.destination, phoneVerifiedAt: new Date(), passwordHash: row.payload.passwordHash })
      .returning({ id: schema.users.id });
    userId = user.id;
  } catch {
    // Someone else completed a signup for this number first.
    return { error: t("auth.a.phoneExists") };
  }
  await createSession(userId);
  redirect(safeNext(formData.get("next")));
}

/** Sends the signup code again (same challenge, new code). */
export async function resendSignupCode(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const id = text(formData, "challengeId", 64);
  const ip = await clientKey();
  if (!(await allow("resend-ip", ip, 15, WINDOW.hour))) return { error: t(TOO_MANY) };
  const open = await getOpenChallenge(id, "signup");
  if (!open || !open.destination) return { error: t("auth.a.codeExpiredRestart") };
  if (open.payload?.inert === "1") return { ok: t("auth.a.codeSent") };
  if (!(await allow("send-dest", keyedHash("dest", open.destination), 6, WINDOW.hour))) return { error: t(TOO_MANY) };

  const next = await resendChallenge(id, "signup", "sms");
  if (!next) return { error: t("auth.a.waitRetry") };
  try {
    await deliverCode("sms", open.destination, next.code, "signup", TTL_MINUTES.sms, t);
  } catch (e) {
    console.error("signup resend failed:", e instanceof Error ? e.message : "unknown");
    return { error: t(UNAVAILABLE) };
  }
  return { ok: t("auth.a.newCodeSent") };
}

/* ───────────── Forgot password ───────────── */

/**
 * Starts a reset. The answer and the next screen are identical whether or not the account exists.
 * The code goes to the account's verified email when it has one, otherwise to its verified phone.
 */
export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const ident = parseIdentifier(text(formData, "identifier", 254));
  if (!ident) return { error: t("auth.a.identBad") };

  const ip = await clientKey();
  if (!(await allow("reset-ip", ip, 10, WINDOW.hour)) || !(await allow("reset-ident", keyedHash("ident", ident.value), 5, WINDOW.hour))) {
    return { error: t(TOO_MANY) };
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
          await deliverCode(channel, destination, created.code, "password_reset", TTL_MINUTES[channel], t);
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
  const t = await getT();
  const id = text(formData, "challengeId", 64);
  const viaSms = text(formData, "via", 8) === "sms";
  const reply: AuthState = { ok: t(GENERIC_SENT) };
  if (!(await allow("resend-ip", await clientKey(), 15, WINDOW.hour))) return { error: t(TOO_MANY) };

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
      await deliverCode(channel, destination, next.code, "password_reset", TTL_MINUTES[channel], t);
    } catch (e) {
      console.error("reset resend failed:", e instanceof Error ? e.message : "unknown");
    }
  });
  return reply;
}

export async function completePasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  if (!(await allow("verify-ip", await clientKey(), 40, WINDOW.hour))) return { error: t(TOO_MANY) };
  const password = text(formData, "newPassword", 200);
  if (password !== text(formData, "confirmPassword", 200)) return { error: t("auth.a.pwMismatch") };
  // Checked before the code is spent, so a weak password does not burn it.
  const weak = checkPassword(password);
  if (weak) return { error: t(weak) };

  const row = await verifyChallenge(text(formData, "challengeId", 64), text(formData, "code", 12).trim(), "password_reset");
  if (!row?.userId) return { error: t(BAD_CODE) };

  const [user] = await db
    .update(schema.users)
    .set({ passwordHash: await bcrypt.hash(password, 12) })
    .where(eq(schema.users.id, row.userId))
    .returning({ phone: schema.users.phone, email: schema.users.email });
  if (!user) return { error: t(BAD_CODE) };

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
