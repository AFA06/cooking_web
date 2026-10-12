import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

/**
 * Key for every hash that must not be reproducible from a database dump alone (throttling keys).
 * Set AUTH_SECRET to rotate it independently; until then it is derived from DATABASE_URL,
 * which is already a secret on every deployment.
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

/** Hashed address of the caller. Vercel overwrites these headers, so a client cannot spoof them there. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return keyedHash("ip", ip);
}
