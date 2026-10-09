"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterGroupConfig {
  label: string;
  options: readonly string[];
  selected: string;
  onChange: (value: string) => void;
}

function FilterGroup({ label, options, selected, onChange }: FilterGroupConfig) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-sm text-amber-600">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={selected === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-10 rounded-full border px-4 text-sm transition-colors",
            selected === option ? "border-amber-950 bg-amber-950 text-amber-50" : "border-amber-200 text-amber-900 hover:border-amber-950",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  groups: FilterGroupConfig[];
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function RecipesFilters({ query, onQueryChange, groups, onClear, hasActiveFilters }: Props) {
  return (
    <div className="space-y-5">
      <div className="relative max-w-2xl">
        <label htmlFor="recipe-search" className="sr-only">Retsept qidirish</label>
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" strokeWidth={1.75} aria-hidden="true" />
        <input
          id="recipe-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Osh, lag‘mon yoki masalliq nomi…"
          className="h-[3.75rem] w-full rounded-2xl border border-amber-300 bg-white pl-14 pr-5 text-lg text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:gap-x-8">
        {groups.map((group) => (
          <FilterGroup key={group.label} {...group} />
        ))}
        {hasActiveFilters && (
          <button type="button" onClick={onClear} className="h-10 self-start text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
            Filtrlarni tozalash
          </button>
        )}
      </div>
    </div>
  );
}
