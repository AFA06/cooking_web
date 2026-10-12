import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { RecipeEditor, EMPTY_RECIPE } from "@/components/dashboard/RecipeEditor";
import { getT } from "@/i18n/server";
import { getCurrentCreator } from "@/server/creator";
import { saveRecipe } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("ed.newRecipe"), robots: { index: false } };
}

export default async function NewRecipePage() {
  const [creator, t] = await Promise.all([getCurrentCreator(), getT()]);
  if (!creator) redirect("/creators/join");
  return (
    <Container size="md" className="py-12">
      <h1 className="text-3xl sm:text-4xl font-serif font-medium text-amber-950 mb-8">{t("ed.newRecipe")}</h1>
      <RecipeEditor initial={EMPTY_RECIPE} save={saveRecipe} basePath="/dashboard/recipes" />
    </Container>
  );
}
