"use client";

import * as React from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipesFilters } from "@/components/recipe/RecipesFilters";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DIFFICULTIES, EMPTY_FILTERS, PRICE_FILTERS, TIME_FILTERS, filterRecipes, type RecipeFilters } from "@/lib/filters";
import type { Recipe } from "@/types/recipe";

interface Props {
  recipes: Recipe[];
  initialFilters: RecipeFilters;
  isLoggedIn: boolean;
  savedIds: string[];
}

export function RecipesBrowser({ recipes, initialFilters, isLoggedIn, savedIds }: Props) {
  const [filters, setFilters] = React.useState<RecipeFilters>(initialFilters);
  const set = (patch: Partial<RecipeFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const clear = () => setFilters(EMPTY_FILTERS);

  const saved = React.useMemo(() => new Set(savedIds), [savedIds]);
  const filtered = React.useMemo(() => filterRecipes(recipes, filters), [recipes, filters]);
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <Container size="xl" className="py-10 sm:py-14">
      <h1 className="text-[2.75rem] font-medium leading-[1.05] text-amber-950 sm:text-6xl">Retseptlar</h1>
      <p className="mt-3 max-w-2xl text-lg text-amber-900">Kundalik taomlardan bayram dasturxonigacha — ishonchli ijodkorlardan.</p>

      <div className="mt-8 border-b border-amber-200 pb-8">
        <RecipesFilters
          query={filters.query}
          onQueryChange={(query) => set({ query })}
          onClear={clear}
          hasActiveFilters={hasActiveFilters}
          groups={[
            { label: "Vaqt", options: TIME_FILTERS.map((t) => t.label), selected: filters.time, onChange: (time) => set({ time }) },
            { label: "Murakkablik", options: DIFFICULTIES, selected: filters.difficulty, onChange: (difficulty) => set({ difficulty }) },
            { label: "Narx", options: PRICE_FILTERS, selected: filters.price, onChange: (price) => set({ price }) },
          ]}
        />
      </div>

      <p className="mt-8 text-sm text-amber-600" aria-live="polite">
        {hasActiveFilters ? `${filtered.length} ta retsept topildi` : `${recipes.length} ta retsept`}
      </p>

      {recipes.length === 0 ? (
        <p className="py-20 text-center text-amber-900">Hozircha retseptlar yo‘q. Tez orada qo‘shiladi.</p>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="text-3xl font-medium text-amber-950">Hech narsa topilmadi</h2>
          <p className="mt-2 text-amber-900">Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring.</p>
          <Button className="mt-6" variant="outline" onClick={clear}>Filtrlarni tozalash</Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((recipe, i) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isLoggedIn={isLoggedIn}
              saved={saved.has(recipe.id)}
              priority={i < 4}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ))}
        </div>
      )}
    </Container>
  );
}
