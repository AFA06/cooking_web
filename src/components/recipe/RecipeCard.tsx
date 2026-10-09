import Image from "next/image";
import Link from "next/link";
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
        {recipe.isPremium && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-950/85 px-3 py-1 text-xs font-medium tracking-wide text-amber-50 backdrop-blur-sm">
            Premium
          </span>
        )}
        <BookmarkButton recipeId={recipe.id} slug={recipe.slug} initialSaved={saved} isLoggedIn={isLoggedIn} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="mt-4">
        <h3 className="text-[1.35rem] font-medium leading-snug text-amber-950 break-words">
          <Link href={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem] group-hover:text-amber-700">
            {recipe.title}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm text-amber-600">
          {recipe.creator.name} · {formatMinutes(total)} · {DIFFICULTY_LABEL[recipe.difficulty]}
        </p>
        {(recipe.isPremium || recipe.cookedCount > 0) && (
          <p className="mt-1 text-sm">
            {recipe.isPremium && recipe.price !== undefined && (
              <span className="font-semibold text-amber-950">{formatPrice(recipe.price, recipe.currency ?? PLATFORM_CONFIG.pricing.currency)}</span>
            )}
            {recipe.isPremium && recipe.cookedCount > 0 && <span className="text-amber-400"> · </span>}
            {recipe.cookedCount > 0 && <span className="text-sage-600">{formatNumber(recipe.cookedCount)} marta pishirilgan</span>}
          </p>
        )}
      </div>
    </article>
  );
}
