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
  const price = recipe.isPremium && recipe.price !== undefined ? formatPrice(recipe.price, recipe.currency ?? PLATFORM_CONFIG.pricing.currency) : null;

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

      <div className="mt-4">
        <h3 className="text-[1.35rem] font-medium leading-snug text-amber-950 break-words">
          <Link href={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem] group-hover:text-amber-700">
            {recipe.title}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm text-amber-600">
          {recipe.creator.name} · {formatMinutes(total)} · {DIFFICULTY_LABEL[recipe.difficulty]}
        </p>
        <p className="mt-1 text-sm text-amber-600">
          {recipe.isPremium ? "Masalliqlar va dastlabki qadamlar bepul" : "To‘liq ochiq · qadam-baqadam rejim bilan"}
          {recipe.cookedCount > 0 && <span className="text-sage-600"> · {formatNumber(recipe.cookedCount)} marta pishirilgan</span>}
        </p>
      </div>
    </article>
  );
}
