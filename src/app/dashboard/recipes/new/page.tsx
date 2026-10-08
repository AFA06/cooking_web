import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { RecipeEditor, EMPTY_RECIPE } from "@/components/dashboard/RecipeEditor";
import { getCurrentCreator } from "@/server/creator";

export const metadata: Metadata = { title: "New recipe", robots: { index: false } };

export default async function NewRecipePage() {
  if (!(await getCurrentCreator())) redirect("/creators/join");
  return (
    <Container size="md" className="py-12">
      <h1 className="text-3xl sm:text-4xl font-serif font-medium text-amber-950 mb-8">New recipe</h1>
      <RecipeEditor initial={EMPTY_RECIPE} />
    </Container>
  );
}
