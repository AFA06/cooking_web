import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "@/server/recipes";
import { getCurrentUser } from "@/server/auth";
import { GuidedCooking } from "@/components/recipe/GuidedCooking";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  return { title: recipe ? `Cooking: ${recipe.title}` : "Recipe not found", robots: { index: false } };
}

export default async function CookPage({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();
  const user = await getCurrentUser();
  return <GuidedCooking recipe={recipe} isLoggedIn={!!user} />;
}
