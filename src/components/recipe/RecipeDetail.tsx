import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { NutritionFacts } from "@/components/recipe/NutritionFacts";
import { StepMedia } from "@/components/recipe/StepMedia";
import { ChefHat, Clock, Flame, Lock, Thermometer, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipeGallery } from "@/components/recipe/RecipeGallery";
import { SaveButton } from "@/components/recipe/SaveButton";
import { CookLink, ScaledIngredients, ScaledTime, ServingsProvider, ServingsStepper, StepIngredients } from "@/components/recipe/Servings";
import { ShareButton } from "@/components/recipe/ShareButton";
import { getLocale, getT } from "@/i18n/server";
import { LOCALE_INFO, type Locale, type TFunction } from "@/i18n/core";
import { parseVideoUrl } from "@/lib/video";
import type { RecipeSecrets } from "@/server/secrets";
import { DIFFICULTY_KEY, formatMinutes, formatPrice, toIsoDuration } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AddToShoppingList } from "@/components/shopping/AddToShoppingList";
import { RatingStars, formatRating } from "@/components/reviews/RatingStars";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { RatingOverview, ResultPhotos, ReviewList } from "@/components/reviews/ReviewList";
import type { RatingSummary, Review, ReviewEligibility } from "@/server/reviews";
import type { Recipe, RecipeStep } from "@/types/recipe";

