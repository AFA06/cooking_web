import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { RecipeEditor } from "@/components/dashboard/RecipeEditor";
import { toEditorInitial } from "@/lib/recipe-editor";
import { getCurrentCreator } from "@/server/creator";
import { loadRecipeForEdit } from "@/server/recipe-write";
import { saveRecipe } from "../../actions";

export const metadata: Metadata = { title: "Retseptni tahrirlash", robots: { index: false } };

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentCreator();
  if (!ctx) redirect("/creators/join");
  if (!z.string().uuid().safeParse(id).success) notFound();
  const data = await loadRecipeForEdit(id, ctx.creator.id);
  if (!data) notFound();

  return (
    <Container size="md" className="py-12">
      <h1 className="mb-8 text-3xl font-medium text-amber-950 break-words sm:text-4xl">Tahrirlash: {data.recipe.title}</h1>
      <RecipeEditor initial={toEditorInitial(data)} save={saveRecipe} basePath="/dashboard/recipes" />
    </Container>
  );
}
