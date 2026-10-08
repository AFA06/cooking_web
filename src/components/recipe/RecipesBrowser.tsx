"use client";

import * as React from "react";
import Link from "next/link";
import { RecipesFilters } from "@/components/recipe/RecipesFilters";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Container } from "@/components/ui/Container";
import { Separator } from "@/components/ui/Separator";
import { CUISINES, DIFFICULTIES, PRICE_FILTERS } from "@/lib/filters";
import type { Recipe } from "@/types/recipe";

function filterRecipes(
  recipes: Recipe[],
  query: string,
  cuisine: string,
  difficulty: string,
  price: string
): Recipe[] {
  let filtered = recipes;

  const q = query.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.creator.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
    );
  }

  if (cuisine !== "All") {
    filtered = filtered.filter((r) => r.tags.includes(cuisine));
  }

  if (difficulty !== "All") {
    filtered = filtered.filter((r) => r.difficulty === difficulty.toLowerCase());
  }

  if (price === "Free") {
    filtered = filtered.filter((r) => !r.isPremium);
  } else if (price === "Premium") {
    filtered = filtered.filter((r) => r.isPremium);
  }

  return filtered;
}

export function RecipesBrowser({ recipes: RECIPES }: { recipes: Recipe[] }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCuisine, setSelectedCuisine] = React.useState<string>(CUISINES[0]);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>(DIFFICULTIES[0]);
  const [selectedPrice, setSelectedPrice] = React.useState<string>(PRICE_FILTERS[0]);

  const filteredRecipes = filterRecipes(RECIPES, searchQuery, selectedCuisine, selectedDifficulty, selectedPrice);
  const hasActiveFilters = searchQuery !== "" || selectedCuisine !== "All" || selectedDifficulty !== "All" || selectedPrice !== "All";

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCuisine(CUISINES[0]);
    setSelectedDifficulty(DIFFICULTIES[0]);
    setSelectedPrice(PRICE_FILTERS[0]);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <section className="bg-white border-b border-amber-100 py-12 sm:py-16">
        <Container size="lg">
          <header className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-amber-950">
              Discover Recipes
            </h1>
            <p className="mt-4 text-amber-700 text-lg">
              From everyday meals to celebration dishes. Find recipes from creators you trust.
            </p>
          </header>

          <RecipesFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCuisine={selectedCuisine}
            onCuisineChange={setSelectedCuisine}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            selectedPrice={selectedPrice}
            onPriceChange={setSelectedPrice}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </Container>
      </section>

      <section className="py-8 sm:py-12 lg:py-16">
        <Container size="lg">
          <div className="flex items-center justify-between mb-8">
            <p className="text-amber-700">
              Showing <span className="font-semibold text-amber-950">{filteredRecipes.length}</span> of{" "}
              <span className="font-semibold text-amber-950">{RECIPES.length}</span> recipes
            </p>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-amber-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-amber-950 mb-2">No recipes found</h2>
              <p className="text-amber-600 mb-6">Try adjusting your filters or search terms.</p>
              <button onClick={handleClearFilters} className="text-amber-700 hover:text-amber-900 font-medium underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <Separator className="my-12 border-amber-200" />

      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <Container size="lg">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="mt-4 text-amber-700">
              Request a recipe from our creators or become a creator yourself.
            </p>
          </header>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/creators/join" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-amber-700 text-amber-700 font-medium hover:bg-amber-50 transition-colors">
              Become a Creator
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}