import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader, SearchForm, SegmentedLinks } from "@/components/admin/ui";
import { StudioRecipeCard } from "@/components/studio/StudioRecipeCard";
import { Button } from "@/components/ui/Button";
import { getT } from "@/i18n/server";
import { withQuery } from "@/lib/admin-stats";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser, listCreatorRecipes } from "@/server/creator";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("nav.recipes"), robots: { index: false } };
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

export default async function StudioRecipesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string }> }) {
  const [user, t, sp] = await Promise.all([getCurrentUser(), getT(), searchParams]);
  if (!user) redirect("/auth/login?next=/dashboard/recipes");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");

  const q = sp.q?.trim().toLowerCase() || undefined;
  const status = STATUS.some((s) => s.value === sp.status) ? sp.status! : "all";
  const type = TYPE.some((x) => x.value === sp.type) ? sp.type! : "all";
  const all = await listCreatorRecipes(creator.id);
  const items = all.filter(
    (r) =>
      (!q || r.title.toLowerCase().includes(q)) &&
      (status === "all" || r.status === status) &&
      (type === "all" || (type === "premium" ? r.isPremium : !r.isPremium)),
  );
  const href = (over: Record<string, string | undefined>) => withQuery("/dashboard/recipes", { q: sp.q, status, type, ...over });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("studio.eyebrow")}
        title={t("nav.recipes")}
        description={t("studio.recipes.desc")}
        actions={
          <Button asChild size="lg">
            <Link href="/dashboard/recipes/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("dash.newRecipe")}
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchForm action="/dashboard/recipes" defaultValue={sp.q} placeholder={t("studio.recipes.search")} hidden={{ status: status === "all" ? undefined : status, type: type === "all" ? undefined : type }} />
        <SegmentedLinks label={t("dash.col.status")} items={STATUS.map((s) => ({ href: href({ status: s.value }), label: t(s.label), active: s.value === status }))} />
        <SegmentedLinks label={t("adm.type")} items={TYPE.map((x) => ({ href: href({ type: x.value }), label: t(x.label), active: x.value === type }))} />
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-100">
          <EmptyState
            title={all.length === 0 ? t("studio.empty") : t("adm.noRecipesFound")}
            text={all.length === 0 ? t("studio.emptyText") : t("adm.changeFilters")}
            action={
              all.length === 0 ? (
                <Button asChild>
                  <Link href="/dashboard/recipes/new">{t("dash.createFirst")}</Link>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <StudioRecipeCard key={r.id} recipe={r} />
          ))}
        </ul>
      )}
    </div>
  );
}
