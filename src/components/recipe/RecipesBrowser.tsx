"use client";

import * as React from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipesFilters } from "@/components/recipe/RecipesFilters";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DIFFICULTIES, EMPTY_FILTERS, PRICE_FILTERS, SORTS, TIME_FILTERS, filterRecipes, sortRecipes, type RecipeFilters, type SortKey } from "@/lib/filters";
import { useGridColumns } from "@/lib/use-grid-columns";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

/** Rows shown at first and added by each "Yana retseptlar" press. */
const ROWS_PER_PAGE = 4;

interface Props {
  recipes: Recipe[];
  initialFilters: RecipeFilters;
  isLoggedIn: boolean;
  savedIds: string[];
}

export function RecipesBrowser({ recipes, initialFilters, isLoggedIn, savedIds }: Props) {
  const [filters, setFilters] = React.useState<RecipeFilters>(initialFilters);
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [pages, setPages] = React.useState(1);
  const columns = useGridColumns();

  // Any change to what is listed starts again from the first rows.
  const set = (patch: Partial<RecipeFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPages(1);
  };
  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setPages(1);
  };

  const saved = React.useMemo(() => new Set(savedIds), [savedIds]);
  const results = React.useMemo(() => sortRecipes(filterRecipes(recipes, filters), sort), [recipes, filters, sort]);
  const visible = results.slice(0, pages * ROWS_PER_PAGE * columns);
  const remaining = results.length - visible.length;
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const countFor = (price: string) => filterRecipes(recipes, { ...filters, price }).length;

  return (
    <Container size="xl" className="py-10 sm:py-14">
      <h1 className="text-[2.75rem] font-medium leading-[1.05] text-amber-950 sm:text-6xl">Retseptlar</h1>
      <p className="mt-3 max-w-2xl text-lg text-amber-900">Kundalik taomlardan bayram dasturxonigacha — ishonchli ijodkorlardan.</p>

      <div role="tablist" aria-label="Retsept turi" className="mt-8 flex gap-6 border-b border-amber-200 sm:gap-8">
        {PRICE_FILTERS.map((price) => {
          const active = filters.price === price;
          return (
            <button
              key={price}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => set({ price })}
              className={cn(
                "-mb-px flex items-baseline gap-2 border-b-2 pb-3 text-lg transition-colors",
                active ? "border-amber-950 font-semibold text-amber-950" : "border-transparent text-amber-600 hover:text-amber-950",
              )}
            >
              {price}
              <span className="text-sm font-normal text-amber-500 tabular-nums">{countFor(price)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-amber-600">
        {filters.price === "Premium"
          ? "Premium: ijodkorning to‘liq qo‘llanmasi — har qadam uchun video, taymer va oshpaz sirlari. Narxini ijodkor belgilaydi."
          : filters.price === "Bepul"
            ? "Bepul: masalliqlar, barcha qadamlar va “Men bilan pishiring” rejimi to‘liq ochiq."
            : "Bepul retseptlar to‘liq ochiq. Premium retseptlarda masalliqlar va dastlabki qadamlar bepul ko‘rinadi."}
      </p>

      <div className="mt-6">
        <RecipesFilters
          query={filters.query}
          onQueryChange={(query) => set({ query })}
          onClear={clear}
          hasActiveFilters={hasActiveFilters}
          groups={[
            { label: "Vaqt", options: TIME_FILTERS.map((t) => t.label), selected: filters.time, onChange: (time) => set({ time }) },
            { label: "Murakkablik", options: DIFFICULTIES, selected: filters.difficulty, onChange: (difficulty) => set({ difficulty }) },
          ]}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-5">
        <p className="text-sm text-amber-600" aria-live="polite">{results.length} ta retsept</p>
        <label className="flex items-center gap-2 text-sm text-amber-600">
          Saralash
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPages(1);
            }}
            className="h-10 rounded-xl border border-amber-200 bg-white px-3 text-sm text-amber-950 focus:border-amber-950 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {recipes.length === 0 ? (
        <p className="py-20 text-center text-amber-900">Hozircha retseptlar yo‘q. Tez orada qo‘shiladi.</p>
      ) : results.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="text-3xl font-medium text-amber-950">Hech narsa topilmadi</h2>
          <p className="mt-2 text-amber-900">Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring.</p>
          <Button className="mt-6" variant="outline" onClick={clear}>Filtrlarni tozalash</Button>
        </div>
      ) : (
        <>
          {/* Column counts here must match useGridColumns. */}
          <div className="mt-6 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((recipe, i) => (
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
          <div className="mt-14 flex flex-col items-center gap-3">
            {remaining > 0 ? (
              <>
                <Button size="lg" variant="outline" onClick={() => setPages((p) => p + 1)}>Yana retseptlar</Button>
                <p className="text-sm text-amber-600">{visible.length} / {results.length} ko‘rsatildi</p>
              </>
            ) : (
              results.length > ROWS_PER_PAGE * columns && <p className="text-sm text-amber-600">Barcha {results.length} ta retsept ko‘rsatildi.</p>
            )}
          </div>
        </>
      )}
    </Container>
  );
}
