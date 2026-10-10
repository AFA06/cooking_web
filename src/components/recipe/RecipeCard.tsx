import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock, Star, Users } from "lucide-react";
import { CaloriesBadge } from "@/components/recipe/NutritionFacts";
import { BookmarkButton } from "@/components/recipe/BookmarkButton";
import { DIFFICULTY_LABEL, formatMinutes, formatNumber, formatPrice } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

interface Props {
  recipe: Recipe;
  isLoggedIn?: boolean;
  saved?: boolean;
  /** Portrait crops read better in multi-column grids; landscape in wide slots. */
  shape?: "portrait" | "landscape";
  sizes?: string;
  priority?: boolean;
}

export function RecipeCard({ recipe, isLoggedIn = false, saved = false, shape = "portrait", sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw", priority }: Props) {
  const total = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const price = recipe.isPremium && recipe.price !== undefined ? formatPrice(recipe.price, recipe.currency ?? PLATFORM_CONFIG.pricing.currency) : null;
  const { creator } = recipe;
  const facts = [
    { label: "Vaqt", value: formatMinutes(total), icon: Clock },
    { label: "Porsiya", value: `${recipe.servings} kishilik`, icon: Users },
    { label: "Qiyinligi", value: DIFFICULTY_LABEL[recipe.difficulty], icon: ChefHat },
  ];

  return (
    <article className="group relative">
      <div className={cn("relative overflow-hidden rounded-[1.25rem] bg-amber-100", shape === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]")}>
        <Image
          src={recipe.coverMedia.url}
          alt={recipe.coverMedia.alt ?? recipe.title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <span
          className={cn(
            "absolute left-3 top-3 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold tracking-wide shadow-sm backdrop-blur-sm",
            recipe.isPremium ? "bg-amber-950/90 text-amber-50" : "bg-sage-600/95 text-amber-50",
          )}
        >
          {recipe.isPremium ? "Premium" : "Bepul"}
          {price && (
            <>
              <span className="h-3 w-px bg-amber-50/40" aria-hidden="true" />
              <span className="text-clay-100">{price}</span>
            </>
          )}
        </span>
        {/* One row along the bottom edge, so the rating pill and the calories can never sit on top of each other. */}
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          {(recipe.rating.count > 0 || recipe.cookedCount > 0) && (
            <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-2xl bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-sm">
              {recipe.rating.count > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-clay-400 text-clay-400" aria-hidden="true" />
                  <span className="sr-only">Baho: </span>
                  {recipe.rating.average.toFixed(1).replace(".", ",")}
                  <span className="font-normal text-amber-600">({formatNumber(recipe.rating.count)})</span>
                </span>
              )}
              {recipe.cookedCount > 0 && (
                <span className="flex items-center gap-1">
                  <ChefHat className="h-3.5 w-3.5 text-amber-700" strokeWidth={2} aria-hidden="true" />
                  {formatNumber(recipe.cookedCount)} marta pishirilgan
                </span>
              )}
            </p>
          )}
          {recipe.nutrition && <CaloriesBadge calories={recipe.nutrition.calories} className="ml-auto" />}
        </div>
        <BookmarkButton recipeId={recipe.id} slug={recipe.slug} initialSaved={saved} isLoggedIn={isLoggedIn} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="mt-4">
        <h3 className="line-clamp-2 text-2xl font-medium leading-tight text-amber-950 break-words">
          <Link href={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem] group-hover:text-amber-700">
            {recipe.title}
          </Link>
        </h3>

        <p className="mt-2.5 flex items-center gap-2.5 text-[0.95rem] text-amber-900">
          {creator.avatarUrl ? (
            <Image src={creator.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-sm text-sage-700" aria-hidden="true">
              {creator.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="truncate">{creator.name}</span>
        </p>

        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-amber-900">
          {facts.map(({ label, value, icon: Icon }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">{label}: </span>
              {value}
            </li>
          ))}
        </ul>

      </div>
    </article>
  );
}
