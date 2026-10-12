import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BookmarkButton } from "@/components/recipe/BookmarkButton";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getT } from "@/i18n/server";
import { DIFFICULTY_KEY, formatMinutes } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/constants";
import type { Recipe } from "@/types/recipe";

const totalMinutes = (r: Recipe) => r.prepTimeMinutes + r.cookTimeMinutes;

export function SectionHeading({ id, title, note, href, linkLabel }: { id: string; title: string; note?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <h2 id={id} className="text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">{title}</h2>
        {note && <p className="mt-1.5 text-amber-600">{note}</p>}
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1.5 pb-1 text-[0.95rem] font-medium text-amber-950 hover:text-amber-700 sm:inline-flex">
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** `q` values search the recipe texts, which are written in Uzbek, so they stay Uzbek in every language. */
const CATEGORIES = [
  { label: "home.rail.uzbek", href: "/recipes?q=O‘zbek" },
  { label: "filter.time.30", href: "/recipes?time=30" },
  { label: "filter.time.60", href: "/recipes?time=60" },
  { label: "filter.free", href: "/recipes?price=free" },
  { label: "home.rail.meatFree", href: "/recipes?q=Go‘shtsiz" },
  { label: "home.rail.dough", href: "/recipes?q=Xamir" },
  { label: "home.rail.khorezm", href: "/recipes?q=Xorazm" },
];

export async function CategoryRail() {
  const t = await getT();
  return (
    <nav aria-label={t("recipes.categories")} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
      {CATEGORIES.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="flex h-10 shrink-0 items-center rounded-full border border-amber-200 px-4 text-sm text-amber-900 transition-colors hover:border-amber-950 hover:text-amber-950"
        >
          {t(c.label)}
        </Link>
      ))}
    </nav>
  );
}

/** The cover story: one recipe, shown large, with the product's main action on it. */
export async function LeadRecipe({ recipe, isLoggedIn, saved }: { recipe: Recipe; isLoggedIn: boolean; saved: boolean }) {
  const t = await getT();
  const canCook = !recipe.isPremium;
  return (
    <article className="theme-light relative min-w-0 overflow-hidden rounded-[1.75rem] bg-amber-950">
      <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[34rem]">
        <Image
          src={recipe.coverMedia.url}
          alt={recipe.coverMedia.alt ?? recipe.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-950/25 to-transparent" aria-hidden="true" />
        <BookmarkButton recipeId={recipe.id} slug={recipe.slug} initialSaved={saved} isLoggedIn={isLoggedIn} className="absolute right-4 top-4" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-amber-50 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{t("home.pick")}</p>
          <h2 className="mt-3 max-w-xl text-3xl font-medium leading-[1.1] sm:text-[2.75rem]">
            <Link href={`/recipes/${recipe.slug}`} className="hover:underline">{recipe.title}</Link>
          </h2>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-amber-100">
            <span>{recipe.creator.name}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />{formatMinutes(totalMinutes(recipe), t)}</span>
            <span aria-hidden="true">·</span>
            <span>{t(DIFFICULTY_KEY[recipe.difficulty])}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {canCook && (
              <Button size="lg" asChild className="bg-amber-50 text-amber-950 hover:bg-amber-100">
                <Link href={`/recipes/${recipe.slug}/cook`}>{t("home.cookWithMe")}</Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild className="border-amber-50/50 text-amber-50 hover:border-amber-50">
              <Link href={`/recipes/${recipe.slug}`}>{t("home.viewRecipe")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export async function ContinueCooking({ slug, title, coverUrl }: { slug: string; title: string; coverUrl: string }) {
  const t = await getT();
  return (
    <Link href={`/recipes/${slug}/cook`} className="group flex items-center gap-4 rounded-2xl bg-sage-50 p-3 pr-5 transition-colors hover:bg-sage-100">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sage-200">
        <Image src={coverUrl} alt="" fill sizes="56px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">{t("home.continue")}</span>
        <span className="block truncate font-medium text-amber-950">{title}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-sage-700 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

export async function LatestRecipes({ recipes, isLoggedIn, savedIds }: { recipes: Recipe[]; isLoggedIn: boolean; savedIds: Set<string> }) {
  const t = await getT();
  return (
    <section aria-labelledby="latest-heading" className="min-w-0">
      <SectionHeading id="latest-heading" title={t("home.latest")} note={t("home.latestNote")} href={PLATFORM_CONFIG.urls.recipes} linkLabel={t("home.allRecipes")} />
      <div className="grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} isLoggedIn={isLoggedIn} saved={savedIds.has(r.id)} shape="landscape" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw" />
        ))}
      </div>
      <Link href={PLATFORM_CONFIG.urls.recipes} className="mt-8 inline-flex items-center gap-1.5 font-medium text-amber-950 sm:hidden">
        {t("home.allRecipes")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

const HOW = [
  { title: "home.how1.title", text: "home.how1.text" },
  { title: "home.how2.title", text: "home.how2.text" },
  { title: "home.how3.title", text: "home.how3.text" },
];

/** Shown to visitors only: what makes cooking here different, in three plain lines. */
export async function HowItCooks() {
  const t = await getT();
  return (
    <section aria-labelledby="how-heading" className="bg-sage-50">
      <Container size="xl" className="grid gap-10 py-16 lg:grid-cols-[1fr_2fr] lg:gap-20 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-600">{t("home.whyEyebrow")}</p>
          <h2 id="how-heading" className="mt-3 text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">
            {t("home.whyTitle")}
          </h2>
        </div>
        <ol className="grid gap-8 sm:grid-cols-3">
          {HOW.map((step, i) => (
            <li key={step.title} className="border-t border-sage-700 pt-5">
              <span className="font-serif text-lg text-sage-600 tabular-nums">0{i + 1}</span>
              <h3 className="mt-2 text-xl font-medium leading-snug text-amber-950">{t(step.title)}</h3>
              <p className="mt-2 text-amber-900">{t(step.text)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export async function CreatorInvite() {
  const t = await getT();
  return (
    <section aria-labelledby="invite-heading" className="bg-amber-950 text-amber-50">
      <Container size="xl" className="flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-end lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">{t("home.inviteEyebrow")}</p>
          <h2 id="invite-heading" className="mt-3 text-[1.9rem] font-medium leading-tight sm:text-[2.6rem]">
            {t("home.inviteTitle")}
          </h2>
          <p className="mt-4 text-amber-200">
            {t("home.inviteText", { count: PLATFORM_CONFIG.creator.foundingCreatorCount })}
          </p>
        </div>
        <Button size="xl" asChild className="shrink-0 bg-amber-50 text-amber-950 hover:bg-amber-100">
          <Link href={PLATFORM_CONFIG.urls.becomeCreator}>{t("nav.becomeCreator")} <ArrowUpRight className="h-5 w-5" aria-hidden="true" /></Link>
        </Button>
      </Container>
    </section>
  );
}
