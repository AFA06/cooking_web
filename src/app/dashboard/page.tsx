import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, Circle, ExternalLink, Eye, Film, Flame, Pencil, Plus, Star, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { RatingStars, formatRating } from "@/components/reviews/RatingStars";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser, listCreatorRecipes } from "@/server/creator";
import { getCreatorSummary } from "@/server/reviews";
import { setRecipeStatus } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("nav.creatorPanel"), robots: { index: false } };
}

export default async function StudioPage() {
  const [user, t, locale] = await Promise.all([getCurrentUser(), getT(), getLocale()]);
  if (!user) redirect("/auth/login?next=/dashboard");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");
  const [recipes, summary] = await Promise.all([listCreatorRecipes(creator.id), getCreatorSummary(creator.id)]);

  const sum = (pick: (r: (typeof recipes)[number]) => number) => recipes.reduce((total, r) => total + pick(r), 0);
  const views = sum((r) => r.views);
  const cooks = sum((r) => r.cooks);
  const completions = sum((r) => r.completions);
  const completionRate = cooks > 0 ? Math.round((completions / cooks) * 100) : 0;

  const todo = [
    { done: !!creator.bio && !!creator.avatarUrl, label: t("studio.todo.profile"), href: "/dashboard/profile" },
    { done: Object.keys(creator.socialLinks ?? {}).length > 0, label: t("studio.todo.socials"), href: "/dashboard/profile" },
    { done: recipes.length > 0, label: t("studio.todo.recipe"), href: "/dashboard/recipes/new" },
    { done: recipes.some((r) => r.status === "published"), label: t("studio.todo.publish"), href: recipes[0] ? `/dashboard/recipes/${recipes[0].id}` : "/dashboard/recipes/new" },
    { done: recipes.some((r) => !!r.videoUrl), label: t("studio.todo.video"), href: recipes[0] ? `/dashboard/recipes/${recipes[0].id}` : "/dashboard/recipes/new" },
  ];
  const remaining = todo.filter((item) => !item.done);

  const stats = [
    { label: t("dash.col.views"), value: formatNumber(views), icon: Eye },
    { label: t("dash.col.saves"), value: formatNumber(sum((r) => r.saves)), icon: Bookmark },
    { label: t("adm.tile.cooksStarted"), value: formatNumber(cooks), icon: Flame },
    { label: t("adm.tile.completionRate"), value: `${completionRate}%`, icon: CheckCircle2 },
  ];

  return (
    <Container size="lg" className="py-10 sm:py-14">
      {/* header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-5">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- creator's own avatar, any host
            <img src={creator.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover sm:h-24 sm:w-24" />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sage-500 font-serif text-4xl font-medium text-amber-50 sm:h-24 sm:w-24" aria-hidden="true">
              {creator.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">{t("studio.eyebrow")}</p>
            <h1 className="mt-1 break-words font-serif text-4xl font-medium leading-tight text-amber-950 sm:text-5xl">{t("studio.hello", { name: creator.name.split(" ")[0] })}</h1>
            <p className="mt-2 max-w-xl text-lg text-amber-900">{t("studio.lead")}</p>
          </div>
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

      {/* numbers */}
      <section aria-label={t("studio.eyebrow")} className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-amber-200 bg-amber-100/50 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
              <Icon className="h-4 w-4 text-amber-700" aria-hidden="true" />
              {label}
            </p>
            <p className="mt-3 font-serif text-4xl font-medium tabular-nums text-amber-950">{value}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-3xl border border-amber-200 bg-amber-100/50 p-5 lg:col-span-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
            <Star className="h-4 w-4 text-amber-700" aria-hidden="true" />
            {t("creator.avgRating")}
          </p>
          <p className="mt-3 flex items-center gap-3">
            <span className="font-serif text-4xl font-medium tabular-nums text-amber-950">{summary.rating.count > 0 ? formatRating(summary.rating.average) : "—"}</span>
            {summary.rating.count > 0 && <RatingStars value={summary.rating.average} />}
          </p>
          <p className="mt-1 text-sm text-amber-600">{summary.rating.count > 0 ? t("review.count", { count: summary.rating.count }) : t("creator.unrated")}</p>
        </div>
      </section>

      {/* getting started */}
      {remaining.length > 0 && (
        <section aria-labelledby="start-heading" className="mt-10 rounded-[2rem] bg-sage-50 p-6 sm:p-8">
          <h2 id="start-heading" className="font-serif text-2xl font-medium text-amber-950">{t("studio.getStarted")}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todo.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 transition-colors",
                    item.done ? "bg-sage-100 text-sage-900" : "bg-amber-50 text-amber-950 hover:bg-amber-100",
                  )}
                >
                  {item.done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-sage-600" aria-hidden="true" /> : <Circle className="h-6 w-6 shrink-0 text-amber-400" aria-hidden="true" />}
                  <span className={cn("text-[0.95rem] font-medium", item.done && "line-through decoration-sage-500/60")}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* recipes */}
      <section aria-labelledby="recipes-heading" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="recipes-heading" className="font-serif text-3xl font-medium text-amber-950">{t("dash.yourRecipes")}</h2>
          <Link href="/dashboard/profile" className="text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
            {t("dash.editProfile")}
          </Link>
        </div>

        {recipes.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border-2 border-dashed border-amber-300 px-6 py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-amber-600" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-5 font-serif text-2xl text-amber-950">{t("studio.empty")}</h3>
            <p className="mx-auto mt-2 max-w-md text-amber-900">{t("studio.emptyText")}</p>
            <Button size="xl" className="mt-8" asChild>
              <Link href="/dashboard/recipes/new">
                <Plus className="h-5 w-5" aria-hidden="true" />
                {t("dash.createFirst")}
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.map((r) => {
              const published = r.status === "published";
              return (
                <li key={r.id} className="flex flex-col overflow-hidden rounded-[1.5rem] border border-amber-200 bg-amber-100/40">
                  <Link href={`/dashboard/recipes/${r.id}`} className="group relative block aspect-[16/10] bg-amber-200">
                    {r.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- creator's own cover, any host
                      <img src={r.coverUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-amber-500">{t("studio.noCover")}</span>
                    )}
                    <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold", published ? "bg-sage-600/95 text-amber-50" : "bg-ink/80 text-paper")}>
                      {published ? t("dash.published") : t("dash.draft")}
                    </span>
                    <span className="absolute right-3 top-3 flex gap-1.5">
                      {r.isPremium && <span className="rounded-full bg-amber-950/90 px-3 py-1 text-xs font-semibold text-amber-50">{t("filter.premium")}</span>}
                      {r.videoUrl && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50/95 px-2.5 py-1 text-xs font-semibold text-amber-950">
                          <Film className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="sr-only">{t("studio.hasVideo")}</span>
                        </span>
                      )}
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 break-words text-xl font-medium leading-snug text-amber-950">{r.title}</h3>
                    <p className="mt-1 text-sm text-amber-600">{t("adm.updated", { when: formatRelative(r.updatedAt, t, locale) })}</p>

                    <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: t("dash.col.views"), value: r.views, icon: Eye },
                        { label: t("dash.col.saves"), value: r.saves, icon: Bookmark },
                        { label: t("account.started"), value: r.cooks, icon: Flame },
                        { label: t("account.completed"), value: r.completions, icon: CheckCircle2 },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-xl bg-amber-50 px-1 py-2">
                          <dt className="flex justify-center text-amber-500" title={label}>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{label}</span>
                          </dt>
                          <dd className="mt-0.5 font-serif text-lg font-medium tabular-nums text-amber-950">{formatNumber(value)}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <Button asChild size="md">
                        <Link href={`/dashboard/recipes/${r.id}`}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          {t("dash.edit")}
                        </Link>
                      </Button>
                      {published && (
                        <Button asChild size="md" variant="outline">
                          <Link href={`/recipes/${r.slug}`}>{t("dash.view")}</Link>
                        </Button>
                      )}
                      <form action={setRecipeStatus.bind(null, r.id, published ? "draft" : "published")} className="ml-auto">
                        <Button type="submit" size="md" variant="ghost">
                          {published ? t("dash.unpublish") : t("dash.publish")}
                        </Button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-6 text-xs text-amber-600">
          {t("dash.viewsNote1")} <code>?src=instagram</code> {t("dash.viewsNote2")}
        </p>
      </section>
    </Container>
  );
}
