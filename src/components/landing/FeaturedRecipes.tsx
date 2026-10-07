import * as React from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PLATFORM_CONFIG } from "@/lib/constants";

const FEATURED_RECIPES = [
  {
    id: "1",
    title: "Classic Uzbek Plov",
    creator: "Aziza's Kitchen",
    creatorSlug: "aziza-kitchen",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80",
    prepTime: 30,
    cookTime: 120,
    servings: 6,
    difficulty: "medium" as const,
    isPremium: true,
    price: 15000,
    tags: ["Uzbek", "Rice", "Lamb"],
  },
  {
    id: "2",
    title: "Lagman — Hand-Pulled Noodles",
    creator: "Bekzod Cooks",
    creatorSlug: "bekzod-cooks",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
    prepTime: 45,
    cookTime: 60,
    servings: 4,
    difficulty: "hard" as const,
    isPremium: true,
    price: 20000,
    tags: ["Uzbek", "Noodles", "Beef"],
  },
  {
    id: "3",
    title: "Samsa — Flaky Meat Pastries",
    creator: "Feruza's Table",
    creatorSlug: "feruzas-table",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80",
    prepTime: 60,
    cookTime: 25,
    servings: 8,
    difficulty: "medium" as const,
    isPremium: false,
    tags: ["Uzbek", "Pastry", "Snack"],
  },
  {
    id: "4",
    title: "Shivit Oshi — Khorezm Green Noodles",
    creator: "Aziza's Kitchen",
    creatorSlug: "aziza-kitchen",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80",
    prepTime: 40,
    cookTime: 30,
    servings: 4,
    difficulty: "easy" as const,
    isPremium: false,
    tags: ["Khorezm", "Noodles", "Vegetarian"],
  },
  {
    id: "5",
    title: "Manti — Steamed Dumplings",
    creator: "Bekzod Cooks",
    creatorSlug: "bekzod-cooks",
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&q=80",
    prepTime: 50,
    cookTime: 40,
    servings: 6,
    difficulty: "medium" as const,
    isPremium: true,
    price: 12000,
    tags: ["Uzbek", "Dumplings", "Lamb"],
  },
  {
    id: "6",
    title: "Achichuk — Fresh Tomato Salad",
    creator: "Feruza's Table",
    creatorSlug: "feruzas-table",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    difficulty: "easy" as const,
    isPremium: false,
    tags: ["Salad", "Vegetarian", "Side"],
  },
];

function formatTime(minutes: number): string {
  if (minutes === 0) return "No cook time";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function FeaturedRecipes() {
  return (
    <section className="py-20 lg:py-28 bg-amber-50" aria-labelledby="featured-heading">
      <Container size="lg">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <h2 id="featured-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
              Featured recipes
            </h2>
            <p className="mt-2 text-amber-700">
              From the creators already sharing on Damda
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href={PLATFORM_CONFIG.urls.recipes}>View all recipes →</a>
          </Button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_RECIPES.map((recipe) => (
            <article key={recipe.id} className="group">
              <Card className="overflow-hidden h-full flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={recipe.image}
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
                </div>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-amber-600 mb-2">
                    <span>{recipe.creator}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatTime(recipe.prepTime + recipe.cookTime)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{recipe.servings} servings</span>
                  </div>
                  <h3 className="font-semibold text-amber-950 text-lg line-clamp-2 group-hover:text-amber-700 transition-colors">
                    {recipe.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {recipe.tags.map((tag) => (
                      <Badge key={tag} variant="default" className="text-xs py-0.5 px-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`/recipes/${recipe.id}`}>View recipe</a>
                  </Button>
                </CardFooter>
              </Card>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}