import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock, Flame } from "lucide-react";
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
            "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm",
            recipe.isPremium ? "bg-amber-950/90 text-amber-50" : "bg-sage-600/95 text-white",
          )}
        >
          {recipe.isPremium ? (price ? `Premium · ${price}` : "Premium") : "Bepul"}
        </span>
        <BookmarkButton recipeId={recipe.id} slug={recipe.slug} initialSaved={saved} isLoggedIn={isLoggedIn} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="mt-5">
        <h3 className="text-2xl font-medium leading-tight text-amber-950 break-words">
          <Link href={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem] group-hover:text-amber-700">
            {recipe.title}
          </Link>
        </h3>

        <p className="mt-3 flex items-center gap-2.5 text-[0.95rem] text-amber-900">
          {creator.avatarUrl ? (
            <Image src={creator.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-sm text-sage-700" aria-hidden="true">
              {creator.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="truncate">{creator.name}</span>
        </p>

        <dl className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-amber-200 pt-3.5 text-sm text-amber-600">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Umumiy vaqt</dt>
            <Clock className="h-4 w-4 text-amber-500" strokeWidth={1.75} aria-hidden="true" />
            <dd>{formatMinutes(total)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Murakkablik</dt>
            <ChefHat className="h-4 w-4 text-amber-500" strokeWidth={1.75} aria-hidden="true" />
            <dd>{DIFFICULTY_LABEL[recipe.difficulty]}</dd>
          </div>
          {recipe.cookedCount > 0 && (
            <div className="flex items-center gap-1.5 text-sage-600">
              <dt className="sr-only">Pishirilgan</dt>
              <Flame className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <dd>{formatNumber(recipe.cookedCount)} marta pishirilgan</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
