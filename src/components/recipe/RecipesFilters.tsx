"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { CUISINES, DIFFICULTIES, PRICE_FILTERS } from "@/data/recipes";

interface FilterGroupProps {
  label: string;
  options: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

function FilterGroup({ label, options, selected, onChange, className }: FilterGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-amber-950">{label}</label>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => (
          <Button
            key={option}
            variant={selected === option ? "primary" : "outline"}
            size="sm"
            onClick={() => onChange(option)}
            className="whitespace-nowrap"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface RecipesFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCuisine: string;
  onCuisineChange: (cuisine: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  selectedPrice: string;
  onPriceChange: (price: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function RecipesFilters({
  searchQuery,
  onSearchChange,
  selectedCuisine,
  onCuisineChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedPrice,
  onPriceChange,
  onClearFilters,
  hasActiveFilters,
}: RecipesFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div className="bg-white border-b border-amber-100 sticky top-16 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 py-4">
          <div className="flex-1 max-w-md">
            <label htmlFor="recipe-search" className="sr-only">Search recipes</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="recipe-search"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search recipes, creators, ingredients..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-950 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex lg:hidden gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(!isMobileOpen)} className="whitespace-nowrap">
              Filters {isMobileOpen ? "↑" : "↓"}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="whitespace-nowrap text-amber-700">
                Clear
              </Button>
            )}
          </div>

          <div className={`${isMobileOpen ? "block" : "hidden"} lg:block lg:flex lg:flex-row lg:items-center lg:flex-1 lg:gap-6 w-full`}>
            <FilterGroup
              label="Cuisine"
              options={CUISINES}
              selected={selectedCuisine}
              onChange={onCuisineChange}
            />
            <Separator orientation="vertical" className="hidden lg:block h-8" />
            <FilterGroup
              label="Difficulty"
              options={DIFFICULTIES}
              selected={selectedDifficulty}
              onChange={onDifficultyChange}
            />
            <Separator orientation="vertical" className="hidden lg:block h-8" />
            <FilterGroup
              label="Price"
              options={PRICE_FILTERS}
              selected={selectedPrice}
              onChange={onPriceChange}
            />
            {hasActiveFilters && (
              <>
                <Separator orientation="vertical" className="hidden lg:block h-8" />
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-amber-700 hover:text-amber-900 h-fit">
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}