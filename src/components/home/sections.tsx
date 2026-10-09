import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BookmarkButton } from "@/components/recipe/BookmarkButton";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { DIFFICULTY_LABEL, formatMinutes } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/constants";
import type { Recipe, RecipeCreator } from "@/types/recipe";

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

const CATEGORIES = [
  { label: "O‘zbek milliy", href: "/recipes?q=O‘zbek" },
  { label: "30 daqiqagacha", href: "/recipes?time=30" },
  { label: "1 soatgacha", href: "/recipes?time=60" },
  { label: "Bepul", href: "/recipes?price=Bepul" },
  { label: "Go‘shtsiz", href: "/recipes?q=Go‘shtsiz" },
  { label: "Xamir taomlar", href: "/recipes?q=Xamir" },
  { label: "Xorazm", href: "/recipes?q=Xorazm" },
];

export function CategoryRail() {
  return (
    <nav aria-label="Toifalar" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
      {CATEGORIES.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="flex h-10 shrink-0 items-center rounded-full border border-amber-200 px-4 text-sm text-amber-900 transition-colors hover:border-amber-950 hover:text-amber-950"
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}

/** The cover story: one recipe, shown large, with the product's main action on it. */
export function LeadRecipe({ recipe, isLoggedIn, saved }: { recipe: Recipe; isLoggedIn: boolean; saved: boolean }) {
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Bugungi tavsiya</p>
          <h2 className="mt-3 max-w-xl text-3xl font-medium leading-[1.1] sm:text-[2.75rem]">
            <Link href={`/recipes/${recipe.slug}`} className="hover:underline">{recipe.title}</Link>
          </h2>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-amber-100">
            <span>{recipe.creator.name}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />{formatMinutes(totalMinutes(recipe))}</span>
            <span aria-hidden="true">·</span>
            <span>{DIFFICULTY_LABEL[recipe.difficulty]}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {canCook && (
              <Button size="lg" asChild className="bg-amber-50 text-amber-950 hover:bg-amber-100">
                <Link href={`/recipes/${recipe.slug}/cook`}>Men bilan pishiring</Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild className="border-amber-50/50 text-amber-50 hover:border-amber-50">
              <Link href={`/recipes/${recipe.slug}`}>Retseptni ko‘rish</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ContinueCooking({ slug, title, coverUrl }: { slug: string; title: string; coverUrl: string }) {
  return (
    <Link href={`/recipes/${slug}/cook`} className="group flex items-center gap-4 rounded-2xl bg-sage-50 p-3 pr-5 transition-colors hover:bg-sage-100">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sage-200">
        <Image src={coverUrl} alt="" fill sizes="56px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">Davom ettirish</span>
        <span className="block truncate font-medium text-amber-950">{title}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-sage-700 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

export function LatestRecipes({ recipes, isLoggedIn, savedIds }: { recipes: Recipe[]; isLoggedIn: boolean; savedIds: Set<string> }) {
  return (
    <section aria-labelledby="latest-heading" className="min-w-0">
      <SectionHeading id="latest-heading" title="Yangi retseptlar" note="Ijodkorlar yaqinda qo‘shgan taomlar" href={PLATFORM_CONFIG.urls.recipes} linkLabel="Barcha retseptlar" />
      <div className="grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2">
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} isLoggedIn={isLoggedIn} saved={savedIds.has(r.id)} shape="landscape" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw" />
        ))}
      </div>
      <Link href={PLATFORM_CONFIG.urls.recipes} className="mt-8 inline-flex items-center gap-1.5 font-medium text-amber-950 sm:hidden">
        Barcha retseptlar <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

/** An editorial sidebar: the quickest recipes as a numbered list rather than more cards. */
export function QuickList({ recipes }: { recipes: Recipe[] }) {
  return (
    <section aria-labelledby="quick-heading" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <h2 id="quick-heading" className="text-2xl font-medium text-amber-950">Tez tayyor bo‘ladi</h2>
      <p className="mt-1 text-sm text-amber-600">Vaqt kam bo‘lganda</p>
      <ol className="mt-5 border-t border-amber-950">
        {recipes.map((r, i) => (
          <li key={r.id} className="border-b border-amber-200">
            <Link href={`/recipes/${r.slug}`} className="group flex items-center gap-4 py-4">
              <span className="w-7 shrink-0 font-serif text-2xl text-clay-400 tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg font-medium leading-snug text-amber-950 group-hover:text-amber-700">{r.title}</span>
                <span className="mt-0.5 block text-sm text-amber-600">{formatMinutes(totalMinutes(r))} · {r.creator.name}</span>
              </span>
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-amber-100">
                <Image src={r.coverMedia.url} alt="" fill sizes="64px" className="object-cover" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CreatorsStrip({ creators }: { creators: (RecipeCreator & { recipeCount: number })[] }) {
  return (
    <section aria-labelledby="creators-heading">
      <SectionHeading id="creators-heading" title="Ijodkorlar" note="Retseptlar ortidagi oshpazlar" href={PLATFORM_CONFIG.urls.creators} linkLabel="Barcha ijodkorlar" />
      <ul className="grid gap-x-10 gap-y-8 border-t border-amber-200 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c) => (
          <li key={c.id}>
            <Link href={`/creators/${c.slug}`} className="group flex items-start gap-4">
              {c.avatarUrl ? (
                <Image src={c.avatarUrl} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-2xl text-sage-700" aria-hidden="true">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-serif text-xl font-medium text-amber-950 group-hover:text-amber-700">{c.name}</span>
                <span className="block text-sm text-amber-600">{c.recipeCount} ta retsept</span>
                {c.bio && <span className="mt-1.5 line-clamp-2 block text-sm text-amber-900">{c.bio}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const HOW = [
  { title: "Retseptni oching", text: "Masalliqlar aniq miqdori bilan bir joyda. Porsiya sonini o‘zingiz tanlaysiz." },
  { title: "“Men bilan pishiring”ni bosing", text: "Ekranda faqat hozirgi qadam: nima qilish, qancha va qancha vaqt." },
  { title: "Taymer bilan davom eting", text: "Kerak joyda taymer ishga tushadi. Videoni ortga qaytarish shart emas." },
];

/** Shown to visitors only: what makes cooking here different, in three plain lines. */
export function HowItCooks() {
  return (
    <section aria-labelledby="how-heading" className="bg-sage-50">
      <Container size="xl" className="grid gap-10 py-16 lg:grid-cols-[1fr_2fr] lg:gap-20 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-600">Nima uchun Damda</p>
          <h2 id="how-heading" className="mt-3 text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">
            Qo‘lingiz band bo‘lganda ham keyingi qadam ko‘z oldingizda.
          </h2>
        </div>
        <ol className="grid gap-8 sm:grid-cols-3">
          {HOW.map((step, i) => (
            <li key={step.title} className="border-t border-sage-700 pt-5">
              <span className="font-serif text-lg text-sage-600 tabular-nums">0{i + 1}</span>
              <h3 className="mt-2 text-xl font-medium leading-snug text-amber-950">{step.title}</h3>
              <p className="mt-2 text-amber-900">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function CreatorInvite() {
  return (
    <section aria-labelledby="invite-heading" className="bg-amber-950 text-amber-50">
      <Container size="xl" className="flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-end lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">Ijodkorlar uchun</p>
          <h2 id="invite-heading" className="mt-3 text-[1.9rem] font-medium leading-tight sm:text-[2.6rem]">
            Auditoriyangiz retseptlaringizni yaxshi ko‘radi. Ularga pishirishning qulay yo‘lini bering.
          </h2>
          <p className="mt-4 text-amber-200">
            Dastlabki {PLATFORM_CONFIG.creator.foundingCreatorCount} ta ijodkor asoschi hamkor sifatida qo‘shiladi va asoschilik davrida komissiya to‘lamaydi.
          </p>
        </div>
        <Button size="xl" asChild className="shrink-0 bg-amber-50 text-amber-950 hover:bg-amber-100">
          <Link href={PLATFORM_CONFIG.urls.becomeCreator}>Ijodkor bo‘lish <ArrowUpRight className="h-5 w-5" aria-hidden="true" /></Link>
        </Button>
      </Container>
    </section>
  );
}
