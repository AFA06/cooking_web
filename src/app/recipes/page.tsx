import type { Metadata } from "next";
import { RecipesBrowser } from "@/components/recipe/RecipesBrowser";
import { listPublishedRecipes } from "@/server/recipes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Browse step-by-step recipes from food creators. Free and premium.",
  alternates: { canonical: "/recipes" },
};

export default async function RecipesPage() {
  return <RecipesBrowser recipes={await listPublishedRecipes()} />;
}
