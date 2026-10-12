import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, EmptyState, PageHeader, Panel, SearchForm, StatusPill, table } from "@/components/admin/ui";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listCreatorsAdmin, requireAdminPage } from "@/server/admin";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("adm.nav.creators") };
}

export default async function AdminCreatorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const q = (await searchParams).q?.trim() || undefined;
  const creators = await listCreatorsAdmin(q);

  return (
    <>
      <PageHeader
        eyebrow={t("adm.manage")}
        title={t("adm.nav.creators")}
        description={t("adm.creatorsDesc")}
        actions={
          <Button asChild>
            <Link href="/admin/creators/new"><Plus className="h-4 w-4" aria-hidden="true" />{t("adm.newCreator")}</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchForm action="/admin/creators" defaultValue={q} placeholder={t("adm.searchCreators")} />
        <p className="text-sm text-amber-600">{t("adm.creatorsCount", { count: formatNumber(creators.length) })}</p>
      </div>

      <Panel flush>
        {creators.length === 0 ? (
          <EmptyState title={q ? t("recipes.nothingFound") : t("adm.noCreators")} text={q ? t("adm.changeSearch") : t("adm.addFirstCreator")} />
        ) : (
          <div className={table.wrap}>
            <table className={table.root}>
              <thead>
                <tr>
                  <th className={table.th}>{t("role.creator")}</th>
                  <th className={table.th}>{t("adm.col.flags")}</th>
                  <th className={cn(table.th, table.thNum)}>{t("nav.recipes")}</th>
                  <th className={cn(table.th, table.thNum)}>{t("dash.col.views")}</th>
                  <th className={cn(table.th, table.thNum)}>{t("dash.col.saves")}</th>
                  <th className={cn(table.th, table.thNum)}>{t("adm.cooks")}</th>
                  <th className={table.th}>{t("adm.col.joined")}</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c.id} className={table.tr}>
                    <td className={table.td}>
                      <Link href={`/admin/creators/${c.id}`} className="group flex items-center gap-3">
                        <Avatar name={c.name} src={c.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block font-medium group-hover:text-amber-700 group-hover:underline">{c.name}</span>
                          <span className="block truncate text-xs text-amber-600">{c.userEmail ?? t("adm.notLinked")}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={table.td}>
                      <span className="flex flex-wrap gap-1.5">
                        {c.isFoundingCreator && <StatusPill tone="accent">{t("adm.founding")}</StatusPill>}
                        {c.isFeatured && <StatusPill tone="good">{t("adm.featured")}</StatusPill>}
                        {!c.isFoundingCreator && !c.isFeatured && <span className="text-amber-500">—</span>}
                      </span>
                    </td>
                    <td className={cn(table.td, table.tdNum)}>{c.published} / {c.recipes}</td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(c.views)}</td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(c.saves)}</td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(c.cooks)}</td>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatShortDate(c.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="mt-3 text-xs text-amber-600">{t("adm.recipesColNote")}</p>
    </>
  );
}
