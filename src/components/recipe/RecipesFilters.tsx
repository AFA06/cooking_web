"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface GroupProps {
  label: string;
  options: readonly string[];
  selected: string;
  onChange: (value: string) => void;
}

function FilterGroup({ label, options, selected, onChange }: GroupProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-x-1 gap-y-1">
      <span className="mr-2 text-sm font-semibold text-amber-950">{label}:</span>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={selected === o}
          onClick={() => onChange(o)}
          className={cn(
            "min-h-10 px-3 text-sm transition-colors",
            selected === o ? "bg-amber-950 text-amber-50" : "text-amber-900 hover:bg-amber-100",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cuisines: readonly string[];
  selectedCuisine: string;
  onCuisineChange: (v: string) => void;
  difficulties: readonly string[];
  selectedDifficulty: string;
  onDifficultyChange: (v: string) => void;
  prices: readonly string[];
  selectedPrice: string;
  onPriceChange: (v: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function RecipesFilters(p: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="recipe-search" className="sr-only">Retsept qidirish</label>
        <input
          id="recipe-search"
          type="search"
          value={p.searchQuery}
          onChange={(e) => p.onSearchChange(e.target.value)}
          placeholder="Retsept, ijodkor yoki masalliq qidiring…"
          className="h-14 w-full border border-amber-300 bg-white px-4 text-lg text-amber-950 placeholder:text-amber-500 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/30"
        />
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-x-8">
        <FilterGroup label="Taom turi" options={p.cuisines} selected={p.selectedCuisine} onChange={p.onCuisineChange} />
        <FilterGroup label="Murakkablik" options={p.difficulties} selected={p.selectedDifficulty} onChange={p.onDifficultyChange} />
        <FilterGroup label="Narx" options={p.prices} selected={p.selectedPrice} onChange={p.onPriceChange} />
        {p.hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={p.onClearFilters}>Tozalash</Button>
        )}
      </div>
    </div>
  );
}
