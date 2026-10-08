import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { setCreatorFlag, setRecipeFeatured, setRecipeStatusAsAdmin } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Toggle({ action, on, children }: { action: () => Promise<void>; on: boolean; children: React.ReactNode }) {
  return (
    <form action={action}>
      <Button type="submit" size="sm" variant={on ? "primary" : "outline"} aria-pressed={on}>
        {children}
      </Button>
    </form>
  );
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();

  const [users, creators, recipes, purchases] = await Promise.all([
    db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, createdAt: schema.users.createdAt })
      .from(schema.users).orderBy(desc(schema.users.createdAt)).limit(200),
    db.select().from(schema.creators).orderBy(schema.creators.name),
    db.select({
      id: schema.recipes.id, slug: schema.recipes.slug, title: schema.recipes.title, status: schema.recipes.status,
      isFeatured: schema.recipes.isFeatured, isPremium: schema.recipes.isPremium, creator: schema.creators.name,
    }).from(schema.recipes).innerJoin(schema.creators, eq(schema.recipes.creatorId, schema.creators.id)).orderBy(desc(schema.recipes.updatedAt)),
    db.select({
      id: schema.purchases.id, amount: schema.purchases.amount, currency: schema.purchases.currency,
      status: schema.purchases.status, createdAt: schema.purchases.createdAt, email: schema.users.email, recipe: schema.recipes.title,
    }).from(schema.purchases)
      .innerJoin(schema.users, eq(schema.purchases.userId, schema.users.id))
      .innerJoin(schema.recipes, eq(schema.purchases.recipeId, schema.recipes.id))
      .orderBy(desc(schema.purchases.createdAt)).limit(100),
  ]);

  const th = "py-2 pr-4 text-xs uppercase tracking-wide text-amber-600 font-medium";

  return (
    <SiteShell>
      <Container size="xl" className="py-12 space-y-14">
        <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950">Admin</h1>

        <section aria-labelledby="creators-h">
          <h2 id="creators-h" className="text-2xl font-serif text-amber-950">Creators ({creators.length})</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left">
              <thead><tr className="border-b border-amber-200"><th className={th}>Name</th><th className={th}>Founding</th><th className={th}>Featured</th></tr></thead>
              <tbody className="divide-y divide-amber-100">
                {creators.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4"><Link href={`/creators/${c.slug}`} className="underline">{c.name}</Link></td>
                    <td className="py-3 pr-4"><Toggle on={c.isFoundingCreator} action={setCreatorFlag.bind(null, c.id, "isFoundingCreator", !c.isFoundingCreator)}>{c.isFoundingCreator ? "Founding" : "Make founding"}</Toggle></td>
                    <td className="py-3 pr-4"><Toggle on={c.isFeatured} action={setCreatorFlag.bind(null, c.id, "isFeatured", !c.isFeatured)}>{c.isFeatured ? "Featured" : "Feature"}</Toggle></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="recipes-h">
          <h2 id="recipes-h" className="text-2xl font-serif text-amber-950">Recipes ({recipes.length})</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left">
              <thead><tr className="border-b border-amber-200"><th className={th}>Title</th><th className={th}>Creator</th><th className={th}>Type</th><th className={th}>Status</th><th className={th}>Featured</th></tr></thead>
              <tbody className="divide-y divide-amber-100">
                {recipes.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 max-w-xs break-words">{r.status === "published" ? <Link href={`/recipes/${r.slug}`} className="underline">{r.title}</Link> : r.title}</td>
                    <td className="py-3 pr-4">{r.creator}</td>
                    <td className="py-3 pr-4">{r.isPremium ? "Premium" : "Free"}</td>
                    <td className="py-3 pr-4"><Toggle on={r.status === "published"} action={setRecipeStatusAsAdmin.bind(null, r.id, r.status === "published" ? "draft" : "published")}>{r.status === "published" ? "Published" : "Draft"}</Toggle></td>
                    <td className="py-3 pr-4"><Toggle on={r.isFeatured} action={setRecipeFeatured.bind(null, r.id, !r.isFeatured)}>{r.isFeatured ? "Featured" : "Feature"}</Toggle></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="users-h">
          <h2 id="users-h" className="text-2xl font-serif text-amber-950">Users ({users.length})</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left">
              <thead><tr className="border-b border-amber-200"><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Joined</th></tr></thead>
              <tbody className="divide-y divide-amber-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4 break-words">{u.name}</td>
                    <td className="py-3 pr-4 break-all">{u.email}</td>
                    <td className="py-3 pr-4 capitalize">{u.role}</td>
                    <td className="py-3 pr-4">{dateFormat.format(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="purchases-h">
          <h2 id="purchases-h" className="text-2xl font-serif text-amber-950">Purchases ({purchases.length})</h2>
          {purchases.length === 0 ? (
            <p className="mt-4 text-amber-700">No purchases yet. Payments are not connected.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left">
                <thead><tr className="border-b border-amber-200"><th className={th}>Date</th><th className={th}>User</th><th className={th}>Recipe</th><th className={th}>Amount</th><th className={th}>Status</th></tr></thead>
                <tbody className="divide-y divide-amber-100">
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4">{dateFormat.format(p.createdAt)}</td>
                      <td className="py-3 pr-4 break-all">{p.email}</td>
                      <td className="py-3 pr-4">{p.recipe}</td>
                      <td className="py-3 pr-4">{p.amount.toLocaleString("en-US")} {p.currency}</td>
                      <td className="py-3 pr-4 capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Container>
    </SiteShell>
  );
}
