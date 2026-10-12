import "server-only";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/db";

const MINUTE = 60_000;
export const WINDOW = { minute: MINUTE, quarterHour: 15 * MINUTE, hour: 60 * MINUTE, day: 24 * 60 * MINUTE } as const;

async function tally(kind: string, keyHash: string, windowMs: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(schema.authEvents)
    .where(and(eq(schema.authEvents.kind, kind), eq(schema.authEvents.keyHash, keyHash), gt(schema.authEvents.createdAt, new Date(Date.now() - windowMs))));
  return row?.n ?? 0;
}

/** How many events of this kind the key has produced inside the window. */
export const peek = tally;

/** Records an event without checking anything. */
export async function record(kind: string, keyHash: string): Promise<void> {
  await db.insert(schema.authEvents).values({ kind, keyHash });
  // Housekeeping: old rows are useless, and a stray 1-in-50 sweep keeps the table small.
  if (Math.random() < 0.02) {
    await db.delete(schema.authEvents).where(lt(schema.authEvents.createdAt, new Date(Date.now() - 2 * WINDOW.day)));
  }
}

/**
 * Records the attempt first and then counts, so parallel requests cannot all slip under the limit.
 * Returns false once the key has gone over `max` inside the window.
 */
export async function allow(kind: string, keyHash: string, max: number, windowMs: number): Promise<boolean> {
  await record(kind, keyHash);
  return (await tally(kind, keyHash, windowMs)) <= max;
}

export async function clear(kind: string, keyHash: string): Promise<void> {
  await db.delete(schema.authEvents).where(and(eq(schema.authEvents.kind, kind), eq(schema.authEvents.keyHash, keyHash)));
}
