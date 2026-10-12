import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

/**
 * Key for every hash that must not be reproducible from a database dump alone (codes, IP and
 * identifier throttling keys). Set AUTH_SECRET to rotate it independently; until then it is derived
 * from DATABASE_URL, which is already a secret on every deployment.
 */
function key(): Buffer {
  const base = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
  if (!base) throw new Error("AUTH_SECRET or DATABASE_URL must be set");
  return createHmac("sha256", "damda-auth-v1").update(base).digest();
}

/** Keyed hash, domain-separated by scope so a value hashed for one purpose can't stand in for another. */
export function keyedHash(scope: string, value: string): string {
  return createHmac("sha256", key()).update(`${scope}\0${value}`).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Six uniformly random digits from the OS CSPRNG. */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(challengeId: string, code: string): string {
  return keyedHash("code", `${challengeId}:${code}`);
}

/** Hashed address of the caller. Vercel overwrites these headers, so a client cannot spoof them there. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return keyedHash("ip", ip);
}
