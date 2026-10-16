"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, Check, Search, X } from "lucide-react";
import { FilterMenu } from "@/components/recipe/FilterMenu";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useT } from "@/i18n/client";
import { CATEGORY_LABEL, RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/categories";
import { ALL, DIFFICULTIES, EMPTY_FILTERS, PRICE_FILTERS, SORTS, TIME_FILTERS, filterRecipes, sortRecipes, type RecipeFilters, type SortKey } from "@/lib/filters";
import { RECIPE_GRID_CLASSES, useGridColumns } from "@/lib/use-grid-columns";
import { cn } from "@/lib/utils";
import type { RecipeListItem } from "@/types/recipe";

/** Rows shown at first and added by each "Yana retseptlar" press. */
const ROWS_PER_PAGE = 4;

/** Keeps the address bar in step with the filters, so a filtered list can be shared or reloaded. */
function toSearch(f: RecipeFilters): string {
  const params = new URLSearchParams();
  if (f.query.trim()) params.set("q", f.query.trim());
  if (f.categories.length > 0) params.set("category", f.categories.join(","));
  if (f.price !== ALL) params.set("price", f.price);
  const maxMinutes = TIME_FILTERS.find((t) => t.key === f.time)?.max;
  if (maxMinutes) params.set("time", String(maxMinutes));
  if (f.difficulty !== ALL) params.set("difficulty", f.difficulty);
  const search = params.toString();
  return search ? `?${search}` : "";
}

function CategoryChip({ label, count, checked, onClick, all }: { label: string; count: number; checked: boolean; onClick: () => void; all?: boolean }) {
  return (
    <button
      type="button"
      role={all ? undefined : "checkbox"}
      aria-checked={all ? undefined : checked}
      aria-pressed={all ? checked : undefined}
      onClick={onClick}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2.5 rounded-full border pl-3 pr-4 text-[0.95rem] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50",
        checked ? "border-amber-950 bg-amber-950 font-medium text-amber-50" : "border-amber-300 bg-amber-100 text-amber-950 hover:border-amber-950",
        all && "pl-4",
      )}
    >
      {!all && (
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border", checked ? "border-amber-50 bg-amber-50 text-amber-950" : "border-amber-500")} aria-hidden="true">
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
      )}
      {label}
      <span className={cn("text-xs tabular-nums", checked ? "text-amber-300" : "text-amber-500")}>{count}</span>
    </button>
  );
}

interface Props {
  recipes: RecipeListItem[];
  initialFilters: RecipeFilters;
  isLoggedIn: boolean;
  savedIds: string[];
}

