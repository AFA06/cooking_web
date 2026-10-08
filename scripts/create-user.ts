import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const [emailArg, password, role = "user", ...nameParts] = process.argv.slice(2);
  if (!emailArg || !password || password.length < 8 || !["user", "admin"].includes(role)) {
    throw new Error("Usage: npm run create-user -- <email> <password (8+ chars)> [user|admin] [name]");
  }
  const { db, schema } = await import("../src/db");
  const bcrypt = (await import("bcryptjs")).default;
  const email = emailArg.trim().toLowerCase();
  const name = nameParts.join(" ") || email.split("@")[0];
  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(schema.users)
    .values({ email, name, passwordHash, role: role as "user" | "admin" })
    .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash, role: role as "user" | "admin", name } });
  console.log(`${role} account ready: ${email}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
