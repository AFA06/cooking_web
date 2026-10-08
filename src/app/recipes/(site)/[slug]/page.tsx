import { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { trackEvent } from "@/server/analytics";
import { getRecipeBySlug } from "@/server/recipes";
import { getCurrentUser } from "@/server/auth";
import { isRecipeSaved } from "@/server/user-data";
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
    return { title: "Retsept topilmadi" };
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
  const isSaved = user ? await isRecipeSaved(user.id, recipe.id) : false;

  return <RecipeDetail recipe={recipe} isLoggedIn={!!user} isSaved={isSaved} />;
}