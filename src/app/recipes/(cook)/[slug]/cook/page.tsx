import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "@/server/recipes";
import { getCurrentUser } from "@/server/auth";
import { getT } from "@/i18n/server";
import { clampServings } from "@/lib/scaling";
import { GuidedCooking } from "@/components/recipe/GuidedCooking";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ servings?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  const t = await getT();
  return { title: recipe ? t("cook.metaTitle", { title: recipe.title }) : t("recipe.notFound"), robots: { index: false } };
}

export default async function CookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { servings } = await searchParams;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();
  const user = await getCurrentUser();
  return <GuidedCooking recipe={recipe} isLoggedIn={!!user} servings={clampServings(Number(servings), recipe.servings)} />;
}
