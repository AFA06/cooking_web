import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DIFFICULTY_LABEL, formatMinutes, formatPrice } from "@/lib/format";
import { PLATFORM_CONFIG } from "@/lib/constants";
import type { Recipe } from "@/types/recipe";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const total = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-amber-100">
        <Image
          src={recipe.coverMedia.url}
          alt={recipe.coverMedia.alt ?? recipe.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant={recipe.isPremium ? "premium" : "free"}>{recipe.isPremium ? "Premium" : "Bepul"}</Badge>
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-sm text-amber-600">{recipe.creator.name}</p>
        <h3 className="mt-1 text-xl font-medium leading-snug text-amber-950 break-words">
          <Link href={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 group-hover:text-amber-700">
            {recipe.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-amber-900">{recipe.description}</p>
        <p className="mt-3 text-sm text-amber-600">
          {formatMinutes(total)} · {recipe.servings} porsiya · {DIFFICULTY_LABEL[recipe.difficulty]}
          {recipe.isPremium && recipe.price !== undefined && (
            <> · <span className="font-semibold text-amber-950">{formatPrice(recipe.price, recipe.currency ?? PLATFORM_CONFIG.pricing.currency)}</span></>
          )}
        </p>
      </div>
    </article>
  );
}
