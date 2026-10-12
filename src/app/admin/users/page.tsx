import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, EmptyState, PageHeader, Pagination, Panel, SearchForm, SegmentedLinks, StatusPill, table } from "@/components/admin/ui";
import { withQuery } from "@/lib/admin-stats";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatRelative, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAGE_SIZE, listUsersAdmin, parsePage, requireAdminPage } from "@/server/admin";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("adm.nav.users") };
}

const ROLES = [
  { value: "all", label: "filter.all" },
  { value: "user", label: "role.user" },
  { value: "creator", label: "role.creator" },
  { value: "admin", label: "role.admin" },
];

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const [, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const role = ROLES.some((r) => r.value === sp.role) ? sp.role! : "all";
  const page = parsePage(sp.page);
  const { items, total } = await listUsersAdmin({ q, role, page });
  const href = (over: Record<string, string | number | undefined>) => withQuery("/admin/users", { q, role, ...over });

  return (
    <>
      <PageHeader eyebrow={t("adm.manage")} title={t("adm.nav.users")} description={t("adm.usersDesc")} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm action="/admin/users" defaultValue={q} placeholder={t("adm.searchUsers")} hidden={{ role: role === "all" ? undefined : role }} />
        <SegmentedLinks label={t("adm.role")} items={ROLES.map((r) => ({ href: href({ role: r.value, page: undefined }), label: t(r.label), active: r.value === role }))} />
      </div>

      <Panel flush>
        {items.length === 0 ? (
          <EmptyState title={t("adm.noUsers")} text={t("adm.changeFilter")} />
        ) : (
          <div className={table.wrap}>
            <table className={table.root}>
              <thead>
                <tr>
                  <th className={table.th}>{t("role.user")}</th>
                  <th className={table.th}>{t("adm.role")}</th>
                  <th className={cn(table.th, table.thNum)}>{t("dash.col.saves")}</th>
                  <th className={cn(table.th, table.thNum)}>{t("adm.cooks")}</th>
                  <th className={table.th}>{t("adm.lastSeen")}</th>
                  <th className={table.th}>{t("adm.registered")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className={table.tr}>
                    <td className={table.td}>
                      <Link href={`/admin/users/${u.id}`} className="group flex items-center gap-3">
                        <Avatar name={u.name} />
                        <span className="min-w-0">
                          <span className="block font-medium group-hover:text-amber-700 group-hover:underline">{u.name}</span>
                          <span className="block truncate text-xs text-amber-600">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={table.td}>
                      <StatusPill tone={u.role === "admin" ? "accent" : u.role === "creator" ? "good" : "neutral"}>{t(`role.${u.role}`)}</StatusPill>
                    </td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(u.saves)}</td>
                    <td className={cn(table.td, table.tdNum)}>
                      {formatNumber(u.cooks)}
                      <span className="ml-1 text-amber-600">({formatNumber(u.completions)})</span>
                    </td>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatRelative(u.lastSeenAt, t, locale)}</td>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatShortDate(u.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} hrefFor={(n) => href({ page: n === 1 ? undefined : n })} />
      </Panel>
    </>
  );
}
