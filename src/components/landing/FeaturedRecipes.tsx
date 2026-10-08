import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getFeaturedRecipes } from "@/server/recipes";
import { PLATFORM_CONFIG } from "@/lib/constants";

export async function FeaturedRecipes() {
  const recipes = await getFeaturedRecipes(6);
  if (recipes.length === 0) return null;

  return (
    <section className="py-20 lg:py-28" aria-labelledby="featured-heading">
      <Container size="xl">
        <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="featured-heading" className="text-3xl font-medium text-amber-950 sm:text-5xl">Tanlangan retseptlar</h2>
            <p className="mt-2 text-amber-600">Namuna retseptlar: Damda’dagi retsept qanday ko‘rinishini ko‘ring.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={PLATFORM_CONFIG.urls.recipes}>Barcha retseptlar →</Link>
          </Button>
        </header>
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      </Container>
    </section>
  );
}
