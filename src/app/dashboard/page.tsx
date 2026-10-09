import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser, listCreatorRecipes } from "@/server/creator";
import { setRecipeStatus } from "./actions";

export const metadata: Metadata = { title: "Ijodkor paneli", robots: { index: false } };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/dashboard");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");
  const recipes = await listCreatorRecipes(creator.id);

  return (
    <Container size="lg" className="py-12 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-amber-700">Ijodkor paneli</p>
          <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950 break-words">{creator.name}</h1>
          <Link href={`/creators/${creator.slug}`} className="mt-2 inline-block text-sm text-amber-800 underline">
            Ommaviy profilni ko‘rish
          </Link>
          <Link href="/dashboard/profile" className="ml-5 mt-2 inline-block text-sm text-amber-800 underline">
            Profil va ijtimoiy tarmoqlarni tahrirlash
          </Link>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/recipes/new">Yangi retsept</Link>
        </Button>
      </header>

      <section className="mt-12" aria-labelledby="recipes-heading">
        <h2 id="recipes-heading" className="text-2xl font-serif text-amber-950">Sizning retseptlaringiz</h2>
        {recipes.length === 0 ? (
          <p className="mt-4 text-amber-700">
            Hali retseptlaringiz yo‘q. <Link href="/dashboard/recipes/new" className="underline">Birinchi retseptni yarating</Link>.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left">
              <thead className="text-xs uppercase tracking-wide text-amber-600">
                <tr className="border-b border-amber-200">
                  <th className="py-2 pr-4 font-medium">Retsept</th>
                  <th className="py-2 pr-4 font-medium">Holati</th>
                  <th className="py-2 pr-4 font-medium text-right">Ko‘rishlar</th>
                  <th className="py-2 pr-4 font-medium text-right">Saqlashlar</th>
                  <th className="py-2 pr-4 font-medium text-right">Boshlangan</th>
                  <th className="py-2 pr-4 font-medium text-right">Tugatilgan</th>
                  <th className="py-2 font-medium"><span className="sr-only">Amallar</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {recipes.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 text-amber-950 break-words max-w-xs">
                      {r.title}
                      {r.isPremium && <Badge variant="premium" className="ml-2">Premium</Badge>}
                    </td>
                    <td className="py-3 pr-4 text-sm text-amber-800">{r.status === "published" ? "Nashr etilgan" : "Qoralama"}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{r.views}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{r.saves}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{r.cooks}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{r.completions}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/recipes/${r.id}`}>Tahrirlash</Link>
                        </Button>
                        {r.status === "published" && (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/recipes/${r.slug}`}>Ko‘rish</Link>
                          </Button>
                        )}
                        <form action={setRecipeStatus.bind(null, r.id, r.status === "published" ? "draft" : "published")}>
                          <Button type="submit" size="sm" variant="ghost">
                            {r.status === "published" ? "Qoralamaga qaytarish" : "Nashr etish"}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-amber-700">
          Ko‘rishlar — retsept sahifasiga kirishlar soni. Havolaga <code>?src=instagram</code> qo‘shib ulashsangiz, qaysi kanal o‘quvchi keltirgani yozib boriladi (hisobot keyingi yangilanishda).
        </p>
      </section>
    </Container>
  );
}
