"use client";

import * as React from "react";

/** Tailwind breakpoints the recipe grid changes at, widest first: [min-width px, columns]. */
const BREAKPOINTS: [number, number][] = [
  [1280, 4],
  [1024, 3],
  [640, 2],
];

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

/** Number of columns the recipe grid currently shows; must match the grid's CSS classes. */
export function useGridColumns(): number {
  return React.useSyncExternalStore(subscribe, readColumns, () => 4);
}
