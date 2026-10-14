import { Metadata } from "next";
import { getT } from "@/i18n/server";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { trackEvent } from "@/server/analytics";
import { getRecipeBySlug, getRecipesByCreator } from "@/server/recipes";
import { getCurrentUser } from "@/server/auth";
import { getSavedRecipeIds } from "@/server/user-data";
import { getRecipeRating, getRecipeReviews, getReviewEligibility } from "@/server/reviews";
import { getShoppingServings } from "@/server/shopping";
import { getCreatorForUser } from "@/server/creator";
import { getRecipeSecrets } from "@/server/secrets";
import { RecipeDetail } from "@/components/recipe/RecipeDetail";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  
  if (!recipe) {
    return { title: (await getT())("recipe.notFound") };
  }

  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      type: "article",
      images: [
        {
          url: recipe.coverMedia.url,
          width: 1200,
          height: 630,
          alt: recipe.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description: recipe.description,
      images: [recipe.coverMedia.url],
    },
  };
}

export default async function RecipePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { src } = await searchParams;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  const user = await getCurrentUser();
  after(() =>
    trackEvent({ name: "recipe_view", userId: user?.id, recipeId: recipe.id, creatorId: recipe.creator.id, source: src }),
  );
  const [byCreator, savedList, reviews, rating, eligibility, shoppingServings, ownCreator] = await Promise.all([
    getRecipesByCreator(recipe.creator.slug),
    user ? getSavedRecipeIds(user.id) : [],
    getRecipeReviews(recipe.id),
    getRecipeRating(recipe.id),
    user ? getReviewEligibility(user.id, recipe.id) : null,
    user ? getShoppingServings(user.id, recipe.id) : null,
    user ? getCreatorForUser(user.id) : null,
  ]);
  const secrets = recipe.isPremium ? await getRecipeSecrets(recipe.id, recipe.creator.id, user, ownCreator?.id ?? null) : null;
  const savedIds = new Set(savedList);
  const moreRecipes = byCreator.filter((r) => r.id !== recipe.id).slice(0, 4);

  return <RecipeDetail recipe={recipe} isLoggedIn={!!user} isSaved={savedIds.has(recipe.id)} moreRecipes={moreRecipes} savedIds={savedIds} reviews={reviews} rating={rating} eligibility={eligibility} shoppingServings={shoppingServings} secrets={secrets} />;
}