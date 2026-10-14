import { config } from "dotenv";
config({ path: ".env.local" });
import { randomBytes } from "node:crypto";

/**
 * Creates (or resets) a chef/blogger account: a user with the creator role plus a public creator profile.
 * Usage: npx tsx scripts/create-creator.ts <email> "<display name>" [password]
 * Without a password a random one is generated and printed once.
 */
async function main() {
  const [emailArg, name, passwordArg] = process.argv.slice(2);
  if (!emailArg || !name) throw new Error('Usage: npx tsx scripts/create-creator.ts <email> "<display name>" [password]');
  const { db, schema } = await import("../src/db");
  const { eq } = await import("drizzle-orm");
  const bcrypt = (await import("bcryptjs")).default;
  const { slugify } = await import("../src/lib/recipe-schema");

  const email = emailArg.trim().toLowerCase();
  // Letters and digits only, no look-alikes, so it can be read out loud or typed from a phone.
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const generated = Array.from(randomBytes(14), (b) => alphabet[b % alphabet.length]).join("");
  const password = passwordArg ?? generated;
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({ email, name, passwordHash, role: "creator" })
    .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash, name, role: "creator" } })
    .returning({ id: schema.users.id });

  const [existing] = await db.select({ id: schema.creators.id }).from(schema.creators).where(eq(schema.creators.userId, user.id)).limit(1);
  if (!existing) {
    const base = slugify(name) || "chef";
    const [taken] = await db.select({ id: schema.creators.id }).from(schema.creators).where(eq(schema.creators.slug, base)).limit(1);
    await db.insert(schema.creators).values({
      userId: user.id,
      slug: taken ? `${base}-${randomBytes(2).toString("hex")}` : base,
      name,
      bio: null,
    });
  }

  console.log(`creator account ready\n  email:    ${email}\n  password: ${password}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
