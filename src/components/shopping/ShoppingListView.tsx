"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { clearShoppingList, removeFromShoppingList, setShoppingChecked } from "@/app/shopping/actions";
import { Button } from "@/components/ui/Button";
import { mergeShoppingRows, type ShoppingLine, type ShoppingRow } from "@/lib/shopping";
import { cn } from "@/lib/utils";
import type { ShoppingRecipe } from "@/server/shopping";

type Change = { type: "check"; ids: string[]; checked: boolean } | { type: "removeRecipe"; recipeId: string } | { type: "clear"; scope: "bought" | "all" };

/** What the list looks like once a change lands, shown at once while the server catches up. */
function applyChange(rows: ShoppingRow[], change: Change): ShoppingRow[] {
  switch (change.type) {
    case "check":
      return rows.map((row) => (change.ids.includes(row.id) ? { ...row, checked: change.checked } : row));
    case "removeRecipe":
      return rows.filter((row) => row.recipeId !== change.recipeId);
    case "clear":
      return change.scope === "all" ? [] : rows.filter((row) => !row.checked);
  }
}

function Line({ line, note, onToggle }: { line: ShoppingLine; note: string | null; onToggle: () => void }) {
  return (
    <li className="border-t border-amber-200 first:border-t-0">
      <label className="flex min-h-16 cursor-pointer items-center gap-4 py-3">
        <input type="checkbox" checked={line.checked} onChange={onToggle} className="peer sr-only" />
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-amber-700 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-amber-50",
            line.checked ? "border-sage-600 bg-sage-600 text-amber-50" : "border-amber-400",
          )}
          aria-hidden="true"
        >
          {line.checked && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-lg transition-colors", line.checked ? "text-amber-500 line-through" : "text-amber-950")}>{line.name}</span>
          {note && <span className="block truncate text-sm text-amber-600">{note}</span>}
        </span>
        <span className={cn("whitespace-nowrap text-lg font-semibold tabular-nums transition-colors", line.checked ? "text-amber-500" : "text-amber-950")}>
          {line.quantity} <span className="text-base font-normal text-amber-600">{line.unit}</span>
        </span>
      </label>
    </li>
  );
}

export function ShoppingListView({ recipes, rows }: { recipes: ShoppingRecipe[]; rows: ShoppingRow[] }) {
  const [current, apply] = React.useOptimistic(rows, applyChange);
  const [, startTransition] = React.useTransition();
  const [confirmingClear, setConfirmingClear] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = (change: Change, action: () => Promise<{ ok: true } | { error: string }>) =>
    startTransition(async () => {
      apply(change);
      const result = await action();
      setError("error" in result ? result.error : null);
    });

  const lines = mergeShoppingRows(current);
  const toBuy = lines.filter((line) => !line.checked);
  const bought = lines.filter((line) => line.checked);
  const shownRecipes = recipes.filter((recipe) => current.some((row) => row.recipeId === recipe.id));
  const titles = new Map(recipes.map((recipe) => [recipe.id, recipe.title]));
  // Saying which dish a product is for only helps when there is more than one dish.
  const noteFor = (line: ShoppingLine) => (shownRecipes.length > 1 ? line.recipeIds.map((id) => titles.get(id)).join(" · ") : null);
  const toggle = (line: ShoppingLine) => run({ type: "check", ids: line.ids, checked: !line.checked }, () => setShoppingChecked(line.ids, !line.checked));

  if (lines.length === 0) return <p className="mt-10 text-lg text-amber-900" role="status">Ro‘yxat tozalandi.</p>;

  return (
    <>
      <p className="mt-4 text-lg text-amber-900" aria-live="polite">
        {toBuy.length > 0 ? (
          <>
            <span className="font-semibold text-amber-950 tabular-nums">{toBuy.length}</span> ta mahsulot olish kerak
            {bought.length > 0 && <> · <span className="tabular-nums">{bought.length}</span> tasi olindi</>}
          </>
        ) : (
          "Hammasi olindi. Yoqimli pishiriq!"
        )}
      </p>

      <ul className="mt-8 flex flex-wrap gap-3" aria-label="Ro‘yxatdagi retseptlar">
        {shownRecipes.map((recipe) => (
          <li key={recipe.id} className="flex items-center gap-3 rounded-2xl bg-amber-100 p-2 pr-1">
            <Link href={`/recipes/${recipe.slug}`} className="group flex min-w-0 items-center gap-3">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-amber-200">
                <Image src={recipe.coverUrl} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block max-w-[14rem] truncate font-medium text-amber-950 group-hover:text-amber-700">{recipe.title}</span>
                <span className="block text-sm text-amber-600">{recipe.servings} kishilik</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => run({ type: "removeRecipe", recipeId: recipe.id }, () => removeFromShoppingList(recipe.id))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-amber-600 transition-colors hover:bg-amber-200 hover:text-amber-950"
              aria-label={`${recipe.title} masalliqlarini ro‘yxatdan olib tashlash`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {toBuy.length > 0 && (
        <section aria-labelledby="to-buy-heading" className="mt-10">
          <h2 id="to-buy-heading" className="text-sm font-medium uppercase tracking-wider text-amber-600">Olish kerak</h2>
          <ul className="mt-2 border-y border-amber-200">
            {toBuy.map((line) => (
              <Line key={line.key} line={line} note={noteFor(line)} onToggle={() => toggle(line)} />
            ))}
          </ul>
        </section>
      )}

      {bought.length > 0 && (
        <section aria-labelledby="bought-heading" className="mt-10">
          <h2 id="bought-heading" className="text-sm font-medium uppercase tracking-wider text-amber-600">Olindi</h2>
          <ul className="mt-2 border-y border-amber-200">
            {bought.map((line) => (
              <Line key={line.key} line={line} note={noteFor(line)} onToggle={() => toggle(line)} />
            ))}
          </ul>
        </section>
      )}

      {error && <p role="alert" className="mt-6 text-sm font-medium text-red-700">{error}</p>}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {bought.length > 0 && toBuy.length > 0 && (
          <Button variant="outline" onClick={() => run({ type: "clear", scope: "bought" }, () => clearShoppingList("bought"))}>Olinganlarni o‘chirish</Button>
        )}
        {confirmingClear ? (
          <>
            <span className="text-amber-900">Butun ro‘yxat o‘chirilsinmi?</span>
            <Button variant="destructive" onClick={() => run({ type: "clear", scope: "all" }, () => clearShoppingList("all"))}>Ha, tozalash</Button>
            <Button variant="ghost" onClick={() => setConfirmingClear(false)}>Yo‘q</Button>
          </>
        ) : (
          <Button variant={toBuy.length === 0 ? "primary" : "ghost"} onClick={() => setConfirmingClear(true)}>Ro‘yxatni tozalash</Button>
        )}
      </div>
    </>
  );
}
