import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getRecipeBySlug } from "@/server/recipes";
import { getCurrentUser } from "@/server/auth";
import { getT } from "@/i18n/server";
import { clampServings } from "@/lib/scaling";
import { getCreatorForUser } from "@/server/creator";
import { hasFullAccess } from "@/server/access";
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
  // Cooking is for signed-in people: a new visitor makes an account (or signs in) and lands right back here.
  if (!user) {
    const here = `/recipes/${recipe.slug}/cook${servings ? `?servings=${encodeURIComponent(servings)}` : ""}`;
    redirect(`/auth/signup?next=${encodeURIComponent(here)}`);
  }
  const ownCreator = await getCreatorForUser(user.id);
  const unlocked = await hasFullAccess(user, recipe, ownCreator?.id ?? null, recipe.creator.id);
  // Someone who has not bought the recipe only gets the free steps: locked steps never reach their browser.
  const visible = unlocked ? recipe : { ...recipe, steps: recipe.steps.filter((s) => s.isFree) };
  return <GuidedCooking recipe={visible} locked={recipe.isPremium && !unlocked} isLoggedIn={!!user} servings={clampServings(Number(servings), recipe.servings)} />;
}
