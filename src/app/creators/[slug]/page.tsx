import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { CREATORS, getCreatorBySlug, getRecipesByCreator } from "@/data/recipes";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CREATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const creator = getCreatorBySlug(slug);
  if (!creator) return { title: "Creator not found" };
  return {
    title: creator.name,
    description: creator.bio,
    alternates: { canonical: `/creators/${creator.slug}` },
  };
}

export default async function CreatorPage({ params }: Props) {
  const { slug } = await params;
  const creator = getCreatorBySlug(slug);
  if (!creator) notFound();
  const recipes = getRecipesByCreator(creator.slug);

  return (
    <Container size="lg" className="py-12 sm:py-16">
      <header className="flex flex-col sm:flex-row sm:items-center gap-6">
        {creator.avatarUrl && (
          <Image src={creator.avatarUrl} alt="" width={96} height={96} className="h-24 w-24 rounded-full object-cover" />
        )}
        <div className="max-w-2xl">
          {creator.isFoundingCreator && <Badge variant="founding">Founding creator</Badge>}
          <h1 className="mt-2 text-3xl sm:text-5xl font-serif font-medium text-amber-950 break-words">{creator.name}</h1>
          {creator.bio && <p className="mt-3 text-lg text-amber-800">{creator.bio}</p>}
        </div>
      </header>
      <h2 className="mt-12 mb-6 text-2xl font-serif text-amber-950">Recipes</h2>
      {recipes.length === 0 ? (
        <p className="text-amber-700">No recipes published yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </Container>
  );
}