function recipeJsonLd(recipe: Recipe, locale: Locale, t: TFunction) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    inLanguage: LOCALE_INFO[locale].html,
    description: recipe.description,
    image: recipe.media.map((m) => m.url),
    author: { "@type": "Person", name: recipe.creator.name },
    datePublished: recipe.publishedAt,
    prepTime: toIsoDuration(recipe.prepTimeMinutes),
    cookTime: toIsoDuration(recipe.cookTimeMinutes),
    totalTime: toIsoDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes),
    recipeYield: t("detail.servingsYield", { count: recipe.servings }),
    keywords: recipe.tags.join(", "),
    ...(recipe.nutrition && {
      nutrition: {
        "@type": "NutritionInformation",
        calories: `${recipe.nutrition.calories} kcal`,
        proteinContent: `${recipe.nutrition.proteinGrams} g`,
        fatContent: `${recipe.nutrition.fatGrams} g`,
        carbohydrateContent: `${recipe.nutrition.carbGrams} g`,
      },
    }),
    ...(recipe.rating.count > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: recipe.rating.average.toFixed(1), ratingCount: recipe.rating.count },
    }),
    recipeIngredient: recipe.ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`),
    // Only what the page shows to everyone: a premium recipe's locked steps stay out of the markup.
    recipeInstructions: recipe.steps.filter((s) => !recipe.isPremium || s.isFree).map((s) => ({ "@type": "HowToStep", name: s.title, text: s.instruction })),
  };
}

const PREMIUM_INCLUDES = ["detail.include1", "detail.include2", "detail.include3", "detail.include4"];

function StepFacts({ step, t }: { step: RecipeStep; t: TFunction }) {
  if (!step.timerSeconds && !step.temperatureCelsius) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-amber-700">
      {step.timerSeconds ? (
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {formatMinutes(Math.round(step.timerSeconds / 60), t)}
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

function UnlockCard({ recipe, lockedCount, price, t }: { recipe: Recipe; lockedCount: number; price: string | null; t: TFunction }) {
  return (
    <div className="rounded-[1.75rem] bg-amber-950 p-7 text-amber-50 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">{t("detail.premiumRecipe")}</p>
      <h3 className="mt-3 max-w-xl text-3xl font-medium leading-tight sm:text-4xl">{t("detail.lockedTitle", { count: lockedCount, name: recipe.creator.name })}</h3>
      <ul className="mt-6 grid gap-x-8 gap-y-2.5 text-amber-100 sm:grid-cols-2">
        {PREMIUM_INCLUDES.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-400" aria-hidden="true" />
            {t(item)}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4 border-t border-amber-50/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
        {price && <p className="font-serif text-4xl font-semibold">{price}</p>}
        <div className="sm:text-right">
          <Button size="xl" disabled className="bg-amber-50 text-amber-950">
            {t("detail.paymentSoon")}
          </Button>
          <p className="mt-2 text-sm text-amber-200">{t("detail.paymentSoonNote")}</p>
        </div>
      </div>
      <p className="mt-6 text-sm text-amber-200">
        {t("detail.cookNow")}{" "}
        <Link href={`/creators/${recipe.creator.slug}`} className="font-medium text-amber-50 underline underline-offset-4">
          {t("detail.creatorFree", { name: recipe.creator.name })}
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
  /** Servings this recipe is on the visitor's shopping list for, if it is. */
  shoppingServings: number | null;
  /** Insider notes of a premium recipe; null for free recipes. */
  secrets: RecipeSecrets | null;
}

export async function RecipeDetail({ recipe, isLoggedIn, isSaved, moreRecipes, savedIds, reviews, rating, eligibility, shoppingServings, secrets }: Props) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { creator } = recipe;
  const times = { prepMinutes: recipe.prepTimeMinutes, cookMinutes: recipe.cookTimeMinutes };
  const price = recipe.isPremium && recipe.price !== undefined ? formatPrice(recipe.price, recipe.currency ?? PLATFORM_CONFIG.pricing.currency, t) : null;
  // On a premium recipe the creator marks each step free or premium; a free recipe shows everything.
  const isOpen = (step: Recipe["steps"][number]) => !recipe.isPremium || step.isFree;
  const openCount = recipe.steps.filter(isOpen).length;
  const lockedCount = recipe.steps.length - openCount;
  const firstLocked = recipe.steps.findIndex((step) => !isOpen(step));
  const ingredientsById = new Map(recipe.ingredients.map((i) => [i.id, i]));
  const video = recipe.videoUrl ? parseVideoUrl(recipe.videoUrl) : null;

  return (
    <ServingsProvider base={recipe.servings}>
      <article className={cn("pb-24", !recipe.isPremium && "max-lg:pb-36")}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd(recipe, locale, t)).replace(/</g, "\\u003c") }} />

        <Container size="xl" className="pt-6">
          <nav aria-label={t("detail.breadcrumb")} className="text-sm text-amber-600">
            <Link href="/recipes" className="hover:text-amber-950 hover:underline">{t("nav.recipes")}</Link>
            <span aria-hidden="true" className="mx-2 text-amber-400">/</span>
            <span className="text-amber-900">{recipe.title}</span>
          </nav>

          <div className="mt-5 grid items-start gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <RecipeGallery
              photos={recipe.media.map((m) => ({ url: m.url, alt: m.alt ?? recipe.title }))}
              badge={
                <span className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-sm", recipe.isPremium ? "bg-amber-950/90 text-amber-50" : "bg-sage-600/95 text-amber-50")}>
                  {recipe.isPremium ? t("filter.premium") : t("filter.free")}
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
                  <span className="underline underline-offset-4">{t("detail.ratingsLink", { count: rating.count })}</span>
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
                  <span className="block text-xs uppercase tracking-wider text-amber-600">{t("detail.author")}</span>
                  <span className="block font-medium text-amber-950 group-hover:text-amber-700 group-hover:underline">{creator.name}</span>
                </span>
              </Link>

              <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-amber-200 py-5">
                {[
                  { label: t("detail.totalTime"), icon: Clock, value: <ScaledTime {...times} part="total" /> },
                  { label: t("detail.originalServings"), icon: Users, value: t("card.servingsValue", { count: recipe.servings }) },
                  { label: t("recipes.filterDifficulty"), icon: ChefHat, value: t(DIFFICULTY_KEY[recipe.difficulty]) },
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
              {recipe.nutrition && <NutritionFacts nutrition={recipe.nutrition} className="mt-5" />}
              <p className="mt-3 text-sm text-amber-600">
                {t("detail.prep")} <ScaledTime {...times} part="prep" /> · {t("detail.cook")} <ScaledTime {...times} part="cook" />
                {recipe.cookedCount > 0 && (
                  <span className="ml-3 inline-flex items-center gap-1 text-sage-600">
                    <Flame className="h-4 w-4" aria-hidden="true" />
                    {t("card.cooked", { count: recipe.cookedCount })}
                  </span>
                )}
              </p>

              <div className="mt-8">
                {recipe.isPremium ? (
                  <div className="rounded-2xl bg-amber-100 p-5">
                    <p className="font-medium text-amber-950">
                      {openCount > 0 ? t("detail.premiumIntro", { count: openCount }) : t("detail.premiumIntroNone")}
                      {price && <> {t("detail.fullGuide")} <span className="font-serif text-xl font-semibold text-amber-700">{price}</span>.</>}
                    </p>
                    <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
                      <a href="#steps-heading">{t("detail.readFree")}</a>
                    </Button>
                  </div>
                ) : (
                  <CookLink slug={recipe.slug} size="xl" className="hidden w-full lg:inline-flex">{t("home.cookWithMe")}</CookLink>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <SaveButton recipeId={recipe.id} slug={recipe.slug} initialSaved={isSaved} isLoggedIn={isLoggedIn} />
                <ShareButton title={recipe.title} path={`/recipes/${recipe.slug}`} />
              </div>
            </header>
          </div>
        </Container>

        {video && (
          <Container size="xl" className="mt-14 lg:mt-20">
            <h2 className="text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">{t("detail.video")}</h2>
            <div className="mt-5 aspect-video max-w-5xl overflow-hidden rounded-[1.75rem] bg-ink">
              {video.kind === "file" ? (
                <video src={video.src} controls preload="metadata" playsInline className="h-full w-full" />
              ) : (
                <iframe
                  src={video.embedUrl}
                  title={t("detail.videoTitle", { title: recipe.title })}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="h-full w-full"
                />
              )}
            </div>
          </Container>
        )}

        <Container size="xl" className="mt-16 grid items-start gap-12 lg:mt-24 lg:grid-cols-[23rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[26rem_minmax(0,1fr)] xl:gap-20">
          <section aria-labelledby="ingredients-heading" className="rounded-[1.75rem] bg-sage-50 p-6 sm:p-8 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="ingredients-heading" className="text-3xl font-medium text-amber-950">{t("detail.ingredients")}</h2>
              <p className="text-sm text-sage-600">{t("detail.ingredientsCount", { count: recipe.ingredients.length })}</p>
            </div>
            <p className="mt-2 text-sm text-amber-900">{t("detail.servingsHint")}</p>
            <div className="mt-5 border-y border-sage-200 py-4">
              <ServingsStepper />
            </div>
            <ScaledIngredients ingredients={recipe.ingredients} />
            <div className="mt-5 border-t border-sage-200 pt-5">
              <AddToShoppingList recipeId={recipe.id} slug={recipe.slug} isLoggedIn={isLoggedIn} listedServings={shoppingServings} />
            </div>
          </section>

          <section aria-labelledby="steps-heading" className="min-w-0">
            <div className="flex items-baseline justify-between gap-4 border-b border-amber-950 pb-4">
              <h2 id="steps-heading" className="scroll-mt-24 text-3xl font-medium text-amber-950 sm:text-4xl">{t("detail.method")}</h2>
              <p className="shrink-0 text-sm text-amber-600">{t("detail.stepsCount", { count: recipe.steps.length })}</p>
            </div>

            <ol>
              {recipe.steps.map((step, index) =>
                isOpen(step) ? (
                  <li key={step.id} className="grid gap-x-6 gap-y-4 border-b border-amber-200 py-10 sm:grid-cols-[5.5rem_minmax(0,1fr)] lg:gap-x-10">
                    <p className="font-serif text-6xl font-medium leading-none text-clay-400 tabular-nums sm:text-7xl" aria-hidden="true">
                      {String(step.order).padStart(2, "0")}
                    </p>
                    <div className="min-w-0 space-y-4">
                      <StepFacts step={step} t={t} />
                      <h3 className="text-2xl font-medium leading-snug text-amber-950 sm:text-[1.75rem]">
                        <span className="sr-only">{t("detail.stepLabel", { n: step.order })} </span>
                        {step.title}
                      </h3>
                      <p className="max-w-2xl text-lg leading-relaxed text-amber-900">{step.instruction}</p>
                      <StepIngredients ingredients={(step.ingredientIds ?? []).map((id) => ingredientsById.get(id)).filter((i) => i !== undefined)} />
                      <StepMedia step={step} sizes="(max-width: 1024px) 100vw, 45vw" className="max-w-2xl rounded-2xl" />
                      {step.tip && (
                        <p className="max-w-2xl rounded-2xl bg-clay-100/60 px-5 py-4 text-amber-950">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">{t("detail.tip")}</span>
                          {step.tip}
                        </p>
                      )}
                    </div>
                  </li>
                ) : (
                  <Fragment key={step.id}>
                    {index === firstLocked && (
                      <li className="list-none py-10">
                        <UnlockCard recipe={recipe} lockedCount={lockedCount} price={price} t={t} />
                      </li>
                    )}
                    <li className="grid items-center gap-x-6 border-t border-amber-200 py-6 sm:grid-cols-[5.5rem_minmax(0,1fr)] lg:gap-x-10">
                      <p className="font-serif text-4xl font-medium leading-none text-amber-300 tabular-nums sm:text-5xl" aria-hidden="true">
                        {String(step.order).padStart(2, "0")}
                      </p>
                      <div className="flex min-w-0 items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-xl font-medium text-amber-600">{step.title}</h3>
                          {step.timerSeconds ? <p className="mt-1 text-sm text-amber-500">{t("detail.withTimer", { time: formatMinutes(Math.round(step.timerSeconds / 60), t) })}</p> : null}
                        </div>
                        <Lock className="h-5 w-5 shrink-0 text-amber-400" aria-label={t("detail.premiumStep")} />
                      </div>
                    </li>
                  </Fragment>
                ),
              )}
            </ol>

            {secrets?.exists && (
              <section aria-labelledby="secrets-heading" className="mt-12 rounded-[1.75rem] border-2 border-dashed border-amber-700/60 bg-clay-100/50 p-7 sm:p-9">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  {secrets.notes ? (secrets.asOwner ? t("detail.secretsOwner") : t("detail.secretsFor")) : t("detail.secretsFor")}
                </p>
                <h3 id="secrets-heading" className="mt-3 font-serif text-3xl font-medium text-amber-950">{t("detail.secretsTitle")}</h3>
                {secrets.notes ? (
                  <p className="mt-4 whitespace-pre-line text-xl leading-relaxed text-amber-950">{secrets.notes}</p>
                ) : (
                  <p className="mt-3 text-lg text-amber-900">{t("detail.secretsLocked", { name: creator.name })}</p>
                )}
              </section>
            )}

            {!recipe.isPremium && (
              <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-[1.75rem] bg-amber-100 p-7 sm:flex-row sm:items-center sm:p-9">
                <div>
                  <h3 className="text-2xl font-medium text-amber-950 sm:text-3xl">{t("detail.readyTitle")}</h3>
                  <p className="mt-1.5 text-amber-900">{t("detail.readyText")}</p>
                </div>
                <CookLink slug={recipe.slug} size="xl" className="shrink-0">{t("home.cookWithMe")}</CookLink>
              </div>
            )}
          </section>
        </Container>

        <Container size="xl" className="mt-20 border-t border-amber-200 pt-14 lg:mt-28">
          <h2 id="reviews-heading" className="scroll-mt-24 text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">{t("detail.reviews")}</h2>
          <p className="mt-2 max-w-2xl text-amber-900">{t("detail.reviewsNote")}</p>
          <ResultPhotos reviews={reviews} className="mt-8" />
          <div className="mt-8 grid items-start gap-12 lg:grid-cols-[23rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[26rem_minmax(0,1fr)] xl:gap-20">
            <div>
              {rating.count > 0 ? (
                <RatingOverview rating={rating} />
              ) : (
                <p className="text-amber-900">{t("detail.noRatings")}</p>
              )}
            </div>
            <div className="min-w-0 space-y-10">
              {eligibility?.canReview && (
                <div className="rounded-[1.75rem] bg-amber-100 p-6 sm:p-8">
                  <h3 className="text-2xl font-medium text-amber-950">{eligibility.existing ? t("detail.updateRating") : t("detail.howDidItGo")}</h3>
                  <p className="mb-5 mt-1 text-amber-900">{t("detail.ratingHelps")}</p>
                  <ReviewForm recipeId={recipe.id} initial={eligibility.existing} />
                </div>
              )}
              {!eligibility?.canReview && !recipe.isPremium && (
                <p className="rounded-2xl bg-sage-50 px-5 py-4 text-sage-900">
                  {isLoggedIn
                    ? t("detail.rateHintIn")
                    : t("detail.rateHintOut")}
                </p>
              )}
              {reviews.length > 0 && <ReviewList reviews={reviews} />}
            </div>
          </div>
        </Container>

        {moreRecipes.length > 0 && (
          <Container size="xl" className="mt-20 border-t border-amber-200 pt-14 lg:mt-28">
            <div className="mb-8 flex items-end justify-between gap-6">
              <h2 className="text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">{t("detail.moreFrom", { name: creator.name })}</h2>
              <Link href={`/creators/${creator.slug}`} className="hidden shrink-0 pb-1 font-medium text-amber-950 hover:text-amber-700 sm:block">{t("detail.allRecipesBy")}</Link>
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
            <CookLink slug={recipe.slug} size="xl" className="w-full">{t("home.cookWithMe")}</CookLink>
          </div>
        )}
      </article>
    </ServingsProvider>
  );
}
