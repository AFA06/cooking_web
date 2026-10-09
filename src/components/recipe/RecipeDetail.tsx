import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock, Flame, Lock, Thermometer, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipeGallery } from "@/components/recipe/RecipeGallery";
import { SaveButton } from "@/components/recipe/SaveButton";
import { CookLink, ScaledIngredients, ScaledTime, ServingsProvider, ServingsStepper, StepIngredients } from "@/components/recipe/Servings";
import { ShareButton } from "@/components/recipe/ShareButton";
import { DIFFICULTY_LABEL, formatMinutes, formatNumber, formatPrice, toIsoDuration } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { RatingStars, formatRating } from "@/components/reviews/RatingStars";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { RatingOverview, ReviewList } from "@/components/reviews/ReviewList";
import type { RatingSummary, Review, ReviewEligibility } from "@/server/reviews";
import type { Recipe, RecipeStep } from "@/types/recipe";

function recipeJsonLd(recipe: Recipe) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    inLanguage: "uz",
    description: recipe.description,
    image: recipe.media.map((m) => m.url),
    author: { "@type": "Person", name: recipe.creator.name },
    datePublished: recipe.publishedAt,
    prepTime: toIsoDuration(recipe.prepTimeMinutes),
    cookTime: toIsoDuration(recipe.cookTimeMinutes),
    totalTime: toIsoDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes),
    recipeYield: `${recipe.servings} porsiya`,
    keywords: recipe.tags.join(", "),
    ...(recipe.rating.count > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: recipe.rating.average.toFixed(1), ratingCount: recipe.rating.count },
    }),
    recipeIngredient: recipe.ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`),
    recipeInstructions: recipe.steps.map((s) => ({ "@type": "HowToStep", name: s.title, text: s.instruction })),
  };
}

const PREMIUM_INCLUDES = ["Barcha qadamlar batafsil ko‘rsatma bilan", "Har bir qadam uchun taymer va harorat", "Oshpaz maslahatlari va sirlari", "“Men bilan pishiring” qadam-baqadam rejimi"];

function StepFacts({ step }: { step: RecipeStep }) {
  if (!step.timerSeconds && !step.temperatureCelsius) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-amber-700">
      {step.timerSeconds ? (
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {formatMinutes(Math.round(step.timerSeconds / 60))}
        </span>
      ) : null}
      {step.temperatureCelsius ? (
        <span className="flex items-center gap-1.5">
          <Thermometer className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {step.temperatureCelsius}°C
        </span>
      ) : null}
    </p>
  );
}

function UnlockCard({ recipe, lockedCount, price }: { recipe: Recipe; lockedCount: number; price: string | null }) {
  return (
    <div className="rounded-[1.75rem] bg-amber-950 p-7 text-amber-50 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">Premium retsept</p>
      <h3 className="mt-3 max-w-xl text-3xl font-medium leading-tight sm:text-4xl">Qolgan {lockedCount} qadam {recipe.creator.name} qo‘llanmasida.</h3>
      <ul className="mt-6 grid gap-x-8 gap-y-2.5 text-amber-100 sm:grid-cols-2">
        {PREMIUM_INCLUDES.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-400" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4 border-t border-amber-50/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
        {price && <p className="font-serif text-4xl font-semibold">{price}</p>}
        <div className="sm:text-right">
          <Button size="xl" disabled className="bg-amber-50 text-amber-950">
            To‘lov tez orada ulanadi
          </Button>
          <p className="mt-2 text-sm text-amber-200">Hozircha saqlab qo‘ying — to‘lov ochilganda kutubxonangizda bo‘ladi.</p>
        </div>
      </div>
      <p className="mt-6 text-sm text-amber-200">
        Hozir pishirmoqchimisiz?{" "}
        <Link href={`/creators/${recipe.creator.slug}`} className="font-medium text-amber-50 underline underline-offset-4">
          {recipe.creator.name}ning bepul retseptlarini ko‘ring
        </Link>
        .
      </p>
    </div>
  );
}

interface Props {
  recipe: Recipe;
  isLoggedIn: boolean;
  isSaved: boolean;
  /** Other recipes by the same creator. */
  moreRecipes: Recipe[];
  savedIds: Set<string>;
  reviews: Review[];
  rating: RatingSummary;
  /** Null for visitors who are not signed in. */
  eligibility: ReviewEligibility | null;
}

export function RecipeDetail({ recipe, isLoggedIn, isSaved, moreRecipes, savedIds, reviews, rating, eligibility }: Props) {
  const { creator } = recipe;
  const times = { prepMinutes: recipe.prepTimeMinutes, cookMinutes: recipe.cookTimeMinutes };
  const price = recipe.isPremium && recipe.price !== undefined ? formatPrice(recipe.price, recipe.currency ?? PLATFORM_CONFIG.pricing.currency) : null;
  const previewCount = recipe.isPremium ? Math.min(PLATFORM_CONFIG.premium.freePreviewSteps, recipe.steps.length) : recipe.steps.length;
  const openSteps = recipe.steps.slice(0, previewCount);
  const lockedSteps = recipe.steps.slice(previewCount);
  const ingredientsById = new Map(recipe.ingredients.map((i) => [i.id, i]));

  return (
    <ServingsProvider base={recipe.servings}>
      <article className={cn("pb-24", !recipe.isPremium && "max-lg:pb-36")}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd(recipe)).replace(/</g, "\\u003c") }} />

        <Container size="xl" className="pt-6">
          <nav aria-label="Sahifa yo‘li" className="text-sm text-amber-600">
            <Link href="/recipes" className="hover:text-amber-950 hover:underline">Retseptlar</Link>
            <span aria-hidden="true" className="mx-2 text-amber-400">/</span>
            <span className="text-amber-900">{recipe.title}</span>
          </nav>

          <div className="mt-5 grid items-start gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <RecipeGallery
              photos={recipe.media.map((m) => ({ url: m.url, alt: m.alt ?? recipe.title }))}
              badge={
                <span className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-sm", recipe.isPremium ? "bg-amber-950/90 text-amber-50" : "bg-sage-600/95 text-amber-50")}>
                  {recipe.isPremium ? "Premium" : "Bepul"}
                  {price && (
                    <>
                      <span className="h-3.5 w-px bg-amber-50/40" aria-hidden="true" />
                      <span className="text-clay-100">{price}</span>
                    </>
                  )}
                </span>
              }
            />

            <header className="lg:sticky lg:top-24 lg:py-4">
              {recipe.tags.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{recipe.tags.slice(0, 3).join(" · ")}</p>
              )}
              <h1 className="mt-4 text-[2.6rem] font-medium leading-[1.04] text-amber-950 break-words sm:text-6xl">{recipe.title}</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-amber-900">{recipe.description}</p>
              {rating.count > 0 && (
                <a href="#reviews-heading" className="mt-4 flex w-fit items-center gap-2 text-sm text-amber-900 hover:text-amber-700">
                  <RatingStars value={rating.average} />
                  <span className="font-semibold text-amber-950">{formatRating(rating.average)}</span>
                  <span className="underline underline-offset-4">{formatNumber(rating.count)} ta baho</span>
                </a>
              )}

              <Link href={`/creators/${creator.slug}`} className="group mt-7 flex w-fit items-center gap-3">
                {creator.avatarUrl ? (
                  <Image src={creator.avatarUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 font-serif text-xl text-sage-700" aria-hidden="true">
                    {creator.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span>
                  <span className="block text-xs uppercase tracking-wider text-amber-600">Muallif</span>
                  <span className="block font-medium text-amber-950 group-hover:text-amber-700 group-hover:underline">{creator.name}</span>
                </span>
              </Link>

              <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-amber-200 py-5">
                {[
                  { label: "Umumiy vaqt", icon: Clock, value: <ScaledTime {...times} part="total" /> },
                  { label: "Asl porsiya", icon: Users, value: `${recipe.servings} kishilik` },
                  { label: "Qiyinligi", icon: ChefHat, value: DIFFICULTY_LABEL[recipe.difficulty] },
                ].map(({ label, icon: Icon, value }) => (
                  <div key={label} className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-600">
                      <Icon className="h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} aria-hidden="true" />
                      {label}
                    </dt>
                    <dd className="mt-1.5 font-serif text-xl font-medium text-amber-950">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-amber-600">
                Tayyorlash <ScaledTime {...times} part="prep" /> · Pishirish <ScaledTime {...times} part="cook" />
                {recipe.cookedCount > 0 && (
                  <span className="ml-3 inline-flex items-center gap-1 text-sage-600">
                    <Flame className="h-4 w-4" aria-hidden="true" />
                    {formatNumber(recipe.cookedCount)} marta pishirilgan
                  </span>
                )}
              </p>

              <div className="mt-8">
                {recipe.isPremium ? (
                  <div className="rounded-2xl bg-amber-100 p-5">
                    <p className="font-medium text-amber-950">
                      Masalliqlar va dastlabki {previewCount} qadam bepul.
                      {price && <> To‘liq qo‘llanma — <span className="font-serif text-xl font-semibold text-amber-700">{price}</span>.</>}
                    </p>
                    <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
                      <a href="#steps-heading">Bepul qismini o‘qish</a>
                    </Button>
                  </div>
                ) : (
                  <CookLink slug={recipe.slug} size="xl" className="hidden w-full lg:inline-flex">Men bilan pishiring</CookLink>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <SaveButton recipeId={recipe.id} slug={recipe.slug} initialSaved={isSaved} isLoggedIn={isLoggedIn} />
                <ShareButton title={recipe.title} path={`/recipes/${recipe.slug}`} />
              </div>
            </header>
          </div>
        </Container>

        <Container size="xl" className="mt-16 grid items-start gap-12 lg:mt-24 lg:grid-cols-[23rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[26rem_minmax(0,1fr)] xl:gap-20">
          <section aria-labelledby="ingredients-heading" className="rounded-[1.75rem] bg-sage-50 p-6 sm:p-8 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="ingredients-heading" className="text-3xl font-medium text-amber-950">Masalliqlar</h2>
              <p className="text-sm text-sage-600">{recipe.ingredients.length} ta</p>
            </div>
            <p className="mt-2 text-sm text-amber-900">Necha kishiga pishirasiz? Miqdorlar shunga qarab o‘zgaradi.</p>
            <div className="mt-5 border-y border-sage-200 py-4">
              <ServingsStepper />
            </div>
            <ScaledIngredients ingredients={recipe.ingredients} />
          </section>

          <section aria-labelledby="steps-heading" className="min-w-0">
            <div className="flex items-baseline justify-between gap-4 border-b border-amber-950 pb-4">
              <h2 id="steps-heading" className="scroll-mt-24 text-3xl font-medium text-amber-950 sm:text-4xl">Tayyorlash usuli</h2>
              <p className="shrink-0 text-sm text-amber-600">{recipe.steps.length} qadam</p>
            </div>

            <ol>
              {openSteps.map((step) => (
                <li key={step.id} className="grid gap-x-6 gap-y-4 border-b border-amber-200 py-10 sm:grid-cols-[5.5rem_minmax(0,1fr)] lg:gap-x-10">
                  <p className="font-serif text-6xl font-medium leading-none text-clay-400 tabular-nums sm:text-7xl" aria-hidden="true">
                    {String(step.order).padStart(2, "0")}
                  </p>
                  <div className="min-w-0 space-y-4">
                    <StepFacts step={step} />
                    <h3 className="text-2xl font-medium leading-snug text-amber-950 sm:text-[1.75rem]">
                      <span className="sr-only">{step.order}-qadam: </span>
                      {step.title}
                    </h3>
                    <p className="max-w-2xl text-lg leading-relaxed text-amber-900">{step.instruction}</p>
                    <StepIngredients ingredients={(step.ingredientIds ?? []).map((id) => ingredientsById.get(id)).filter((i) => i !== undefined)} />
                    {step.mediaUrl && (
                      <div className="relative aspect-[16/9] max-w-2xl overflow-hidden rounded-2xl bg-amber-100">
                        <Image src={step.mediaUrl} alt={step.title} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
                      </div>
                    )}
                    {step.tip && (
                      <p className="max-w-2xl rounded-2xl bg-clay-100/60 px-5 py-4 text-amber-950">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Oshpaz maslahati</span>
                        {step.tip}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {lockedSteps.length > 0 && (
              <>
                <div className="py-10">
                  <UnlockCard recipe={recipe} lockedCount={lockedSteps.length} price={price} />
                </div>
                <ol start={previewCount + 1} aria-label="Premium qadamlar">
                  {lockedSteps.map((step) => (
                    <li key={step.id} className="grid items-center gap-x-6 border-t border-amber-200 py-6 sm:grid-cols-[5.5rem_minmax(0,1fr)] lg:gap-x-10">
                      <p className="font-serif text-4xl font-medium leading-none text-amber-300 tabular-nums sm:text-5xl" aria-hidden="true">
                        {String(step.order).padStart(2, "0")}
                      </p>
                      <div className="flex min-w-0 items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-xl font-medium text-amber-600">{step.title}</h3>
                          {step.timerSeconds ? <p className="mt-1 text-sm text-amber-500">Taymer bilan · {formatMinutes(Math.round(step.timerSeconds / 60))}</p> : null}
                        </div>
                        <Lock className="h-5 w-5 shrink-0 text-amber-400" aria-label="Premium qadam" />
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {!recipe.isPremium && (
              <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-[1.75rem] bg-amber-100 p-7 sm:flex-row sm:items-center sm:p-9">
                <div>
                  <h3 className="text-2xl font-medium text-amber-950 sm:text-3xl">Oshxonada boshlashga tayyormisiz?</h3>
                  <p className="mt-1.5 text-amber-900">Har bir qadam katta matn va taymer bilan, birma-bir ko‘rsatiladi.</p>
                </div>
                <CookLink slug={recipe.slug} size="xl" className="shrink-0">Men bilan pishiring</CookLink>
              </div>
            )}
          </section>
        </Container>

        <Container size="xl" className="mt-20 border-t border-amber-200 pt-14 lg:mt-28">
          <h2 id="reviews-heading" className="scroll-mt-24 text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">Pishirganlar fikri</h2>
          <div className="mt-8 grid items-start gap-12 lg:grid-cols-[23rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[26rem_minmax(0,1fr)] xl:gap-20">
            <div>
              {rating.count > 0 ? (
                <RatingOverview rating={rating} />
              ) : (
                <p className="text-amber-900">Hali baholar yo‘q. Bu retseptni faqat uni oxirigacha pishirgan odamlar baholay oladi.</p>
              )}
            </div>
            <div className="min-w-0 space-y-10">
              {eligibility?.canReview && (
                <div className="rounded-[1.75rem] bg-amber-100 p-6 sm:p-8">
                  <h3 className="text-2xl font-medium text-amber-950">{eligibility.existing ? "Bahoyingizni yangilang" : "Siz buni pishirdingiz — qanday chiqdi?"}</h3>
                  <p className="mb-5 mt-1 text-amber-900">Bahoyingiz boshqalarga va ijodkorga yordam beradi.</p>
                  <ReviewForm recipeId={recipe.id} initial={eligibility.existing} />
                </div>
              )}
              {!eligibility?.canReview && !recipe.isPremium && (
                <p className="rounded-2xl bg-sage-50 px-5 py-4 text-sage-900">
                  {isLoggedIn
                    ? "Baho qoldirish uchun retseptni “Men bilan pishiring” rejimida oxirigacha pishiring."
                    : "Baho qoldirish uchun tizimga kiring va retseptni “Men bilan pishiring” rejimida oxirigacha pishiring."}
                </p>
              )}
              {reviews.length > 0 && <ReviewList reviews={reviews} />}
            </div>
          </div>
        </Container>

        {moreRecipes.length > 0 && (
          <Container size="xl" className="mt-20 border-t border-amber-200 pt-14 lg:mt-28">
            <div className="mb-8 flex items-end justify-between gap-6">
              <h2 className="text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">{creator.name}dan yana</h2>
              <Link href={`/creators/${creator.slug}`} className="hidden shrink-0 pb-1 font-medium text-amber-950 hover:text-amber-700 sm:block">Barcha retseptlari →</Link>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
              {moreRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} isLoggedIn={isLoggedIn} saved={savedIds.has(r.id)} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" />
              ))}
            </div>
          </Container>
        )}

        {!recipe.isPremium && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-200 bg-amber-50/95 p-3 backdrop-blur-md lg:hidden">
            <CookLink slug={recipe.slug} size="xl" className="w-full">Men bilan pishiring</CookLink>
          </div>
        )}
      </article>
    </ServingsProvider>
  );
}
