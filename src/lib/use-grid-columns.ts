"use client";

import * as React from "react";

/** Tailwind breakpoints the recipe grid changes at, widest first: [min-width px, columns]. */
const BREAKPOINTS: [number, number][] = [
  [1536, 5],
  [1280, 4],
  [1024, 3],
  [640, 2],
];

/** Grid classes that produce exactly the column counts above. Keep the two in sync. */
export const RECIPE_GRID_CLASSES = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

function readColumns(): number {
  for (const [minWidth, columns] of BREAKPOINTS) {
    if (window.matchMedia(`(min-width: ${minWidth}px)`).matches) return columns;
  }
  return 1;
}

function subscribe(onChange: () => void): () => void {
  const queries = BREAKPOINTS.map(([minWidth]) => window.matchMedia(`(min-width: ${minWidth}px)`));
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

/** Number of columns the recipe grid currently shows. */
export function useGridColumns(): number {
  return React.useSyncExternalStore(subscribe, readColumns, () => 4);
}
