"use client";

import * as React from "react";
import Link from "next/link";
import { RecipesFilters } from "@/components/recipe/RecipesFilters";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ALL, CUISINES, DIFFICULTIES, DIFFICULTY_BY_LABEL, PRICE_FILTERS } from "@/lib/filters";
import type { Recipe } from "@/types/recipe";

export function RecipesBrowser({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = React.useState("");
  const [cuisine, setCuisine] = React.useState<string>(ALL);
  const [difficulty, setDifficulty] = React.useState<string>(ALL);
  const [price, setPrice] = React.useState<string>(ALL);

  const hasActiveFilters = query !== "" || cuisine !== ALL || difficulty !== ALL || price !== ALL;
  const clear = () => {
    setQuery("");
    setCuisine(ALL);
    setDifficulty(ALL);
    setPrice(ALL);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (q && !(
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.creator.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      )) return false;
      if (cuisine !== ALL && !r.tags.includes(cuisine)) return false;
      if (difficulty !== ALL && r.difficulty !== DIFFICULTY_BY_LABEL[difficulty]) return false;
      if (price === "Bepul" && r.isPremium) return false;
      if (price === "Premium" && !r.isPremium) return false;
      return true;
    });
  }, [recipes, query, cuisine, difficulty, price]);

  return (
    <>
      <section className="border-b border-amber-200 py-10 sm:py-14">
        <Container size="xl">
          <h1 className="text-4xl font-medium text-amber-950 sm:text-6xl">Retseptlar</h1>
          <p className="mt-3 max-w-2xl text-lg text-amber-900">Kundalik taomlardan bayram dasturxonigacha — ishonchli ijodkorlardan.</p>
          <div className="mt-8">
            <RecipesFilters
              searchQuery={query} onSearchChange={setQuery}
              cuisines={CUISINES} selectedCuisine={cuisine} onCuisineChange={setCuisine}
              difficulties={DIFFICULTIES} selectedDifficulty={difficulty} onDifficultyChange={setDifficulty}
              prices={PRICE_FILTERS} selectedPrice={price} onPriceChange={setPrice}
              onClearFilters={clear} hasActiveFilters={hasActiveFilters}
            />
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container size="xl">
          <p className="mb-8 text-sm text-amber-600" aria-live="polite">
            {recipes.length} ta retseptdan {filtered.length} tasi ko‘rsatilmoqda
          </p>
          {recipes.length === 0 ? (
            <p className="py-16 text-center text-amber-900">Hozircha retseptlar yo‘q. Tez orada qo‘shiladi.</p>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <h2 className="text-2xl font-medium text-amber-950">Hech narsa topilmadi</h2>
              <p className="mt-2 text-amber-900">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring.</p>
              <Button className="mt-6" variant="outline" onClick={clear}>Filtrlarni tozalash</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-amber-200 bg-amber-100/60 py-14">
        <Container size="xl" className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <h2 className="max-w-xl text-2xl font-medium text-amber-950 sm:text-3xl">O‘z retseptlaringiz bormi? Ularni Damda’da nashr eting.</h2>
          <Button size="lg" asChild><Link href="/creators/join">Ijodkor bo‘lish</Link></Button>
        </Container>
      </section>
    </>
  );
}
