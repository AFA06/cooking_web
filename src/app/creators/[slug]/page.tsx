import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getCreatorBySlug, getRecipesByCreator } from "@/server/recipes";
import { getCurrentUser } from "@/server/auth";
import { getSavedRecipeIds } from "@/server/user-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) return { title: "Ijodkor topilmadi" };
  return {
    title: creator.name,
    description: creator.bio,
    alternates: { canonical: `/creators/${creator.slug}` },
  };
}

export default async function CreatorPage({ params }: Props) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) notFound();
  const user = await getCurrentUser();
  const [recipes, savedList] = await Promise.all([getRecipesByCreator(creator.slug), user ? getSavedRecipeIds(user.id) : []]);
  const savedIds = new Set(savedList);

  return (
    <Container size="lg" className="py-12 sm:py-16">
      <header className="flex flex-col sm:flex-row sm:items-center gap-6">
        {creator.avatarUrl && (
          <Image src={creator.avatarUrl} alt="" width={96} height={96} className="h-24 w-24 rounded-full object-cover" />
        )}
        <div className="max-w-2xl">
          {creator.isFoundingCreator && <Badge variant="founding">Asoschi ijodkor</Badge>}
          <h1 className="mt-2 text-3xl sm:text-5xl font-serif font-medium text-amber-950 break-words">{creator.name}</h1>
          {creator.bio && <p className="mt-3 text-lg text-amber-800">{creator.bio}</p>}
        </div>
      </header>
      <h2 className="mt-12 mb-6 text-2xl font-serif text-amber-950">Retseptlar</h2>
      {recipes.length === 0 ? (
        <p className="text-amber-700">Hali retseptlar nashr etilmagan.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} isLoggedIn={!!user} saved={savedIds.has(r.id)} />
          ))}
        </div>
      )}
    </Container>
  );
}
