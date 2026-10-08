import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const [emailArg, password] = process.argv.slice(2);
  if (!emailArg || !password || password.length < 8) throw new Error("Usage: npm run set-password -- <email> <password (8+ chars)>");
  const { db, schema } = await import("../src/db");
  const { eq } = await import("drizzle-orm");
  const bcrypt = (await import("bcryptjs")).default;
  const email = emailArg.trim().toLowerCase();
  const rows = await db.update(schema.users).set({ passwordHash: await bcrypt.hash(password, 12) }).where(eq(schema.users.email, email)).returning({ id: schema.users.id });
  if (rows.length === 0) throw new Error(`No user with email ${email}`);
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, rows[0].id));
  console.log(`Password updated for ${email}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
