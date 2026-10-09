"use client";

import * as React from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { FilterMenu } from "@/components/recipe/FilterMenu";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ALL, DIFFICULTIES, EMPTY_FILTERS, PRICE_FILTERS, SORTS, TIME_FILTERS, filterRecipes, sortRecipes, type RecipeFilters, type SortKey } from "@/lib/filters";
import { RECIPE_GRID_CLASSES, useGridColumns } from "@/lib/use-grid-columns";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

/** Rows shown at first and added by each "Yana retseptlar" press. */
const ROWS_PER_PAGE = 4;

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

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
  const pageSize = ROWS_PER_PAGE * columns;

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
  const visible = results.slice(0, pages * pageSize);
  const remaining = results.length - visible.length;
  const countFor = (price: string) => filterRecipes(recipes, { ...filters, price }).length;

  const chips = [
    filters.query.trim() && { label: `“${filters.query.trim()}”`, remove: () => set({ query: "" }) },
    filters.time !== ALL && { label: filters.time, remove: () => set({ time: ALL }) },
    filters.difficulty !== ALL && { label: filters.difficulty, remove: () => set({ difficulty: ALL }) },
  ].filter((chip): chip is { label: string; remove: () => void } => Boolean(chip));

  // Three covers for the header collage; purely decorative.
  const covers = recipes.slice(0, 3);

  return (
    <>
      <section className="overflow-hidden border-b border-amber-200">
        <Container size="xl" className="grid items-end gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-14">
          <div className="pb-10 lg:pb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Retseptlar · {recipes.length} ta</p>
            <h1 className="mt-4 max-w-3xl text-[2.6rem] font-medium leading-[1.04] text-amber-950 sm:text-6xl xl:text-7xl">
              Ko‘ngil tusagan taomni <em className="font-normal italic text-amber-700">toping.</em>
            </h1>
            <div className="relative mt-8 max-w-2xl">
              <label htmlFor="recipe-search" className="sr-only">Retsept qidirish</label>
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" strokeWidth={1.75} aria-hidden="true" />
              <input
                id="recipe-search"
                type="search"
                value={filters.query}
                onChange={(e) => set({ query: e.target.value })}
                placeholder="Osh, lag‘mon yoki masalliq nomi…"
                className="h-16 w-full rounded-2xl border border-amber-300 bg-white pl-14 pr-5 text-lg text-amber-950 shadow-[0_1px_2px_rgb(44_40_37/0.04)] placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
              />
            </div>
          </div>

          {covers.length === 3 && (
            <div className="hidden h-[22rem] items-end gap-4 lg:flex xl:gap-5" aria-hidden="true">
              {covers.map((recipe, i) => (
                <div
                  key={recipe.id}
                  className={cn("relative w-44 overflow-hidden rounded-t-[1.5rem] bg-amber-100 xl:w-56", ["h-[70%]", "h-full", "h-[82%]"][i])}
                >
                  <Image src={recipe.coverMedia.url} alt="" fill priority sizes="224px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      <div className="sticky top-16 z-40 border-b border-amber-200 bg-amber-50/85 backdrop-blur-md">
        <Container size="xl" className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Retsept turi" className="flex w-fit rounded-full bg-amber-100 p-1">
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
                    "flex h-10 items-center gap-2 rounded-full px-4 text-[0.95rem] transition-colors",
                    active ? "bg-white font-semibold text-amber-950 shadow-sm" : "text-amber-600 hover:text-amber-950",
                  )}
                >
                  {price}
                  <span className={cn("text-xs tabular-nums", active ? "text-amber-600" : "text-amber-500")}>{countFor(price)}</span>
                </button>
              );
            })}
          </div>

          <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 lg:mx-0 lg:overflow-visible lg:px-0">
            <FilterMenu label="Vaqt" options={toOptions(TIME_FILTERS.map((t) => t.label))} value={filters.time} defaultValue={ALL} onChange={(time) => set({ time })} />
            <FilterMenu label="Murakkablik" options={toOptions(DIFFICULTIES)} value={filters.difficulty} defaultValue={ALL} onChange={(difficulty) => set({ difficulty })} />
            <span className="mx-1 hidden h-6 w-px bg-amber-300 lg:block" aria-hidden="true" />
            <FilterMenu
              label="Saralash"
              align="end"
              options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
              value={sort}
              defaultValue="newest"
              onChange={(value) => {
                setSort(value as SortKey);
                setPages(1);
              }}
            />
          </div>
        </Container>
      </div>

      <Container size="xl" className="pb-20 pt-7">
        <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-sm text-amber-600" aria-live="polite">
            <span className="font-semibold text-amber-950 tabular-nums">{results.length}</span> ta retsept
            {filters.price === "Premium" && " · masalliqlar va dastlabki qadamlar bepul ko‘rinadi"}
            {filters.price === "Bepul" && " · to‘liq ochiq, qadam-baqadam rejim bilan"}
          </p>
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.remove}
              aria-label={`${chip.label} filtrini olib tashlash`}
              className="flex h-9 items-center gap-1.5 rounded-full bg-sage-100 pl-3.5 pr-2.5 text-sm text-sage-900 transition-colors hover:bg-sage-200"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          {chips.length > 0 && (
            <button type="button" onClick={clear} className="h-9 px-1 text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
              Tozalash
            </button>
          )}
        </div>

        {recipes.length === 0 ? (
          <p className="py-24 text-center text-amber-900">Hozircha retseptlar yo‘q. Tez orada qo‘shiladi.</p>
        ) : results.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-4xl font-medium text-amber-950">Hech narsa topilmadi</h2>
            <p className="mt-3 text-lg text-amber-900">Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring.</p>
            <Button className="mt-8" size="lg" variant="outline" onClick={clear}>Filtrlarni tozalash</Button>
          </div>
        ) : (
          <>
            <div className={cn(RECIPE_GRID_CLASSES, "mt-6 gap-x-6 gap-y-12 xl:gap-x-8")}>
              {visible.map((recipe, i) => (
                <div key={recipe.id} className="rise" style={{ animationDelay: `${(i % pageSize) * 40}ms` }}>
                  <RecipeCard
                    recipe={recipe}
                    isLoggedIn={isLoggedIn}
                    saved={saved.has(recipe.id)}
                    priority={i < columns}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
                  />
                </div>
              ))}
            </div>

            <div className="mt-16 flex flex-col items-center gap-4">
              {remaining > 0 ? (
                <>
                  <div className="h-px w-40 bg-amber-200" aria-hidden="true">
                    <div className="h-px bg-amber-950 transition-[width] duration-500" style={{ width: `${(visible.length / results.length) * 100}%` }} />
                  </div>
                  <p className="text-sm text-amber-600 tabular-nums">{visible.length} / {results.length} retsept</p>
                  <Button size="xl" variant="outline" onClick={() => setPages((p) => p + 1)}>Yana retseptlar</Button>
                </>
              ) : (
                results.length > pageSize && <p className="text-sm text-amber-600">Barcha {results.length} ta retsept ko‘rsatildi.</p>
              )}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
