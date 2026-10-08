import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PLATFORM_CONFIG } from "@/lib/constants";
import type { Recipe } from "@/types/recipe";

function formatTime(minutes: number): string {
  if (minutes === 0) return "No cook time";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

interface RecipeCardProps {
  recipe: Recipe;
  variant?: "default" | "featured" | "compact";
}

export function RecipeCard({ recipe, variant = "default" }: RecipeCardProps) {
  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  if (variant === "compact") {
    return (
      <Link href={`/recipes/${recipe.slug}`} className="flex gap-3 group">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-amber-100">
          <Image
            src={recipe.coverMedia.url}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="96px"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-medium text-amber-950 line-clamp-1 group-hover:text-amber-700 transition-colors text-sm">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-amber-600 mt-1">
            <span>{recipe.creator.name}</span>
            <span aria-hidden="true">·</span>
            <span>{formatTime(totalTime)}</span>
            <span aria-hidden="true">·</span>
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {recipe.isPremium && (
              <Badge variant="premium" className="text-[10px] px-1.5 py-0.5">
                Premium
              </Badge>
            )}
            {!recipe.isPremium && (
              <Badge variant="free" className="text-[10px] px-1.5 py-0.5">
                Free
              </Badge>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="group">
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={recipe.coverMedia.url}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              variant={recipe.isPremium ? "premium" : "free"}
              className="text-xs"
            >
              {recipe.isPremium ? "Premium" : "Free"}
            </Badge>
            {recipe.isPremium && (
              <Badge variant="default" className="text-xs bg-amber-100 text-amber-900">
                {recipe.price?.toLocaleString()} {PLATFORM_CONFIG.pricing.currency}
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 right-3">
            <Badge variant="default" className="text-xs bg-white/90 backdrop-blur-sm">
              {formatTime(totalTime)}
            </Badge>
          </div>
        </div>
        <CardContent className="flex-1 flex flex-col pt-4 pb-4">
          <div className="flex items-center gap-2 text-xs text-amber-600 mb-2">
            <Link
              href={`/creators/${recipe.creator.slug}`}
              className="font-medium hover:text-amber-900 transition-colors line-clamp-1"
            >
              {recipe.creator.name}
            </Link>
            <span aria-hidden="true">·</span>
            <span>{formatTime(totalTime)}</span>
            <span aria-hidden="true">·</span>
            <span>{recipe.servings} servings</span>
          </div>
          <Link href={`/recipes/${recipe.slug}`}>
            <h3 className="font-semibold text-amber-950 text-lg line-clamp-2 group-hover:text-amber-700 transition-colors mb-3">
              {recipe.title}
            </h3>
          </Link>
          <p className="text-amber-700 text-sm line-clamp-2 flex-1 mb-4">{recipe.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="default" className="text-xs py-0.5 px-2">
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 4 && (
              <Badge variant="default" className="text-xs py-0.5 px-2 text-amber-500">
                +{recipe.tags.length - 4}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/recipes/${recipe.slug}`}>View recipe</Link>
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}