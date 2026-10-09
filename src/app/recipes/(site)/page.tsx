import type { Metadata } from "next";
import { RecipesBrowser } from "@/components/recipe/RecipesBrowser";
import { ALL, DIFFICULTIES, PRICE_FILTERS, TIME_FILTERS } from "@/lib/filters";
import { getCurrentUser } from "@/server/auth";
import { listPublishedRecipes } from "@/server/recipes";
import { getSavedRecipeIds } from "@/server/user-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Retseptlar",
  description: "Ijodkorlarning qadam-baqadam retseptlarini ko‘ring. Bepul va premium retseptlar.",
  alternates: { canonical: "/recipes" },
};

interface SearchParams {
  q?: string;
  price?: string;
  time?: string;
  difficulty?: string;
}

const oneOf = (value: string | undefined, allowed: readonly string[]) => (value && allowed.includes(value) ? value : ALL);

export default async function RecipesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [recipes, savedIds] = await Promise.all([listPublishedRecipes(), user ? getSavedRecipeIds(user.id) : []]);

  return (
    <RecipesBrowser
      recipes={recipes}
      isLoggedIn={!!user}
      savedIds={savedIds}
      initialFilters={{
        query: sp.q?.slice(0, 80) ?? "",
        difficulty: oneOf(sp.difficulty, DIFFICULTIES),
        price: oneOf(sp.price, PRICE_FILTERS),
        time: TIME_FILTERS.find((t) => String(t.max) === sp.time)?.label ?? ALL,
      }}
    />
  );
}
