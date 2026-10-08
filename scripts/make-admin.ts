import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run make-admin -- <email>");
  const { db, schema } = await import("../src/db");
  const { eq } = await import("drizzle-orm");
  const rows = await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.email, email)).returning({ id: schema.users.id });
  if (rows.length === 0) throw new Error(`No user with email ${email}. Sign up first.`);
  console.log(`${email} is now an admin`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
