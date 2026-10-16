import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { CookbookControls } from "@/components/cookbooks/CookbookManage";
import { SiteShell } from "@/components/layout/SiteShell";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getT } from "@/i18n/server";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/server/auth";
import { getCookbook } from "@/server/cookbooks";
import { toListItem } from "@/lib/recipe-list";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("cookbook.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function CookbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) redirect(`${PLATFORM_CONFIG.urls.login}?next=/account/cookbooks/${id}`);
  const cookbook = z.string().uuid().safeParse(id).success ? await getCookbook(user.id, id) : undefined;
  if (!cookbook) notFound();

  return (
    <SiteShell>
      <Container size="lg" className="py-12 sm:py-16">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-950">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("nav.myKitchen")}
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{t("cookbook.title")} · {cookbook.recipes.length} {t("recipes.countNoun", { count: cookbook.recipes.length })}</p>
        <h1 className="mt-3 break-words text-[2.6rem] font-medium leading-[1.04] text-amber-950 sm:text-6xl">{cookbook.name}</h1>
        <div className="mt-6">
          <CookbookControls id={cookbook.id} name={cookbook.name} />
        </div>

        {cookbook.recipes.length === 0 ? (
          <div className="mt-10 rounded-[1.75rem] bg-amber-100 p-8 sm:p-12">
            <h2 className="text-2xl font-medium text-amber-950">{t("cookbook.empty")}</h2>
            <p className="mt-2 max-w-xl text-amber-900">{t("cookbook.emptyText")}</p>
            <Button asChild size="lg" className="mt-7">
              <Link href={PLATFORM_CONFIG.urls.recipes}>{t("common.browseRecipes")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {cookbook.recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={toListItem(recipe)} isLoggedIn saved />
            ))}
          </div>
        )}
      </Container>
    </SiteShell>
  );
}
