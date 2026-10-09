"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { formatMinutes } from "@/lib/format";
import { MAX_SERVINGS, MIN_SERVINGS, clampServings, scaleQuantity, scaleTimes } from "@/lib/scaling";
import { cn } from "@/lib/utils";
import type { RecipeIngredient } from "@/types/recipe";

interface ServingsState {
  base: number;
  servings: number;
  /** Chosen servings divided by the recipe's own servings. */
  factor: number;
  /** Adds to the current value; safe for rapid taps. */
  step: (delta: number) => void;
  reset: () => void;
}

const ServingsContext = React.createContext<ServingsState | null>(null);

function useServings(): ServingsState {
  const value = React.useContext(ServingsContext);
  if (!value) throw new Error("Servings components must be rendered inside <ServingsProvider>.");
  return value;
}

/** Holds the chosen number of servings for one recipe page. */
export function ServingsProvider({ base, initial, children }: { base: number; initial?: number; children: React.ReactNode }) {
  const [servings, setRaw] = React.useState(() => clampServings(initial ?? base, base));
  const value = React.useMemo<ServingsState>(
    () => ({
      base,
      servings,
      factor: servings / base,
      step: (delta) => setRaw((current) => clampServings(current + delta, base)),
      reset: () => setRaw(base),
    }),
    [base, servings],
  );
  return <ServingsContext.Provider value={value}>{children}</ServingsContext.Provider>;
}

export function ServingsStepper() {
  const { base, servings, step, reset } = useServings();
  const round = "flex h-11 w-11 items-center justify-center rounded-full border border-sage-500/40 bg-amber-100 text-amber-950 transition-colors hover:border-amber-950 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-3" role="group" aria-label="Porsiyalar soni">
        <button type="button" className={round} onClick={() => step(-1)} disabled={servings <= MIN_SERVINGS} aria-label="Porsiyani kamaytirish">
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="min-w-[6.5rem] text-center" aria-live="polite">
          <span className="font-serif text-2xl font-semibold text-amber-950 tabular-nums">{servings}</span>
          <span className="ml-1.5 text-amber-900">kishilik</span>
        </p>
        <button type="button" className={round} onClick={() => step(1)} disabled={servings >= MAX_SERVINGS} aria-label="Porsiyani ko‘paytirish">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {servings !== base && (
        <button type="button" onClick={reset} className="text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
          Asl retsept: {base} kishilik
        </button>
      )}
    </div>
  );
}

/** Ingredient list that follows the chosen servings; rows can be ticked off while gathering. */
export function ScaledIngredients({ ingredients }: { ingredients: RecipeIngredient[] }) {
  const { factor } = useServings();
  const [checked, setChecked] = React.useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul className="mt-5">
      {ingredients.map((i) => {
        const done = checked.has(i.id);
        return (
          <li key={i.id} className="border-t border-sage-200 first:border-t-0">
            <label className="flex min-h-[3.25rem] cursor-pointer items-center gap-3 py-2">
              <input type="checkbox" checked={done} onChange={() => toggle(i.id)} className="peer sr-only" />
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-amber-700 peer-focus-visible:ring-offset-2",
                  done ? "border-sage-600 bg-sage-600 text-amber-50" : "border-sage-500/50 bg-amber-100",
                )}
                aria-hidden="true"
              >
                {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className={cn("flex-1 transition-colors", done ? "text-amber-500 line-through" : "text-amber-950")}>{i.name}</span>
              <span className={cn("whitespace-nowrap font-semibold tabular-nums transition-colors", done ? "text-amber-500" : "text-amber-950")}>
                {scaleQuantity(i.quantity, i.unit, factor)} <span className="font-normal text-amber-600">{i.unit}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact scaled amounts for the ingredients one step uses. */
export function StepIngredients({ ingredients }: { ingredients: RecipeIngredient[] }) {
  const { factor } = useServings();
  if (ingredients.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Shu qadam uchun masalliqlar">
      {ingredients.map((i) => (
        <li key={i.id} className="rounded-full bg-sage-50 px-3 py-1.5 text-sm text-sage-900">
          <span className="font-semibold tabular-nums">
            {scaleQuantity(i.quantity, i.unit, factor)} {i.unit}
          </span>{" "}
          {i.name.toLowerCase()}
        </li>
      ))}
    </ul>
  );
}

type TimePart = "total" | "prep" | "cook";

/** A time that follows the chosen servings; marked as an estimate once it differs from the recipe. */
export function ScaledTime({ prepMinutes, cookMinutes, part }: { prepMinutes: number; cookMinutes: number; part: TimePart }) {
  const { factor } = useServings();
  const minutes = scaleTimes(prepMinutes, cookMinutes, factor)[part];
  return (
    <>
      {factor !== 1 && minutes > 0 && <span title="Porsiya o‘zgargani uchun taxminiy vaqt">≈ </span>}
      {formatMinutes(minutes)}
    </>
  );
}

export function ServingsCount() {
  return <>{useServings().servings}</>;
}

/** "Start cooking" link that carries the chosen servings into guided cooking. */
export function CookLink({ slug, children, ...button }: { slug: string; children: React.ReactNode } & Omit<ButtonProps, "asChild">) {
  const { base, servings } = useServings();
  const href = servings === base ? `/recipes/${slug}/cook` : `/recipes/${slug}/cook?servings=${servings}`;
  return (
    <Button asChild {...button}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
