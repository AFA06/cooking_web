import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { after } from "next/server";
import { and, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const SESSION_COOKIE = "session";
const COOKIE = SESSION_COOKIE;
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(schema.sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hashToken(token)));
  jar.delete(COOKIE);
}

export interface CurrentUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: "user" | "creator" | "admin";
  /** An admin set a temporary password; the person must choose their own before using the studio. */
  mustChangePassword: boolean;
}

/** The role behind a session token, or null for a missing, expired or blocked session. Used by the proxy, which has no cookies() helper. */
export async function roleForSession(token: string | undefined): Promise<CurrentUser["role"] | null> {
  if (!token) return null;
  const [row] = await db
    .select({ role: schema.users.role })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.tokenHash, hashToken(token)), gt(schema.sessions.expiresAt, new Date()), isNull(schema.users.blockedAt)))
    .limit(1);
  return row?.role ?? null;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: schema.users.id, email: schema.users.email, phone: schema.users.phone, name: schema.users.name, role: schema.users.role, mustChangePassword: schema.users.mustChangePassword, lastSeenAt: schema.users.lastSeenAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.tokenHash, hashToken(token)), gt(schema.sessions.expiresAt, new Date()), isNull(schema.users.blockedAt)))
    .limit(1);
  if (!row) return null;
  const { lastSeenAt, ...user } = row;
  if (!lastSeenAt || Date.now() - lastSeenAt.getTime() > ACTIVITY_EVERY_MS) markActive(user.id);
  return user;
});

/** How often a signed-in visit is written down. Often enough for daily counts, rare enough to cost nothing. */
const ACTIVITY_EVERY_MS = 10 * 60 * 1000;

/** Records that the person used the site today, after the response is sent. */
function markActive(userId: string) {
  try {
    after(async () => {
      await db.update(schema.users).set({ lastSeenAt: new Date() }).where(eq(schema.users.id, userId));
      await db
        .insert(schema.userActivity)
        .values({ userId, day: sql`(now() at time zone 'Asia/Tashkent')::date` })
        .onConflictDoNothing();
    });
  } catch {
    // Outside a request (scripts, tests) there is nothing to record.
  }
}

/** Signs the person out everywhere except the browser they are using now. */
export async function destroyOtherSessions(userId: string) {
  const token = (await cookies()).get(COOKIE)?.value;
  const condition = token
    ? and(eq(schema.sessions.userId, userId), ne(schema.sessions.tokenHash, hashToken(token)))
    : eq(schema.sessions.userId, userId);
  await db.delete(schema.sessions).where(condition);
}

/** Signs the person out on every device, including this one. Used after a password reset. */
export async function destroyAllSessions(userId: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}
