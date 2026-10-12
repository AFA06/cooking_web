import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { RecipeEditor } from "@/components/dashboard/RecipeEditor";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PageHeader, Panel, StatTile, StatusPill } from "@/components/admin/ui";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatRelative } from "@/lib/format";
import { toEditorInitial } from "@/lib/recipe-editor";
import { getRecipeStat, requireAdminPage } from "@/server/admin";
import { loadRecipeForEdit } from "@/server/recipe-write";
import { adminSaveRecipe, deleteRecipe, setRecipeFeatured } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("ed.editMeta") };
}

export default async function AdminRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const [, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const data = await loadRecipeForEdit(id);
  if (!data) notFound();
  const { recipe } = data;
  const stat = await getRecipeStat(id);
  const published = recipe.status === "published";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/recipes", label: t("nav.recipes") }}
        title={recipe.title}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusPill tone={published ? "good" : "neutral"}>{published ? t("dash.published") : t("dash.draft")}</StatusPill>
            {stat && <Link href={`/admin/creators/${stat.creatorId}`} className="text-amber-700 hover:underline">{stat.creator}</Link>}
            <span>{t("adm.updated", { when: formatRelative(recipe.updatedAt, t, locale) })}</span>
          </span>
        }
        actions={
          <>
            <form action={setRecipeFeatured.bind(null, recipe.id, !recipe.isFeatured)}>
              <Button type="submit" variant="outline" aria-pressed={recipe.isFeatured}>
                {recipe.isFeatured ? t("adm.unfeature") : t("adm.feature")}
              </Button>
            </form>
            {published && (
              <Button variant="outline" asChild>
                <Link href={`/recipes/${recipe.slug}`}><ExternalLink className="h-4 w-4" aria-hidden="true" />{t("adm.viewOnSite")}</Link>
              </Button>
            )}
          </>
        }
      />

      {stat && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label={t("dash.col.views")} value={formatNumber(stat.views)} hint={t("adm.allTimeShort")} />
          <StatTile label={t("dash.col.saves")} value={formatNumber(stat.saves)} hint={t("adm.allTimeShort")} />
          <StatTile label={t("adm.tile.cooksStarted")} value={formatNumber(stat.cooks)} hint={t("adm.allTimeShort")} />
          <StatTile label={t("account.completed")} value={formatNumber(stat.completions)} hint={stat.cooks > 0 ? t("adm.completionPct", { pct: Math.round((stat.completions / stat.cooks) * 100) }) : t("adm.noDataYet")} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title={t("adm.recipeContent")}>
          <RecipeEditor initial={toEditorInitial(data)} save={adminSaveRecipe.bind(null, null)} basePath="/admin/recipes" />
        </Panel>
        <div className="min-w-0">
          <Panel title={t("adm.danger")}>
            <ConfirmButton
              action={deleteRecipe.bind(null, recipe.id)}
              label={t("adm.deleteRecipe")}
              warning={t("adm.deleteRecipeWarn", { title: recipe.title })}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
