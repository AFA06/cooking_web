import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { CookbookCard } from "@/components/cookbooks/CookbookCard";
import { NewCookbook } from "@/components/cookbooks/CookbookManage";
import { getCookbooks } from "@/server/cookbooks";
import { getCookingHistory, getSavedRecipes } from "@/server/user-data";
import { getLocale, getT } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/profile";
import { listMyOrders } from "@/server/orders";
import { formatPrice } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("nav.myKitchen"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [user, t, locale] = await Promise.all([getCurrentUser(), getT(), getLocale()]);
  if (!user) redirect("/auth/login?next=/account");
  const [saved, history, cookbooks, orders] = await Promise.all([getSavedRecipes(user.id), getCookingHistory(user.id), getCookbooks(user.id), listMyOrders(user.id)]);

  return (
    <SiteShell>
      <Container size="lg" className="py-12 sm:py-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950 break-words">{user.name}</h1>
            <p className="mt-2 text-amber-600">{user.email ?? (user.phone ? formatPhone(user.phone) : "")}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/account/settings"><Settings className="h-4 w-4" aria-hidden="true" />{t("account.editProfile")}</Link>
          </Button>
        </header>

        {orders.length > 0 && (
          <section className="mt-12" aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="text-2xl font-serif text-amber-950">{t("order.myOrders")}</h2>
            <ul className="mt-4 divide-y divide-amber-200 rounded-2xl border border-amber-200 bg-amber-100">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.code}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-amber-200/40">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-amber-950">{o.recipeTitle}</span>
                      <span className="text-sm text-amber-600">{formatPrice(o.amount, o.currency, t)} · {o.code}</span>
                    </span>
                    <span className="rounded-full bg-clay-100 px-3 py-1 text-xs font-semibold text-amber-800">{t(o.status === "paid" ? "order.status.paid" : "order.status.pending")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12" aria-labelledby="cookbooks-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="cookbooks-heading" className="text-2xl font-serif text-amber-950">{t("account.cookbooks")}</h2>
              <p className="mt-1 text-amber-600">{t("account.cookbooksNote")}</p>
            </div>
            <NewCookbook />
          </div>
          {cookbooks.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {cookbooks.map((cookbook) => (
                <CookbookCard key={cookbook.id} cookbook={cookbook} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14" aria-labelledby="saved-heading">
          <h2 id="saved-heading" className="text-2xl font-serif text-amber-950">{t("account.savedRecipes")}</h2>
          {saved.length === 0 ? (
            <p className="mt-4 text-amber-600">
              {t("account.savedEmpty1")} <Link href="/recipes" className="underline">{t("account.savedEmptyLink")}</Link> {t("account.savedEmpty2")}
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
          <h2 id="history-heading" className="text-2xl font-serif text-amber-950">{t("account.history")}</h2>
          {history.length === 0 ? (
            <p className="mt-4 text-amber-600">
              {t("account.historyEmpty")}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-amber-200 border-y border-amber-200">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <Link href={`/recipes/${h.recipeSlug}`} className="font-medium text-amber-950 hover:underline break-words">
                    {h.recipeTitle}
                  </Link>
                  <span className="text-sm text-amber-600">
                    {h.status === "completed" ? t("account.completed") : t("account.started")} · {formatDate(h.completedAt ?? h.startedAt, locale)}
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
