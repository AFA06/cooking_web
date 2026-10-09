import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SaveButton } from "@/components/recipe/SaveButton";
import { CookLink, ScaledIngredients, ScaledTime, ServingsCount, ServingsProvider, ServingsStepper } from "@/components/recipe/Servings";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DIFFICULTY_LABEL, formatPrice, toIsoDuration } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/constants";
import type { Recipe } from "@/types/recipe";

function recipeJsonLd(recipe: Recipe) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    inLanguage: "uz",
    description: recipe.description,
    image: [recipe.coverMedia.url],
    author: { "@type": "Person", name: recipe.creator.name },
    datePublished: recipe.publishedAt,
    prepTime: toIsoDuration(recipe.prepTimeMinutes),
    cookTime: toIsoDuration(recipe.cookTimeMinutes),
    totalTime: toIsoDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes),
    recipeYield: `${recipe.servings} porsiya`,
    keywords: recipe.tags.join(", "),
    recipeIngredient: recipe.ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`),
    recipeInstructions: recipe.steps.map((s) => ({
      "@type": "HowToStep",
      name: s.title,
      text: s.instruction,
    })),
  };
}

export function RecipeDetail({
  recipe,
  isLoggedIn,
  isSaved,
}: {
  recipe: Recipe;
  isLoggedIn: boolean;
  isSaved: boolean;
}) {
  const times = { prepMinutes: recipe.prepTimeMinutes, cookMinutes: recipe.cookTimeMinutes };
  const stepsLocked = recipe.isPremium;

  return (
    <ServingsProvider base={recipe.servings}>
    <article className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd(recipe)).replace(/</g, "\\u003c") }}
      />
      <div className="relative h-64 w-full bg-amber-100 sm:h-[26rem] lg:h-[32rem]">
        <Image
          src={recipe.coverMedia.url}
          alt={recipe.coverMedia.alt ?? recipe.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <Container size="xl" className="pt-8">
        <nav aria-label="Sahifa yo‘li" className="mb-4 text-sm text-amber-600">
          <Link href="/recipes" className="hover:text-amber-900 underline-offset-2 hover:underline">
            Retseptlar
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{recipe.title}</span>
        </nav>

        <header className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={recipe.isPremium ? "premium" : "free"}>{recipe.isPremium ? "Premium" : "Bepul"}</Badge>
            {recipe.isPremium && recipe.price !== undefined && (
              <span className="text-sm text-amber-800">
                {formatPrice(recipe.price, recipe.currency ?? PLATFORM_CONFIG.pricing.currency)}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950 break-words">{recipe.title}</h1>
          <p className="mt-4 text-lg text-amber-800">{recipe.description}</p>
          <p className="mt-4 text-sm text-amber-700">
            Muallif:{" "}
            <Link href={`/creators/${recipe.creator.slug}`} className="font-medium text-amber-900 underline-offset-2 hover:underline">
              {recipe.creator.name}
            </Link>
          </p>
        </header>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-amber-200 py-6 sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-amber-600">Umumiy vaqt</dt>
            <dd className="mt-1 font-medium text-amber-950"><ScaledTime {...times} part="total" /></dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-amber-600">Tayyorlash / Pishirish</dt>
            <dd className="mt-1 font-medium text-amber-950">
              <ScaledTime {...times} part="prep" /> / <ScaledTime {...times} part="cook" />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-amber-600">Porsiya</dt>
            <dd className="mt-1 font-medium text-amber-950"><ServingsCount /> kishilik</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-amber-600">Qiyinligi</dt>
            <dd className="mt-1 font-medium text-amber-950">{DIFFICULTY_LABEL[recipe.difficulty]}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <CookLink slug={recipe.slug} size="lg">Men bilan pishiring</CookLink>
          <SaveButton recipeId={recipe.id} slug={recipe.slug} initialSaved={isSaved} isLoggedIn={isLoggedIn} />
          {recipe.isPremium && (
            <Button size="lg" variant="outline" disabled title="To‘lov hozircha mavjud emas">
              Ochish — tez orada
            </Button>
          )}
        </div>

        <div className="mt-12 grid lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <section aria-labelledby="ingredients-heading">
            <h2 id="ingredients-heading" className="text-2xl font-serif font-medium text-amber-950">
              Masalliqlar
            </h2>
            <p className="mt-1 text-sm text-amber-600">Necha kishiga pishirasiz? Miqdorlar shunga qarab o‘zgaradi.</p>
            <div className="mt-4">
              <ServingsStepper />
            </div>
            <ScaledIngredients ingredients={recipe.ingredients} />
          </section>

          <section aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-2xl font-serif font-medium text-amber-950">
              Tayyorlash usuli
            </h2>
            <ol className="mt-4 space-y-6">
              {recipe.steps.map((s) => (
                <li key={s.id} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                    {s.order}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-amber-950">{s.title}</h3>
                    {!stepsLocked && <p className="mt-1 text-amber-800">{s.instruction}</p>}
                    {stepsLocked && s.timerSeconds ? (
                      <p className="mt-1 text-sm text-amber-700">Taymer bor</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
            {stepsLocked && (
              <p className="mt-8 border-l-2 border-amber-600 pl-4 text-amber-800">
                To‘liq ko‘rsatmalar, taymerlar, maslahatlar va qadam-baqadam pishirish rejimi premium versiyaga kiradi.
                To‘lov tizimi hozircha ulanmagan, shuning uchun bu retseptni ochib bo‘lmaydi.
              </p>
            )}
          </section>
        </div>
      </Container>
    </article>
    </ServingsProvider>
  );
}
