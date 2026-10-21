"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkPassword, normalizeEmail, parseIdentifier } from "@/lib/auth-rules";
import { parseInternational } from "@/lib/phone";
import { getT } from "@/i18n/server";
import { createSession, destroyAllSessions, destroySession } from "@/server/auth";
import { TTL_MINUTES, createChallenge, getOpenChallenge, resendChallenge, verifyChallenge } from "@/server/challenges";
import { checkSignIn } from "@/server/credentials";
import { deliverCode } from "@/server/notify";
import { WINDOW, allow, clear } from "@/server/rate-limit";
import { clientKey, keyedHash } from "@/server/security";

export interface AuthState {
  error?: string;
  ok?: string;
}

// Message keys; every one is translated with t() where it is returned.
const TOO_MANY = "auth.a.tooMany";
const BAD_CODE = "auth.a.badCode";
const GENERIC_SENT = "auth.a.genericSent";

// Only allow same-site relative redirects.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/recipes";
}

const text = (formData: FormData, name: string, max = 300) => {
  const v = formData.get(name);
  return typeof v === "string" ? v.slice(0, max) : "";
};

/** Signups allowed from one address, and from everywhere together, so bots cannot flood the database. */
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

  const result = await checkSignIn("site", ident, password);
  if ("error" in result) {
    if (result.error === "locked") return { error: t("auth.err.locked", { time: t("time.min", { count: result.minutes }) }) };
    return result.error === "blocked" ? { error: t("auth.a.blocked") } : wrong;
  }
  const { user } = result;
  await createSession(user.id);
  // A temporary password from the admin is replaced before anything else.
  if (user.mustChangePassword) redirect("/account/settings?newpw=1#sozlama-parol");
  // Without a page to return to, bloggers land in their studio.
  const asked = formData.get("next");
  const home = user.role === "creator" ? "/dashboard" : "/recipes";
  redirect(typeof asked === "string" && asked && asked !== "/recipes" ? safeNext(asked) : home);
}

export async function logout() {
  await destroySession();
  redirect("/");
}

/* ───────────── Sign-up: the account is created at once, no confirmation code ───────────── */

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "auth.err.firstName").max(40),
  lastName: z.string().trim().min(1, "auth.err.lastName").max(40),
  phone: z.string().max(40),
  email: z.string().trim().max(254),
  password: z.string().max(200),
});

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  // A field real people never see: scripts that fill every input give themselves away. Answered
  // exactly like a rate limit, so the bot learns nothing.
  if (text(formData, "hp_contact") !== "") return { error: t(TOO_MANY) };
  const parsed = signupSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  if (formData.get("terms") !== "yes") return { error: t("auth.err.terms") };
  const intl = parseInternational(parsed.data.phone);
  if (!intl) return { error: t("acct.err.phone") };
  const phone = intl.phone;
  // Optional: the only way to get a password reset code.
  const email = parsed.data.email ? normalizeEmail(parsed.data.email) : null;
  if (parsed.data.email && !email) return { error: t("auth.err.email") };
  const weak = checkPassword(parsed.data.password, phone);
  if (weak) return { error: t(weak) };

  const ip = await clientKey();
  const withinLimits =
    (await allow("signup-ip-hour", ip, SIGNUPS_PER_ADDRESS_HOUR, WINDOW.hour)) &&
    (await allow("signup-ip-day", ip, SIGNUPS_PER_ADDRESS_DAY, WINDOW.day)) &&
    (await allow("signup-all", "all", SIGNUPS_ANYWHERE_PER_10_MIN, 10 * WINDOW.minute));
  if (!withinLimits) return { error: t(TOO_MANY) };

  const [phoneTaken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (phoneTaken) return { error: t("auth.a.phoneExists") };
  if (email) {
    const [emailTaken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (emailTaken) return { error: t("auth.err.exists") };
  }

  try {
    // Nothing is marked as verified: neither the phone nor the email has been proven by a code.
    const [user] = await db
      .insert(schema.users)
      .values({ name: `${parsed.data.firstName} ${parsed.data.lastName}`, phone, email, passwordHash: await bcrypt.hash(parsed.data.password, 12) })
      .returning({ id: schema.users.id });
    await createSession(user.id);
  } catch {
    // Someone else signed up with this number or email a moment earlier.
    return { error: t("auth.a.phoneExists") };
  }
  redirect(safeNext(formData.get("next")));
}

/* ───────────── Forgot password: a code sent to the account's email ───────────── */

/**
 * Starts a reset. The answer and the next screen are identical whether or not the account exists or has an
 * email, so the form cannot be used to find out who has an account.
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
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(ident.kind === "phone" ? eq(schema.users.phone, ident.value) : eq(schema.users.email, ident.value))
    .limit(1);

  const email = user?.email;
  if (user && email && (await allow("send-dest", keyedHash("dest", email), 6, WINDOW.hour))) {
    const created = await createChallenge({ purpose: "password_reset", channel: "email", userId: user.id });
    challengeId = created.id;
    // Delivered after the response, so a real account does not answer more slowly than a decoy.
    after(async () => {
      try {
        await deliverCode(email, created.code, "password_reset", TTL_MINUTES.email, t);
      } catch (e) {
        console.error("reset delivery failed:", e instanceof Error ? e.message : "unknown");
      }
    });
  }
  redirect(`/auth/reset?c=${challengeId}`);
}

/** Re-sends a reset code. The reply never says whether the account exists. */
export async function resendPasswordResetCode(_: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const id = text(formData, "challengeId", 64);
  const reply: AuthState = { ok: t(GENERIC_SENT) };
  if (!(await allow("resend-ip", await clientKey(), 15, WINDOW.hour))) return { error: t(TOO_MANY) };

  const open = await getOpenChallenge(id, "password_reset");
  if (!open?.userId) return reply;
  const [user] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, open.userId)).limit(1);
  const email = user?.email;
  if (!email || !(await allow("send-dest", keyedHash("dest", email), 6, WINDOW.hour))) return reply;

  const next = await resendChallenge(id, "password_reset", "email");
  if (!next) return reply;
  after(async () => {
    try {
      await deliverCode(email, next.code, "password_reset", TTL_MINUTES.email, t);
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
    // The code reached the inbox, which proves the email belongs to this person.
    .set({ passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date() })
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
