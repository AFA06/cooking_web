import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { RecipeEditor, type EditorInitial } from "@/components/dashboard/RecipeEditor";
import { getCurrentCreator, getOwnedRecipeForEdit } from "@/server/creator";

export const metadata: Metadata = { title: "Retseptni tahrirlash", robots: { index: false } };

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentCreator();
  if (!ctx) redirect("/creators/join");
  if (!z.string().uuid().safeParse(id).success) notFound();
  const data = await getOwnedRecipeForEdit(ctx.creator.id, id);
  if (!data) notFound();
  const { recipe: r, ingredients, steps } = data;

  const initial: EditorInitial = {
    id: r.id,
    title: r.title,
    description: r.description,
    coverUrl: r.coverUrl,
    servings: String(r.servings),
    prepTimeMinutes: String(r.prepTimeMinutes),
    cookTimeMinutes: String(r.cookTimeMinutes),
    difficulty: r.difficulty,
    isPremium: r.isPremium,
    priceAmount: r.priceAmount ? String(r.priceAmount) : "",
    tags: r.tags.join(", "),
    status: r.status,
    ingredients: ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    steps: steps.map((s) => ({
      title: s.title,
      instruction: s.instruction,
      mediaUrl: s.mediaUrl ?? "",
      timerMinutes: s.timerSeconds ? String(Math.round(s.timerSeconds / 60)) : "",
      temperatureCelsius: s.temperatureCelsius ? String(s.temperatureCelsius) : "",
      tip: s.tip ?? "",
      ingredientPositions: s.ingredientPositions.join(", "),
    })),
  };

  return (
    <Container size="md" className="py-12">
      <h1 className="text-3xl sm:text-4xl font-serif font-medium text-amber-950 mb-8 break-words">Tahrirlash: {r.title}</h1>
      <RecipeEditor initial={initial} />
    </Container>
  );
}
