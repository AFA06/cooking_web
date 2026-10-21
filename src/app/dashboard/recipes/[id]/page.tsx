import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { RecipeEditor } from "@/components/dashboard/RecipeEditor";
import { toEditorInitial } from "@/lib/recipe-editor";
import { getT } from "@/i18n/server";
import { getCurrentCreator } from "@/server/creator";
import { loadRecipeForEdit } from "@/server/recipe-write";
import { saveRecipe } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("ed.editMeta"), robots: { index: false } };
}

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ctx, t] = await Promise.all([getCurrentCreator(), getT()]);
  if (!ctx) notFound();
  if (!z.string().uuid().safeParse(id).success) notFound();
  const data = await loadRecipeForEdit(id, ctx.creator.id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-3xl font-medium text-amber-950 break-words sm:text-4xl">{t("ed.editTitle", { title: data.recipe.title })}</h1>
      <RecipeEditor initial={toEditorInitial(data)} save={saveRecipe} basePath="/dashboard/recipes" />
    </div>
  );
}
