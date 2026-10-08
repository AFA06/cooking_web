import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getFeaturedRecipes } from "@/data/recipes";
import { PLATFORM_CONFIG } from "@/lib/constants";

export function FeaturedRecipes() {
  const recipes = getFeaturedRecipes(6);

  return (
    <section className="py-20 lg:py-28 bg-amber-50" aria-labelledby="featured-heading">
      <Container size="lg">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <h2 id="featured-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
              Featured recipes
            </h2>
            <p className="mt-2 text-amber-700">Sample recipes showing how a creator recipe looks on Damda</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={PLATFORM_CONFIG.urls.recipes}>View all recipes →</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </Container>
    </section>
  );
}
