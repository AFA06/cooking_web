import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECIPES, getRecipeBySlug } from "@/data/recipes";
import { GuidedCooking } from "@/components/recipe/GuidedCooking";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  return { title: recipe ? `Cooking: ${recipe.title}` : "Recipe not found", robots: { index: false } };
}

export default async function CookPage({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();
  return <GuidedCooking recipe={recipe} />;
}
