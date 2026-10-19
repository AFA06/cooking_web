import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, CheckCircle2, Circle, ExternalLink, Eye, Flame, Plus, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RatingStars, formatRating } from "@/components/reviews/RatingStars";
import { StudioRecipeCard } from "@/components/studio/StudioRecipeCard";
import { getT } from "@/i18n/server";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser, listCreatorRecipes } from "@/server/creator";
import { getCreatorSummary } from "@/server/reviews";
import { commissionRate, getStudioTotals } from "@/server/studio";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("nav.creatorPanel"), robots: { index: false } };
}

export default async function StudioPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) redirect("/auth/login?next=/dashboard");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");
  const [recipes, summary, totals] = await Promise.all([listCreatorRecipes(creator.id), getCreatorSummary(creator.id), getStudioTotals(creator.id)]);

  const sum = (pick: (r: (typeof recipes)[number]) => number) => recipes.reduce((total, r) => total + pick(r), 0);
  const cooks = sum((r) => r.cooks);
  const completionRate = cooks > 0 ? Math.round((sum((r) => r.completions) / cooks) * 100) : 0;
  const net = Math.round(totals.revenue * (1 - commissionRate(creator.isFoundingCreator)));
  const first = recipes[0];
  // Without a Telegram username the Buy button on premium recipes stays off.
  const cannotSell = !creator.telegramUsername && recipes.some((r) => r.isPremium);

  const todo = [
    { done: !!creator.bio && !!creator.avatarUrl, label: t("studio.todo.profile"), href: "/dashboard/profile" },
    { done: Object.keys(creator.socialLinks ?? {}).length > 0, label: t("studio.todo.socials"), href: "/dashboard/profile" },
    { done: recipes.length > 0, label: t("studio.todo.recipe"), href: "/dashboard/recipes/new" },
    { done: recipes.some((r) => r.status === "published"), label: t("studio.todo.publish"), href: first ? `/dashboard/recipes/${first.id}` : "/dashboard/recipes/new" },
    { done: recipes.some((r) => !!r.videoUrl), label: t("studio.todo.video"), href: first ? `/dashboard/recipes/${first.id}` : "/dashboard/recipes/new" },
  ];

  const stats = [
    { label: t("dash.col.views"), value: formatNumber(sum((r) => r.views)), icon: Eye },
    { label: t("dash.col.saves"), value: formatNumber(sum((r) => r.saves)), icon: Bookmark },
    { label: t("adm.tile.cooksStarted"), value: formatNumber(cooks), icon: Flame },
    { label: t("adm.tile.completionRate"), value: `${completionRate}%`, icon: CheckCircle2 },
    { label: t("studio.net"), value: formatPrice(net, "UZS", t), icon: Wallet, href: "/dashboard/sales" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">{t("studio.eyebrow")}</p>
          <h1 className="mt-1 break-words font-serif text-4xl font-medium leading-tight text-amber-950 sm:text-5xl">{t("studio.hello", { name: creator.name.split(" ")[0] })}</h1>
          <p className="mt-2 max-w-xl text-lg text-amber-900">{t("studio.lead")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="xl" asChild>
            <Link href="/dashboard/recipes/new">
              <Plus className="h-5 w-5" aria-hidden="true" />
              {t("dash.newRecipe")}
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href={`/creators/${creator.slug}`}>
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
              {t("adm.publicPage")}
            </Link>
          </Button>
        </div>
      </header>

      {cannotSell && (
        <div role="alert" className="mt-8 flex flex-col gap-4 rounded-[1.5rem] border border-clay-400/50 bg-clay-100/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-amber-950">{t("studio.noTelegramTitle")}</p>
            <p className="mt-1 text-amber-900">{t("studio.noTelegramText")}</p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/dashboard/profile#telegram">{t("studio.noTelegramCta")}</Link>
          </Button>
        </div>
      )}

      <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, href }) => {
          const body = (
            <>
              <p className="flex items-start gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
                <Icon className="mt-px h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <span className="min-w-0 leading-snug">{label}</span>
              </p>
              <p className="mt-3 truncate font-serif text-3xl font-medium tabular-nums text-amber-950">{value}</p>
            </>
          );
          const cls = "block rounded-3xl border border-amber-200 bg-amber-100/50 p-5";
          return href ? (
            <Link key={label} href={href} className={cn(cls, "col-span-2 transition-colors hover:border-amber-700 lg:col-span-1")}>{body}</Link>
          ) : (
            <div key={label} className={cls}>{body}</div>
          );
        })}
        <Link href="/dashboard/reviews" className="col-span-2 block rounded-3xl border border-amber-200 bg-amber-100/50 p-5 transition-colors hover:border-amber-700 lg:col-span-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
            <Star className="h-4 w-4 text-amber-700" aria-hidden="true" />
            {t("creator.avgRating")}
          </p>
          <p className="mt-3 flex items-center gap-2">
            <span className="font-serif text-3xl font-medium tabular-nums text-amber-950">{summary.rating.count > 0 ? formatRating(summary.rating.average) : "—"}</span>
            {summary.rating.count > 0 && <RatingStars value={summary.rating.average} size="sm" />}
          </p>
        </Link>
      </section>

      {todo.some((item) => !item.done) && (
        <section aria-labelledby="start-heading" className="mt-10 rounded-[2rem] bg-sage-50 p-6 sm:p-8">
          <h2 id="start-heading" className="font-serif text-2xl font-medium text-amber-950">{t("studio.getStarted")}</h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todo.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn("flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 transition-colors", item.done ? "bg-sage-100 text-sage-900" : "bg-amber-50 text-amber-950 hover:bg-amber-100")}
                >
                  {item.done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-sage-600" aria-hidden="true" /> : <Circle className="h-6 w-6 shrink-0 text-amber-400" aria-hidden="true" />}
                  <span className={cn("text-[0.95rem] font-medium", item.done && "line-through decoration-sage-500/60")}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="latest-heading" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="latest-heading" className="font-serif text-3xl font-medium text-amber-950">{t("studio.latest")}</h2>
          {recipes.length > 0 && (
            <Link href="/dashboard/recipes" className="text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
              {t("studio.allRecipes")}
            </Link>
          )}
        </div>
        {recipes.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border-2 border-dashed border-amber-300 px-4 py-16 text-center sm:px-6">
            <h3 className="font-serif text-2xl text-amber-950">{t("studio.empty")}</h3>
            <p className="mx-auto mt-2 max-w-md text-amber-900">{t("studio.emptyText")}</p>
            <Button size="xl" className="mt-8" asChild>
              <Link href="/dashboard/recipes/new">
                <Plus className="h-5 w-5" aria-hidden="true" />
                {t("dash.createFirst")}
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.slice(0, 3).map((r) => (
              <StudioRecipeCard key={r.id} recipe={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
