import type { Metadata } from "next";
import { RecipesBrowser } from "@/components/recipe/RecipesBrowser";
import { listPublishedRecipes } from "@/server/recipes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Retseptlar",
  description: "Ijodkorlarning qadam-baqadam retseptlarini ko‘ring. Bepul va premium retseptlar.",
  alternates: { canonical: "/recipes" },
};

export default async function RecipesPage() {
  return <RecipesBrowser recipes={await listPublishedRecipes()} />;
}
