import Link from "next/link";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { Avatar, BarList, PageHeader, Panel, StatTile, StatusPill } from "@/components/admin/ui";
import { RANGE_LABEL, comparePeriods } from "@/lib/admin-stats";
import { formatNumber, formatPrice, formatRelative } from "@/lib/format";
import { getDailySeries, getPlatformTotals, getRecentUsers, getSources, getTopRecipes, parseRange, requireAdminPage } from "@/server/admin";

const ROLE_LABEL = { user: "Foydalanuvchi", creator: "Ijodkor", admin: "Admin" } as const;

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const admin = await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const [series, totals, topRecipes, sources, recentUsers] = await Promise.all([
    getDailySeries(range * 2),
    getPlatformTotals(),
    getTopRecipes(range),
    getSources(range),
    getRecentUsers(),
  ]);
  const p = comparePeriods(series, range);

  const platform = [
    { label: "Foydalanuvchilar", value: totals.users, href: "/admin/users" },
    { label: "Ijodkorlar", value: totals.creators, href: "/admin/creators" },
    { label: "Nashr etilgan retseptlar", value: totals.published, href: "/admin/recipes?status=published" },
    { label: "Qoralamalar", value: totals.drafts, href: "/admin/recipes?status=draft" },
    { label: "Premium retseptlar", value: totals.premium, href: "/admin/recipes?type=premium" },
    { label: "Saqlashlar", value: totals.saves },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv paneli"
        title={`Xush kelibsiz, ${admin.name.split(" ")[0]}`}
        description={`Platformaning so‘nggi ${RANGE_LABEL[range]}dagi holati.`}
        actions={<RangeTabs base="/admin" range={range} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Ko‘rishlar" value={formatNumber(p.total("views"))} current={p.total("views")} previous={p.previousTotal("views")} series={p.values("views")} />
        <StatTile label="Yangi foydalanuvchilar" value={formatNumber(p.total("signups"))} current={p.total("signups")} previous={p.previousTotal("signups")} series={p.values("signups")} />
        <StatTile label="Pishirish boshlangan" value={formatNumber(p.total("cooks"))} current={p.total("cooks")} previous={p.previousTotal("cooks")} series={p.values("cooks")} />
        <StatTile label="Tugatish darajasi" value={String(p.completionRate)} suffix="%" current={p.completionRate} previous={p.previousCompletionRate} series={p.values("completions")} />
      </div>

      <Panel
        className="mt-6"
        title="Kunlik ko‘rishlar"
        description={`Retsept sahifalariga kirishlar, so‘nggi ${RANGE_LABEL[range]}`}
        action={<Link href={`/admin/analytics${range === 30 ? "" : `?range=${range}`}`} className="text-sm font-medium text-amber-700 hover:underline">Batafsil statistika →</Link>}
      >
        <TimeSeriesChart data={p.points("views")} label="Ko‘rishlar" />
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Eng ko‘p ko‘rilgan retseptlar" description={`So‘nggi ${RANGE_LABEL[range]}`}>
          <BarList
            empty="Bu davrda hali ko‘rishlar yo‘q."
            items={topRecipes.map((r) => ({ key: r.id, label: r.title, sublabel: r.creator, value: r.views, href: `/admin/recipes/${r.id}` }))}
          />
        </Panel>
        <Panel title="Trafik manbalari" description="Havoladagi ?src= belgisi bo‘yicha">
          <BarList empty="Bu davrda hali tashriflar yo‘q." items={sources.map((s) => ({ key: s.source, label: s.source, value: s.views }))} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Platforma jami" description="Butun davr uchun">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
            {platform.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-600">{item.label}</dt>
                <dd className="mt-1 font-serif text-3xl tabular-nums text-amber-950">
                  {item.href ? <Link href={item.href} className="hover:text-amber-700">{formatNumber(item.value)}</Link> : formatNumber(item.value)}
                </dd>
              </div>
            ))}
            <div className="col-span-2 border-t border-amber-100 pt-6 sm:col-span-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-600">Daromad (to‘langan xaridlar)</dt>
              <dd className="mt-1 font-serif text-3xl tabular-nums text-amber-950">{formatPrice(totals.revenue, "UZS")}</dd>
              <p className="mt-1 text-sm text-amber-600">
                {totals.paidPurchases > 0 ? `${formatNumber(totals.paidPurchases)} ta xarid` : "To‘lov tizimi hali ulanmagan."}
              </p>
            </div>
          </dl>
        </Panel>

        <Panel title="Yangi foydalanuvchilar" action={<Link href="/admin/users" className="text-sm font-medium text-amber-700 hover:underline">Barchasi →</Link>} flush>
          <ul className="divide-y divide-amber-100">
            {recentUsers.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/60 sm:px-6">
                  <Avatar name={u.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-amber-950">{u.name}</span>
                    <span className="block truncate text-xs text-amber-600">{u.email}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-amber-600 sm:block">{formatRelative(u.createdAt)}</span>
                  <StatusPill tone={u.role === "admin" ? "accent" : u.role === "creator" ? "good" : "neutral"}>{ROLE_LABEL[u.role]}</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
