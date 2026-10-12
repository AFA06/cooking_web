import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RecipeTable } from "@/components/admin/RecipeTable";
import { EmptyState, PageHeader, Pagination, Panel, SearchForm, SegmentedLinks } from "@/components/admin/ui";
import { getT } from "@/i18n/server";
import { withQuery } from "@/lib/admin-stats";
import { PAGE_SIZE, listRecipesAdmin, parsePage, requireAdminPage } from "@/server/admin";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("nav.recipes") };
}

const STATUS = [
  { value: "all", label: "filter.all" },
  { value: "published", label: "dash.published" },
  { value: "draft", label: "dash.draft" },
];
const TYPE = [
  { value: "all", label: "filter.all" },
  { value: "free", label: "filter.free" },
  { value: "premium", label: "filter.premium" },
];

export default async function AdminRecipesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }> }) {
  const [, t] = await Promise.all([requireAdminPage(), getT()]);
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = STATUS.some((s) => s.value === sp.status) ? sp.status! : "all";
  const type = TYPE.some((x) => x.value === sp.type) ? sp.type! : "all";
  const page = parsePage(sp.page);
  const { items, total } = await listRecipesAdmin({ q, status, type, page });
  const href = (over: Record<string, string | number | undefined>) => withQuery("/admin/recipes", { q, status, type, ...over });

  return (
    <>
      <PageHeader
        eyebrow={t("adm.manage")}
        title={t("nav.recipes")}
        description={t("adm.recipesDesc")}
        actions={
          <Button asChild>
            <Link href="/admin/recipes/new"><Plus className="h-4 w-4" aria-hidden="true" />{t("dash.newRecipe")}</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm action="/admin/recipes" defaultValue={q} placeholder={t("adm.searchRecipes")} hidden={{ status: status === "all" ? undefined : status, type: type === "all" ? undefined : type }} />
        <SegmentedLinks label={t("dash.col.status")} items={STATUS.map((s) => ({ href: href({ status: s.value, page: undefined }), label: t(s.label), active: s.value === status }))} />
        <SegmentedLinks label={t("adm.type")} items={TYPE.map((x) => ({ href: href({ type: x.value, page: undefined }), label: t(x.label), active: x.value === type }))} />
      </div>

      <Panel flush>
        {items.length === 0 ? (
          <EmptyState title={t("adm.noRecipesFound")} text={t("adm.changeFilters")} />
        ) : (
          <RecipeTable recipes={items} />
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} hrefFor={(n) => href({ page: n === 1 ? undefined : n })} />
      </Panel>
      <p className="mt-3 text-xs text-amber-600">{t("adm.recipesFoot")}</p>
    </>
  );
}
