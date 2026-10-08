import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, EmptyState, PageHeader, Pagination, Panel, SearchForm, SegmentedLinks, StatusPill, table } from "@/components/admin/ui";
import { withQuery } from "@/lib/admin-stats";
import { formatNumber, formatRelative, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAGE_SIZE, listUsersAdmin, parsePage, requireAdminPage } from "@/server/admin";

export const metadata: Metadata = { title: "Foydalanuvchilar" };

const ROLES = [
  { value: "all", label: "Barchasi" },
  { value: "user", label: "Foydalanuvchi" },
  { value: "creator", label: "Ijodkor" },
  { value: "admin", label: "Admin" },
];
const ROLE_LABEL = { user: "Foydalanuvchi", creator: "Ijodkor", admin: "Admin" } as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const role = ROLES.some((r) => r.value === sp.role) ? sp.role! : "all";
  const page = parsePage(sp.page);
  const { items, total } = await listUsersAdmin({ q, role, page });
  const href = (over: Record<string, string | number | undefined>) => withQuery("/admin/users", { q, role, ...over });

  return (
    <>
      <PageHeader eyebrow="Boshqaruv" title="Foydalanuvchilar" description="Hisoblar, rollar va faollik." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm action="/admin/users" defaultValue={q} placeholder="Ism yoki email bo‘yicha qidirish" hidden={{ role: role === "all" ? undefined : role }} />
        <SegmentedLinks label="Rol" items={ROLES.map((r) => ({ href: href({ role: r.value, page: undefined }), label: r.label, active: r.value === role }))} />
      </div>

      <Panel flush>
        {items.length === 0 ? (
          <EmptyState title="Foydalanuvchilar topilmadi" text="Qidiruv yoki filtrni o‘zgartirib ko‘ring." />
        ) : (
          <div className={table.wrap}>
            <table className={table.root}>
              <thead>
                <tr>
                  <th className={table.th}>Foydalanuvchi</th>
                  <th className={table.th}>Rol</th>
                  <th className={cn(table.th, table.thNum)}>Saqlashlar</th>
                  <th className={cn(table.th, table.thNum)}>Pishirishlar</th>
                  <th className={table.th}>Oxirgi kirish</th>
                  <th className={table.th}>Ro‘yxatdan o‘tgan</th>
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
                      <StatusPill tone={u.role === "admin" ? "accent" : u.role === "creator" ? "good" : "neutral"}>{ROLE_LABEL[u.role]}</StatusPill>
                    </td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(u.saves)}</td>
                    <td className={cn(table.td, table.tdNum)}>
                      {formatNumber(u.cooks)}
                      <span className="ml-1 text-amber-600">({formatNumber(u.completions)})</span>
                    </td>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatRelative(u.lastSeenAt)}</td>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatShortDate(u.createdAt)}</td>
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