export function RecipesBrowser({ recipes, initialFilters, isLoggedIn, savedIds }: Props) {
  const t = useT();
  const diffLabel = (v: string) => (v === ALL ? t("filter.all") : t(`difficulty.${v}`));
  const timeLabel = (k: string) => (k === ALL ? t("filter.all") : t(`filter.time.${k}`));
  const priceLabel = (v: string) => t(`filter.${v}`);
  const [filters, setFilters] = React.useState<RecipeFilters>(initialFilters);
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [pages, setPages] = React.useState(1);
  const columns = useGridColumns();
  const pageSize = ROWS_PER_PAGE * columns;
  const resultsTop = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname + toSearch(filters));
  }, [filters]);

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

  const selected = filters.categories;
  const toggleCategory = (key: RecipeCategory) =>
    set({ categories: RECIPE_CATEGORIES.map((c) => c.key).filter((k) => (k === key ? !selected.includes(k) : selected.includes(k))) });
  // Everything that passes the other filters, whatever its category: the counts on the chips and the "other categories" rows.
  const anyCategory = React.useMemo(() => sortRecipes(filterRecipes(recipes, { ...filters, categories: [] }), sort), [recipes, filters, sort]);
  const inCategory = (key: RecipeCategory) => anyCategory.filter((r) => r.category === key);
  const otherGroups = RECIPE_CATEGORIES.filter((c) => !selected.includes(c.key))
    .map((c) => ({ ...c, recipes: inCategory(c.key) }))
    .filter((g) => g.recipes.length > 0);
  const rowSize = Math.max(columns, 2);
  const showOnly = (key: RecipeCategory) => {
    set({ categories: [key] });
    resultsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chips = [
    filters.query.trim() && { label: `“${filters.query.trim()}”`, remove: () => set({ query: "" }) },
    filters.time !== ALL && { label: timeLabel(filters.time), remove: () => set({ time: ALL }) },
    filters.difficulty !== ALL && { label: diffLabel(filters.difficulty), remove: () => set({ difficulty: ALL }) },
  ].filter((chip): chip is { label: string; remove: () => void } => Boolean(chip));
  const hasFilters = chips.length > 0 || selected.length > 0 || filters.price !== ALL;

  // Three covers for the header collage; purely decorative.
  const covers = recipes.slice(0, 3);

  return (
    <>
      <section className="overflow-hidden border-b border-amber-200">
        <Container size="xl" className="grid items-end gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-14">
          <div className="pb-10 lg:pb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{t("recipes.eyebrow", { count: recipes.length })}</p>
            <h1 className="mt-4 max-w-3xl text-[2.6rem] font-medium leading-[1.04] text-amber-950 sm:text-6xl xl:text-7xl">
              {t("recipes.heroLead")} <em className="font-normal italic text-amber-700">{t("recipes.heroEm")}</em>
            </h1>
            <div className="relative mt-8 max-w-2xl">
              <label htmlFor="recipe-search" className="sr-only">{t("search.label")}</label>
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" strokeWidth={1.75} aria-hidden="true" />
              <input
                id="recipe-search"
                type="search"
                value={filters.query}
                onChange={(e) => set({ query: e.target.value })}
                placeholder={t("search.placeholder")}
                className="h-16 w-full rounded-2xl border border-amber-300 bg-amber-100 pl-14 pr-5 text-lg text-amber-950 shadow-[0_1px_2px_rgb(44_40_37/0.04)] placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
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

      <div ref={resultsTop} className="scroll-mt-16" />
      <div className="sticky top-16 z-40 border-b border-amber-200 bg-amber-50/85 backdrop-blur-md">
        <Container size="xl" className="flex flex-col gap-3 py-3">
          <div role="group" aria-label={t("recipes.categories")} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            <CategoryChip all label={t("recipes.allCategories")} count={anyCategory.length} checked={selected.length === 0} onClick={() => set({ categories: [] })} />
            {RECIPE_CATEGORIES.map((c) => (
              <CategoryChip key={c.key} label={t(c.label)} count={inCategory(c.key).length} checked={selected.includes(c.key)} onClick={() => toggleCategory(c.key)} />
            ))}
          </div>

          <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 lg:mx-0 lg:justify-between lg:overflow-visible lg:px-0">
            <div role="tablist" aria-label={t("recipes.price")} className="flex shrink-0 rounded-full border border-amber-300 p-1">
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
                      "flex h-9 items-center gap-2 rounded-full px-4 text-[0.95rem] transition-colors",
                      active ? "bg-amber-950 font-semibold text-amber-50" : "text-amber-600 hover:text-amber-950",
                    )}
                  >
                    {priceLabel(price)}
                    <span className={cn("text-xs tabular-nums", active ? "text-amber-300" : "text-amber-500")}>{countFor(price)}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <FilterMenu label={t("recipes.filterTime")} options={TIME_FILTERS.map((x) => ({ value: x.key, label: timeLabel(x.key) }))} value={filters.time} defaultValue={ALL} onChange={(time) => set({ time })} />
              <FilterMenu label={t("recipes.filterDifficulty")} options={DIFFICULTIES.map((d) => ({ value: d, label: diffLabel(d) }))} value={filters.difficulty} defaultValue={ALL} onChange={(difficulty) => set({ difficulty })} />
              <span className="mx-1 hidden h-6 w-px bg-amber-300 lg:block" aria-hidden="true" />
              <FilterMenu
                label={t("recipes.sort")}
                align="end"
                options={SORTS.map((s) => ({ value: s.key, label: t(s.label) }))}
                value={sort}
                defaultValue="newest"
                onChange={(value) => {
                  setSort(value as SortKey);
                  setPages(1);
                }}
              />
            </div>
          </div>
        </Container>
      </div>

      <Container size="xl" className="pb-20 pt-7">
        <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-sm text-amber-600" aria-live="polite">
            <span className="font-semibold text-amber-950 tabular-nums">{results.length}</span> {t("recipes.countNoun", { count: results.length })}
            {filters.price === "premium" && ` · ${t("recipes.premiumNote")}`}
            {filters.price === "free" && ` · ${t("recipes.freeNote")}`}
          </p>
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.remove}
              aria-label={t("recipes.removeFilter", { label: chip.label })}
              className="flex h-9 items-center gap-1.5 rounded-full bg-sage-100 pl-3.5 pr-2.5 text-sm text-sage-900 transition-colors hover:bg-sage-200"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          {hasFilters && (
            <button type="button" onClick={clear} className="h-9 px-1 text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
              {t("recipes.clear")}
            </button>
          )}
        </div>

        {selected.length > 0 && (
          <h2 className="mt-5 text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">{selected.map((key) => t(CATEGORY_LABEL[key])).join(" · ")}</h2>
        )}

        {recipes.length === 0 ? (
          <p className="py-24 text-center text-amber-900">{t("recipes.none")}</p>
        ) : results.length === 0 && otherGroups.length > 0 ? (
          <p className="mt-4 max-w-xl text-lg text-amber-900">
            {t("recipes.noMatchOthers")}
          </p>
        ) : results.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-4xl font-medium text-amber-950">{t("recipes.nothingFound")}</h2>
            <p className="mt-3 text-lg text-amber-900">{t("recipes.nothingFoundText")}</p>
            <Button className="mt-8" size="lg" variant="outline" onClick={clear}>{t("recipes.clearFilters")}</Button>
          </div>
        ) : (
          <>
            <div className={cn(RECIPE_GRID_CLASSES, "mt-6 gap-x-6 gap-y-14 xl:gap-x-8")}>
              {visible.map((recipe, i) => (
                <div key={recipe.id} className="rise" style={{ animationDelay: `${(i % pageSize) * 40}ms` }}>
                  <RecipeCard
                    recipe={recipe}
                    isLoggedIn={isLoggedIn}
                    saved={saved.has(recipe.id)}
                    priority={i < columns}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
                  <p className="text-sm text-amber-600 tabular-nums">{t("recipes.progress", { shown: visible.length, total: results.length })}</p>
                  <Button size="xl" variant="outline" onClick={() => setPages((p) => p + 1)}>{t("recipes.more")}</Button>
                </>
              ) : (
                results.length > pageSize && <p className="text-sm text-amber-600">{t("recipes.allShown", { count: results.length })}</p>
              )}
            </div>
          </>
        )}

        {selected.length > 0 && remaining === 0 && otherGroups.length > 0 && (
          <section aria-labelledby="other-categories-heading" className="mt-20 border-t border-amber-200 pt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{t("recipes.otherCategories")}</p>
            <h2 id="other-categories-heading" className="mt-3 text-[1.9rem] font-medium leading-tight text-amber-950 sm:text-[2.4rem]">{t("recipes.whatElse")}</h2>
            {otherGroups.map((group) => (
              <div key={group.key} className="mt-12">
                <div className="flex items-end justify-between gap-6">
                  <h3 className="text-2xl font-medium text-amber-950">
                    {t(group.label)} <span className="ml-1 text-base font-normal text-amber-600 tabular-nums">{group.recipes.length}</span>
                  </h3>
                  <button type="button" onClick={() => showOnly(group.key)} className="group flex h-11 shrink-0 items-center gap-1.5 text-[0.95rem] font-medium text-amber-950 hover:text-amber-700">
                    {t("recipes.onlyThis")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>
                <div className={cn(RECIPE_GRID_CLASSES, "mt-6 gap-x-6 gap-y-14 xl:gap-x-8")}>
                  {group.recipes.slice(0, rowSize).map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isLoggedIn={isLoggedIn}
                      saved={saved.has(recipe.id)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </Container>
    </>
  );
}
