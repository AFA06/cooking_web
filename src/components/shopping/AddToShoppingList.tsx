"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ShoppingBasket } from "lucide-react";
import { addToShoppingList } from "@/app/shopping/actions";
import { useServings } from "@/components/recipe/Servings";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";
import { PLATFORM_CONFIG } from "@/lib/constants";

interface Props {
  recipeId: string;
  slug: string;
  isLoggedIn: boolean;
  /** Servings this recipe is already on the person's list for, if it is. */
  listedServings: number | null;
}

/** Copies the ingredients, at the servings chosen on the page, to the shopping list. Lives inside <ServingsProvider>. */
export function AddToShoppingList({ recipeId, slug, isLoggedIn, listedServings }: Props) {
  const t = useT();
  const { servings } = useServings();
  const [listed, setListed] = React.useState(listedServings);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (!isLoggedIn) {
    return (
      <Button variant="outline" asChild className="w-full">
        <Link href={`${PLATFORM_CONFIG.urls.login}?next=${encodeURIComponent(`/recipes/${slug}`)}`}>
          <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
          {t("shopping.add")}
        </Link>
      </Button>
    );
  }

  const add = () =>
    startTransition(async () => {
      const result = await addToShoppingList(recipeId, servings);
      if ("error" in result) return setError(result.error);
      setError(null);
      setListed(servings);
    });

  return (
    <div>
      {listed === servings ? (
        <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sage-700">
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            {t("shopping.onList", { count: listed ?? 0 })}
          </span>
          <Link href={PLATFORM_CONFIG.urls.shopping} className="font-medium text-amber-950 underline underline-offset-4 hover:text-amber-700">{t("shopping.openList")}</Link>
        </p>
      ) : (
        <Button variant="outline" className="w-full" onClick={add} loading={pending}>
          <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
          {listed === null ? t("shopping.add") : t("shopping.updateTo", { count: servings })}
        </Button>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
