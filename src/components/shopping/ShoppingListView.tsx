"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, X } from "lucide-react";
import { clearShoppingList, removeFromShoppingList, setShoppingChecked } from "@/app/shopping/actions";
import { Button } from "@/components/ui/Button";
import { useLocale, useT } from "@/i18n/client";
import { mergeShoppingRows, rowsForPicked, type ShoppingLine, type ShoppingRow } from "@/lib/shopping";
import { cn } from "@/lib/utils";
import type { ShoppingRecipe } from "@/server/shopping";

type Change =
  | { type: "check"; ids: string[]; checked: boolean }
  | { type: "removeRecipe"; recipeId: string }
  /** `recipeIds` limits it to those recipes; without it the whole list is cleared. */
  | { type: "clear"; scope: "bought" | "all"; recipeIds?: string[] };

/** What the list looks like once a change lands, shown at once while the server catches up. */
function applyChange(rows: ShoppingRow[], change: Change): ShoppingRow[] {
  switch (change.type) {
    case "check":
      return rows.map((row) => (change.ids.includes(row.id) ? { ...row, checked: change.checked } : row));
    case "removeRecipe":
      return rows.filter((row) => row.recipeId !== change.recipeId);
    case "clear":
      return rows.filter((row) => !((!change.recipeIds || change.recipeIds.includes(row.recipeId)) && (change.scope === "all" || row.checked)));
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
  const t = useT();
  const locale = useLocale();
  const [current, apply] = React.useOptimistic(rows, applyChange);
  const [, startTransition] = React.useTransition();
  const [confirmingClear, setConfirmingClear] = React.useState(false);
  // Recipes the shopper tapped to see only their products. Empty means every recipe on the list.
  const [picked, setPicked] = React.useState<ReadonlySet<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  const run = (change: Change, action: () => Promise<{ ok: true } | { error: string }>) =>
    startTransition(async () => {
      apply(change);
      const result = await action();
      setError("error" in result ? result.error : null);
    });

  const onList = recipes.filter((recipe) => current.some((row) => row.recipeId === recipe.id));
  // A recipe that left the list can no longer be picked.
  const pickedIds = new Set(onList.filter((recipe) => picked.has(recipe.id)).map((recipe) => recipe.id));
  const filtering = pickedIds.size > 0;
  const shownRecipes = filtering ? onList.filter((recipe) => pickedIds.has(recipe.id)) : onList;

  const lines = mergeShoppingRows(rowsForPicked(current, pickedIds), locale);
  const toBuy = lines.filter((line) => !line.checked);
  const bought = lines.filter((line) => line.checked);
  const titles = new Map(recipes.map((recipe) => [recipe.id, recipe.title]));
  // Saying which dish a product is for only helps when there is more than one dish on show.
  const noteFor = (line: ShoppingLine) => (shownRecipes.length > 1 ? line.recipeIds.map((id) => titles.get(id)).join(" · ") : null);
  const togglePicked = (id: string) =>
    setPicked((previous) => {
      const next = new Set(previous);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  /** Clearing only touches what is on screen: the picked recipes, or the whole list when none is picked. */
  const scope = filtering ? [...pickedIds] : undefined;
  const toggle = (line: ShoppingLine) => run({ type: "check", ids: line.ids, checked: !line.checked }, () => setShoppingChecked(line.ids, !line.checked));

  if (current.length === 0) return <p className="mt-10 text-lg text-amber-900" role="status">{t("shopping.cleared")}</p>;

  return (
    <>
      <p className="mt-4 text-lg text-amber-900" aria-live="polite">
        {toBuy.length > 0 ? (
          <>
            {t("shopping.toBuyCount", { count: toBuy.length })}
            {bought.length > 0 && <> · {t("shopping.boughtCount", { count: bought.length })}</>}
          </>
        ) : (
          t("shopping.allBought")
        )}
      </p>

      {onList.length > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="max-w-xl text-sm text-amber-700">{t("shopping.pickHint")}</p>
          <p className="flex items-center gap-3 text-sm font-medium text-amber-950" aria-live="polite">
            {filtering ? t("shopping.showingPicked", { count: pickedIds.size, total: onList.length }) : t("shopping.allShown")}
            {filtering && (
              <button type="button" onClick={() => setPicked(new Set())} className="rounded-full px-3 py-2 text-amber-700 underline underline-offset-4 hover:text-amber-950">
                {t("shopping.showAll")}
              </button>
            )}
          </p>
        </div>
      )}

      <ul className={cn("flex flex-wrap gap-3", onList.length > 1 ? "mt-3" : "mt-8")} aria-label={t("shopping.recipesList")}>
        {onList.map((recipe) => {
          const isPicked = pickedIds.has(recipe.id);
          return (
            <li
              key={recipe.id}
              className={cn(
                "flex items-center gap-1 rounded-2xl border-2 p-1.5 transition-colors",
                isPicked ? "border-amber-700 bg-amber-100" : filtering ? "border-amber-200 bg-transparent" : "border-transparent bg-amber-100",
              )}
            >
              <button
                type="button"
                aria-pressed={isPicked}
                aria-label={t("shopping.pickRecipe", { title: recipe.title })}
                disabled={onList.length < 2}
                onClick={() => togglePicked(recipe.id)}
                className="flex min-w-0 items-center gap-3 rounded-xl p-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 disabled:cursor-default"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-amber-200">
                  <Image src={recipe.coverUrl} alt="" fill sizes="48px" className={cn("object-cover transition-opacity", filtering && !isPicked && "opacity-50")} />
                </span>
                <span className="min-w-0">
                  <span className={cn("block max-w-[12rem] truncate font-medium", filtering && !isPicked ? "text-amber-700" : "text-amber-950")}>{recipe.title}</span>
                  <span className="block text-sm text-amber-600">{recipe.servings} {t("servings.unit")}</span>
                </span>
                {onList.length > 1 && (
                  <span
                    className={cn(
                      "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isPicked ? "border-amber-700 bg-amber-700 text-amber-50" : "border-amber-400",
                    )}
                    aria-hidden="true"
                  >
                    {isPicked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                )}
              </button>
              <Link
                href={`/recipes/${recipe.slug}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-amber-600 transition-colors hover:bg-amber-200 hover:text-amber-950"
                aria-label={t("shopping.openRecipe", { title: recipe.title })}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => run({ type: "removeRecipe", recipeId: recipe.id }, () => removeFromShoppingList(recipe.id))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-amber-600 transition-colors hover:bg-amber-200 hover:text-amber-950"
                aria-label={t("shopping.removeRecipe", { title: recipe.title })}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      {toBuy.length > 0 && (
        <section aria-labelledby="to-buy-heading" className="mt-10">
          <h2 id="to-buy-heading" className="text-sm font-medium uppercase tracking-wider text-amber-600">{t("shopping.toBuy")}</h2>
          <ul className="mt-2 border-y border-amber-200">
            {toBuy.map((line) => (
              <Line key={line.key} line={line} note={noteFor(line)} onToggle={() => toggle(line)} />
            ))}
          </ul>
        </section>
      )}

      {bought.length > 0 && (
        <section aria-labelledby="bought-heading" className="mt-10">
          <h2 id="bought-heading" className="text-sm font-medium uppercase tracking-wider text-amber-600">{t("shopping.bought")}</h2>
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
          <Button variant="outline" onClick={() => run({ type: "clear", scope: "bought", recipeIds: scope }, () => clearShoppingList("bought", scope))}>{t("shopping.clearBought")}</Button>
        )}
        {confirmingClear ? (
          <>
            <span className="text-amber-900">{filtering ? t("shopping.confirmClearPicked") : t("shopping.confirmClear")}</span>
            <Button variant="destructive" onClick={() => run({ type: "clear", scope: "all", recipeIds: scope }, () => clearShoppingList("all", scope))}>
              {filtering ? t("shopping.yesRemove") : t("shopping.yesClear")}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingClear(false)}>{t("common.no")}</Button>
          </>
        ) : (
          <Button variant={toBuy.length === 0 ? "primary" : "ghost"} onClick={() => setConfirmingClear(true)}>{filtering ? t("shopping.clearPicked") : t("shopping.clear")}</Button>
        )}
      </div>
    </>
  );
}
