"use client";

import { Beef, Droplet, Flame, Wheat, type LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { RecipeNutrition } from "@/types/recipe";

/** One colour and icon per nutrient, the same on cards and on the recipe page. */
const NUTRIENTS: { key: keyof RecipeNutrition; label: string; unit: string; icon: LucideIcon; tone: string; tint: string }[] = [
  { key: "calories", label: "nutrient.calories", unit: "nutrient.kcal", icon: Flame, tone: "text-[#eda65c]", tint: "bg-[#eda65c]/15" },
  { key: "proteinGrams", label: "nutrient.protein", unit: "nutrient.g", icon: Beef, tone: "text-[#ec8f8f]", tint: "bg-[#ec8f8f]/15" },
  { key: "fatGrams", label: "nutrient.fat", unit: "nutrient.g", icon: Droplet, tone: "text-[#e6cb62]", tint: "bg-[#e6cb62]/15" },
  { key: "carbGrams", label: "nutrient.carbs", unit: "nutrient.g", icon: Wheat, tone: "text-[#9fc98c]", tint: "bg-[#9fc98c]/15" },
];

/** Calories of one serving as a small pill; made to sit on a recipe photo. */
export function CaloriesBadge({ calories, className }: { calories: number; className?: string }) {
  const t = useT();
  const { label, unit, icon: Icon, tone } = NUTRIENTS[0];
  return (
    <p title={`${t("nutrient.perPerson")}: ${calories} ${t(unit)}`} className={cn("flex h-7 shrink-0 items-center gap-1 rounded-full bg-amber-50/95 pl-2 pr-2.5 text-xs font-semibold text-amber-950 shadow-sm tabular-nums", className)}>
      <Icon className={cn("h-3.5 w-3.5", tone)} strokeWidth={2.25} aria-hidden="true" />
      <span className="sr-only">{t(label)}, {t("nutrient.perPerson")}: </span>
      {calories}
      <span className="font-normal text-amber-600">{t(unit)}</span>
    </p>
  );
}

/** What one person eats — the whole dish divided by its servings — with the nutrient names. */
export function NutritionFacts({ nutrition, className }: { nutrition: RecipeNutrition; className?: string }) {
  const t = useT();
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wider text-amber-600">{t("nutrient.perPerson")}</p>
      <dl className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {NUTRIENTS.map(({ key, label, unit, icon: Icon, tone, tint }) => (
          <div key={key} className="flex min-w-0 items-center gap-3 rounded-2xl bg-amber-100 p-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tint)} aria-hidden="true">
              <Icon className={cn("h-5 w-5", tone)} strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <dd className="font-serif text-xl font-medium leading-tight text-amber-950 tabular-nums">
                {nutrition[key]}
                <span className="ml-1 font-sans text-xs font-normal text-amber-600">{t(unit)}</span>
              </dd>
              <dt className="truncate text-sm text-amber-600">{t(label)}</dt>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
