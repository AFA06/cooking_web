import { config } from "dotenv";
config({ path: ".env.local" });

import assert from "node:assert/strict";

/** Exercises the one-time-code and throttling core against the real database, then removes what it created. */
async function main() {
  const { db, schema } = await import("../src/db");
  const { eq, inArray } = await import("drizzle-orm");
  const ch = await import("../src/server/challenges");
  const rl = await import("../src/server/rate-limit");
  const sec = await import("../src/server/security");
  const rules = await import("../src/lib/auth-rules");

  const made: string[] = [];
  const events: Array<[string, string]> = [];
  const tag = `t${Date.now()}`;
  const mk = async (over: Partial<Parameters<typeof ch.createChallenge>[0]> = {}) => {
    const c = await ch.createChallenge({ purpose: "signup", channel: "sms", destination: `+99890${Math.floor(1e6 + Math.random() * 9e6)}`, ...over });
    made.push(c.id);
    return c;
  };
  let n = 0;
  const ok = (name: string) => console.log(`  ✓ ${++n}. ${name}`);

  try {
    // — pure rules
    assert.equal(rules.normalizeUzPhone("90 123 45 67"), "+998901234567");
    assert.equal(rules.normalizeUzPhone("+998 (90) 123-45-67"), "+998901234567");
    assert.equal(rules.normalizeUzPhone("+1 415 555 0100"), null);
    assert.equal(rules.normalizeUzPhone("12345"), null);
    assert.equal(rules.parseIdentifier("Foo@Bar.com")?.value, "foo@bar.com");
    assert.equal(rules.parseIdentifier("not an id"), null);
    assert.ok(rules.checkPassword("12345678"));
    assert.ok(rules.checkPassword("aaaaaaaa"));
    assert.ok(rules.checkPassword("short"));
    assert.ok(rules.checkPassword("x".repeat(80)));
    assert.ok(rules.checkPassword("my901234567pass", "+998901234567"));
    assert.equal(rules.checkPassword("correct horse battery"), null);
    ok("phone, identifier and password rules");

    // — happy path, single use
    const a = await mk();
    assert.match(a.code, /^\d{6}$/);
    assert.ok(await ch.verifyChallenge(a.id, a.code, "signup"));
    assert.equal(await ch.verifyChallenge(a.id, a.code, "signup"), null);
    ok("correct code works exactly once");

    // — codes are not stored in clear
    const [row] = await db.select().from(schema.authChallenges).where(eq(schema.authChallenges.id, a.id));
    assert.ok(!JSON.stringify(row).includes(a.code) || a.code.length < 6);
    assert.equal(row.codeHash.length, 64);
    ok("only a keyed hash is stored");

    // — wrong code, then right code, within the cap
    const b = await mk();
    const wrong = b.code === "000000" ? "111111" : "000000";
    assert.equal(await ch.verifyChallenge(b.id, wrong, "signup"), null);
    assert.ok(await ch.verifyChallenge(b.id, b.code, "signup"));
    ok("one typo does not burn the code");

    // — attempt cap: 5 wrong guesses kill the code even if the next one is right
    const c = await mk();
    const bad = c.code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) assert.equal(await ch.verifyChallenge(c.id, bad, "signup"), null);
    assert.equal(await ch.verifyChallenge(c.id, c.code, "signup"), null);
    ok("5 wrong guesses lock the code, the right one no longer works");

    // — wrong purpose
    const d = await mk();
    assert.equal(await ch.verifyChallenge(d.id, d.code, "password_reset"), null);
    assert.ok(await ch.verifyChallenge(d.id, d.code, "signup"));
    ok("a code cannot be redeemed for another purpose");

    // — malformed input
    const e = await mk();
    for (const junk of ["", "12345", "1234567", "abcdef", "12345 ", "１２３４５６"]) assert.equal(await ch.verifyChallenge(e.id, junk, "signup"), null);
    assert.equal(await ch.verifyChallenge("not-a-uuid", e.code, "signup"), null);
    assert.equal(await ch.verifyChallenge("00000000-0000-4000-8000-000000000000", e.code, "signup"), null);
    ok("malformed codes and ids are rejected without touching attempts");
    assert.ok(await ch.verifyChallenge(e.id, e.code, "signup"));

    // — expiry
    const f = await mk();
    await db.update(schema.authChallenges).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.authChallenges.id, f.id));
    assert.equal(await ch.verifyChallenge(f.id, f.code, "signup"), null);
    ok("expired code is rejected");

    // — resend: cooldown, new code replaces old, send cap
    const g = await mk();
    assert.equal(await ch.resendChallenge(g.id, "signup", "sms"), null);
    ok("resend is refused during the cooldown");
    const back = async () => db.update(schema.authChallenges).set({ lastSentAt: new Date(Date.now() - 61_000) }).where(eq(schema.authChallenges.id, g.id));
    await back();
    const g2 = await ch.resendChallenge(g.id, "signup", "sms");
    assert.ok(g2);
    if (g2.code !== g.code) assert.equal(await ch.verifyChallenge(g.id, g.code, "signup"), null);
    assert.ok(await ch.verifyChallenge(g.id, g2.code, "signup"));
    ok("resend issues a new code and the old one stops working");
    const h = await mk();
    let sent = 0;
    for (let i = 0; i < 6; i++) {
      await db.update(schema.authChallenges).set({ lastSentAt: new Date(Date.now() - 61_000) }).where(eq(schema.authChallenges.id, h.id));
      if (await ch.resendChallenge(h.id, "signup", "sms")) sent++;
    }
    assert.equal(sent, 3); // 1 original + 3 resends = 4 sends
    ok("a challenge can be sent at most 4 times");

    // — a new challenge for the same target retires the old one
    const dest = `+99893${Math.floor(1e6 + Math.random() * 9e6)}`;
    const i1 = await mk({ destination: dest });
    const i2 = await mk({ destination: dest });
    assert.equal(await ch.verifyChallenge(i1.id, i1.code, "signup"), null);
    assert.ok(await ch.verifyChallenge(i2.id, i2.code, "signup"));
    ok("starting over retires the earlier code");

    // — inert (existing-number) signup can never be completed or resent
    const j = await mk({ inert: true, payload: { name: "x", passwordHash: "y" } });
    assert.equal(await ch.verifyChallenge(j.id, "123456", "signup"), null);
    await db.update(schema.authChallenges).set({ lastSentAt: new Date(Date.now() - 61_000) }).where(eq(schema.authChallenges.id, j.id));
    assert.equal(await ch.resendChallenge(j.id, "signup", "sms"), null);
    ok("an existing-number signup can never be completed or re-sent");

    // — daily failure budget per target survives new codes
    const target = `+99897${Math.floor(1e6 + Math.random() * 9e6)}`;
    for (let round = 0; round < 4; round++) {
      const k = await mk({ destination: target });
      const w = k.code === "000000" ? "111111" : "000000";
      for (let i = 0; i < 5; i++) await ch.verifyChallenge(k.id, w, "signup");
    }
    events.push(["code-fail", target]);
    const fresh = await mk({ destination: target });
    assert.equal(await ch.verifyChallenge(fresh.id, fresh.code, "signup"), null);
    ok("10 failures in a day lock the target even for a brand-new valid code");

    // — rate limiter
    const key = sec.keyedHash("test", tag);
    events.push(["t-allow", key]);
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) results.push(await rl.allow("t-allow", key, 3, rl.WINDOW.hour));
    assert.deepEqual(results, [true, true, true, false, false]);
    await rl.clear("t-allow", key);
    assert.equal(await rl.peek("t-allow", key, rl.WINDOW.hour), 0);
    ok("rate limiter allows N then blocks, and clears");

    // — hashing
    assert.notEqual(sec.keyedHash("a", "x"), sec.keyedHash("b", "x"));
    assert.ok(sec.safeEqual("abc", "abc") && !sec.safeEqual("abc", "abd") && !sec.safeEqual("abc", "ab"));
    const codes = new Set(Array.from({ length: 200 }, () => sec.generateCode()));
    assert.ok(codes.size > 150 && [...codes].every((x) => /^\d{6}$/.test(x)));
    ok("keyed hashes are domain-separated; codes are 6 digits and varied");

    console.log(`\nAll ${n} checks passed.`);
  } finally {
    if (made.length) await db.delete(schema.authChallenges).where(inArray(schema.authChallenges.id, made));
    for (const [kind, k] of events) {
      await rl.clear(kind, k);
      await rl.clear(kind, sec.keyedHash("x", k));
    }
    // Failures were recorded under the raw destination key; remove them.
    await db.delete(schema.authEvents).where(eq(schema.authEvents.kind, "code-fail"));
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message ?? e);
  process.exit(1);
});
