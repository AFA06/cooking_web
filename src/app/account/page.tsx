import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { getCookingHistory, getSavedRecipes } from "@/server/user-data";
import { formatDate } from "@/lib/format";
import { logout } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Mening oshxonam", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");
  const [saved, history] = await Promise.all([getSavedRecipes(user.id), getCookingHistory(user.id)]);

  return (
    <SiteShell>
      <Container size="lg" className="py-12 sm:py-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950 break-words">{user.name}</h1>
            <p className="mt-2 text-amber-700">{user.email}</p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline">Chiqish</Button>
          </form>
        </header>

        <section className="mt-12" aria-labelledby="saved-heading">
          <h2 id="saved-heading" className="text-2xl font-serif text-amber-950">Saqlangan retseptlar</h2>
          {saved.length === 0 ? (
            <p className="mt-4 text-amber-700">
              Hali hech narsa saqlanmagan. <Link href="/recipes" className="underline">Retseptlarni ko‘ring</Link> va pishirmoqchi bo‘lganlaringizni saqlang.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {saved.map((r) => (
                <RecipeCard key={r.id} recipe={r} isLoggedIn saved />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14" aria-labelledby="history-heading">
          <h2 id="history-heading" className="text-2xl font-serif text-amber-950">Pishirish tarixi</h2>
          {history.length === 0 ? (
            <p className="mt-4 text-amber-700">
              Hali hech narsa pishirmadingiz. Bepul retseptni oching va “Pishirishni boshlash”ni bosing.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-amber-200 border-y border-amber-200">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <Link href={`/recipes/${h.recipeSlug}`} className="font-medium text-amber-950 hover:underline break-words">
                    {h.recipeTitle}
                  </Link>
                  <span className="text-sm text-amber-700">
                    {h.status === "completed" ? "Tugatilgan" : "Boshlangan"} · {formatDate(h.completedAt ?? h.startedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </SiteShell>
  );
}
