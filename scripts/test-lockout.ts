import { config } from "dotenv";
config({ path: ".env.local" });
import assert from "node:assert/strict";

/** Exercises the login lockout and the signup limiter against the real database, then cleans up. */
async function main() {
  const { db, schema } = await import("../src/db");
  const { eq, like } = await import("drizzle-orm");
  void like;
  const rl = await import("../src/server/rate-limit");
  const { keyedHash } = await import("../src/server/security");

  const key = keyedHash("account", `lockout-test-${Date.now()}@example.com`);
  const ip = keyedHash("ip", `10.0.0.${Math.floor(Math.random() * 250)}-${Date.now()}`);
  const kinds = ["login-fail", "signup-ip-hour"];
  try {
    for (let i = 1; i <= 3; i++) {
      await rl.record("login-fail", key);
      assert.equal(await rl.lockedForMinutes("login-fail", key, 4, rl.WINDOW.hour), 0, `still open after ${i} failures`);
    }
    await rl.record("login-fail", key);
    const minutes = await rl.lockedForMinutes("login-fail", key, 4, rl.WINDOW.hour);
    assert.ok(minutes >= 59 && minutes <= 60, `locked for about an hour, got ${minutes}`);
    console.log("  ✓ 3 wrong passwords: open, 4th: locked for", minutes, "min");

    // the lock ends once the oldest of the four failures is more than an hour old
    await db.update(schema.authEvents).set({ createdAt: new Date(Date.now() - 61 * 60_000) }).where(eq(schema.authEvents.keyHash, key));
    assert.equal(await rl.lockedForMinutes("login-fail", key, 4, rl.WINDOW.hour), 0);
    console.log("  ✓ lock lifts after an hour");

    await rl.clear("login-fail", key);
    await rl.record("login-fail", key);
    assert.equal(await rl.lockedForMinutes("login-fail", key, 4, rl.WINDOW.hour), 0);
    console.log("  ✓ clear() resets the counter");

    const results: boolean[] = [];
    for (let i = 0; i < 7; i++) results.push(await rl.allow("signup-ip-hour", ip, 5, rl.WINDOW.hour));
    assert.deepEqual(results, [true, true, true, true, true, false, false]);
    console.log("  ✓ signup limiter: 5 allowed, 6th and 7th refused");
    console.log("\nAll lockout checks passed.");
  } finally {
    for (const k of [key, ip]) for (const kind of kinds) await rl.clear(kind, k);
  }
}
main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
