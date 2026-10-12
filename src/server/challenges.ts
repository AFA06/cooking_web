import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, gt, isNull, lt, lte, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from "@/lib/auth-rules";
import { generateCode, hashCode, safeEqual } from "@/server/security";
import { WINDOW, peek, record } from "@/server/rate-limit";

export type Challenge = typeof schema.authChallenges.$inferSelect;
export type Purpose = Challenge["purpose"];
export type Channel = Challenge["channel"];

/** Minutes a code stays valid. SMS is shorter: it is delivered in seconds and often read over a shoulder. */
export const TTL_MINUTES: Record<Channel, number> = { sms: 5, email: 10 };
/** Wrong guesses allowed against one code. */
const MAX_ATTEMPTS = 5;
/** Times one challenge may be (re)sent. */
const MAX_SENDS = 4;
/** Wrong guesses allowed against one account or number inside a day, across every code it was ever sent. */
const MAX_FAILURES_PER_TARGET_PER_DAY = 10;
/** A challenge stops being resendable after this long, however many sends are left. */
const MAX_LIFETIME_MS = WINDOW.hour;

const expiry = (channel: Channel) => new Date(Date.now() + TTL_MINUTES[channel] * 60_000);
const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

interface NewChallenge {
  purpose: Purpose;
  channel: Channel;
  destination?: string | null;
  userId?: string | null;
  payload?: Record<string, string> | null;
  /** Set when the number already has an account: a real row is stored (so the screens look identical) but its code is unguessable and never sent. */
  inert?: boolean;
}

/** Stores a fresh challenge, retiring any open one for the same purpose and target. Returns the plain code once. */
export async function createChallenge(input: NewChallenge): Promise<{ id: string; code: string }> {
  const id = randomUUID();
  const code = input.inert ? randomUUID() : generateCode();
  const target = input.userId
    ? eq(schema.authChallenges.userId, input.userId)
    : input.destination
      ? eq(schema.authChallenges.destination, input.destination)
      : undefined;
  if (target) {
    await db
      .update(schema.authChallenges)
      .set({ consumedAt: new Date() })
      .where(and(eq(schema.authChallenges.purpose, input.purpose), target, isNull(schema.authChallenges.consumedAt)));
  }
  await db.insert(schema.authChallenges).values({
    id,
    purpose: input.purpose,
    channel: input.channel,
    destination: input.destination ?? null,
    userId: input.userId ?? null,
    payload: input.inert ? { ...input.payload, inert: "1" } : (input.payload ?? null),
    codeHash: hashCode(id, code),
    expiresAt: expiry(input.channel),
  });
  return { id, code };
}

/** An open challenge (not used, not expired) or null. Safe to call with untrusted ids. */
export async function getOpenChallenge(id: string, purpose: Purpose): Promise<Challenge | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select()
    .from(schema.authChallenges)
    .where(
      and(
        eq(schema.authChallenges.id, id),
        eq(schema.authChallenges.purpose, purpose),
        isNull(schema.authChallenges.consumedAt),
        gt(schema.authChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Issues a new code on an existing challenge. One atomic UPDATE enforces the cooldown, the send
 * cap and the lifetime, so two parallel clicks cannot both succeed. Returns null when refused.
 */
export async function resendChallenge(id: string, purpose: Purpose, channel: Channel): Promise<{ row: Challenge; code: string } | null> {
  if (!isUuid(id)) return null;
  const code = generateCode();
  const now = Date.now();
  const [row] = await db
    .update(schema.authChallenges)
    .set({
      codeHash: hashCode(id, code),
      attempts: 0,
      sendCount: sql`${schema.authChallenges.sendCount} + 1`,
      lastSentAt: new Date(now),
      expiresAt: expiry(channel),
      channel,
    })
    .where(
      and(
        eq(schema.authChallenges.id, id),
        eq(schema.authChallenges.purpose, purpose),
        isNull(schema.authChallenges.consumedAt),
        lt(schema.authChallenges.sendCount, MAX_SENDS),
        lte(schema.authChallenges.lastSentAt, new Date(now - RESEND_COOLDOWN_SECONDS * 1000)),
        gt(schema.authChallenges.createdAt, new Date(now - MAX_LIFETIME_MS)),
        // The code of an inert (existing-number) signup is never re-sent: that would defeat the point.
        ne(sql`coalesce(${schema.authChallenges.payload}->>'inert', '')`, "1"),
      ),
    )
    .returning();
  return row ? { row, code } : null;
}

/** Seconds until the next resend is allowed (0 when it is allowed now). */
export function cooldownLeft(challenge: Pick<Challenge, "lastSentAt">): number {
  const left = RESEND_COOLDOWN_SECONDS - (Date.now() - challenge.lastSentAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(left));
}

export const isCodeShape = (code: string) => new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);

/**
 * Checks a code and consumes the challenge. Order matters:
 *  1. count the attempt atomically *before* comparing, so racing guesses cannot exceed the cap;
 *  2. compare in constant time;
 *  3. mark the challenge used atomically, so one code can be redeemed exactly once.
 * Every failure looks the same to the caller.
 */
export async function verifyChallenge(id: string, code: string, purpose: Purpose): Promise<Challenge | null> {
  if (!isUuid(id) || !isCodeShape(code)) return null;
  const open = await getOpenChallenge(id, purpose);
  if (!open) return null;

  // Daily failure budget per target: a patient attacker cannot get a fresh 5 guesses per new code forever.
  const targetKey = open.userId ?? open.destination ?? open.id;
  if ((await peek("code-fail", targetKey, WINDOW.day)) >= MAX_FAILURES_PER_TARGET_PER_DAY) return null;

  const [counted] = await db
    .update(schema.authChallenges)
    .set({ attempts: sql`${schema.authChallenges.attempts} + 1` })
    .where(
      and(
        eq(schema.authChallenges.id, id),
        isNull(schema.authChallenges.consumedAt),
        gt(schema.authChallenges.expiresAt, new Date()),
        lt(schema.authChallenges.attempts, MAX_ATTEMPTS),
      ),
    )
    .returning();
  if (!counted) return null;

  if (!safeEqual(counted.codeHash, hashCode(id, code))) {
    await record("code-fail", targetKey);
    return null;
  }

  const [used] = await db
    .update(schema.authChallenges)
    .set({ consumedAt: new Date() })
    .where(and(eq(schema.authChallenges.id, id), isNull(schema.authChallenges.consumedAt)))
    .returning();
  return used ?? null;
}

/** Removes challenges that expired more than a day ago. Cheap, and called opportunistically. */
export async function sweepChallenges() {
  await db.delete(schema.authChallenges).where(lt(schema.authChallenges.expiresAt, new Date(Date.now() - WINDOW.day)));
}
