import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { EMPTY_RECIPE, RecipeEditor } from "@/components/dashboard/RecipeEditor";
import { Avatar, EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { getT } from "@/i18n/server";
import { getCreatorAdmin, listCreatorsAdmin, requireAdminPage } from "@/server/admin";
import { adminSaveRecipe } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("ed.newRecipe") };
}

export default async function AdminNewRecipePage({ searchParams }: { searchParams: Promise<{ creatorId?: string }> }) {
  const [, t] = await Promise.all([requireAdminPage(), getT()]);
  const { creatorId } = await searchParams;
  const creator = creatorId && z.string().uuid().safeParse(creatorId).success ? await getCreatorAdmin(creatorId) : null;

  if (!creator) {
    const creators = await listCreatorsAdmin();
    return (
      <>
        <PageHeader back={{ href: "/admin/recipes", label: t("nav.recipes") }} title={t("ed.newRecipe")} description={t("adm.pickCreatorDesc")} />
        <Panel title={t("adm.pickCreator")} flush>
          {creators.length === 0 ? (
            <EmptyState title={t("adm.noCreators")} text={t("adm.createCreatorFirst")} action={<Link href="/admin/creators/new" className="font-medium text-amber-700 underline">{t("adm.createCreatorLink")}</Link>} />
          ) : (
            <ul className="divide-y divide-amber-100">
              {creators.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/recipes/new?creatorId=${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/60 sm:px-6">
                    <Avatar name={c.name} src={c.avatarUrl} />
                    <span className="flex-1 font-medium text-amber-950">{c.name}</span>
                    <span className="text-sm text-amber-600">{c.recipes} {t("recipes.countNoun", { count: c.recipes })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        back={{ href: `/admin/creators/${creator.id}`, label: creator.name }}
        title={t("ed.newRecipe")}
        description={t("adm.publishedUnder", { name: creator.name })}
      />
      <Panel className="max-w-4xl">
        <RecipeEditor initial={EMPTY_RECIPE} save={adminSaveRecipe.bind(null, creator.id)} basePath="/admin/recipes" />
      </Panel>
    </>
  );
}
