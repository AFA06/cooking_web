import Link from "next/link";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { Avatar, BarList, PageHeader, Panel, StatTile, StatusPill } from "@/components/admin/ui";
import { RANGE_LABEL, comparePeriods } from "@/lib/admin-stats";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatPrice, formatRelative } from "@/lib/format";
import { countPendingApplications } from "@/server/applications";
import { DIRECT_SOURCE, getDailySeries, getPlatformTotals, getRecentUsers, getSources, getTopRecipes, parseRange, requireAdminPage } from "@/server/admin";

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const [admin, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const range = parseRange((await searchParams).range);
  const [series, totals, topRecipes, sources, recentUsers, pendingApplications] = await Promise.all([
    getDailySeries(range * 2),
    getPlatformTotals(),
    getTopRecipes(range),
    getSources(range),
    getRecentUsers(),
    countPendingApplications(),
  ]);
  const p = comparePeriods(series, range);
  const share = (n: number) => (totals.users === 0 ? 0 : Math.round((n / totals.users) * 100));

  const platform = [
    { label: t("adm.nav.users"), value: totals.users, href: "/admin/users" },
    { label: t("adm.nav.creators"), value: totals.creators, href: "/admin/creators" },
    { label: t("adm.publishedRecipes"), value: totals.published, href: "/admin/recipes?status=published" },
    { label: t("adm.drafts"), value: totals.drafts, href: "/admin/recipes?status=draft" },
    { label: t("adm.premiumRecipes"), value: totals.premium, href: "/admin/recipes?type=premium" },
    { label: t("dash.col.saves"), value: totals.saves },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("adm.dashEyebrow")}
        title={t("adm.welcome", { name: admin.name.split(" ")[0] })}
        description={t("adm.overviewDesc", { range: t(RANGE_LABEL[range]) })}
        actions={<RangeTabs base="/admin" range={range} />}
      />

      {pendingApplications > 0 && (
        <Link href="/admin/applications" className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-clay-400/50 bg-clay-100 px-5 py-4 text-amber-950 hover:border-clay-400">
          <span className="font-medium">{t("apply.adm.waiting", { count: pendingApplications })}</span>
          <span className="text-sm font-semibold text-amber-700">{t("apply.adm.review")} →</span>
        </Link>
      )}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">{t("adm.people")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("adm.tile.registered")} value={formatNumber(totals.users)} hint={t("adm.newToday", { count: formatNumber(totals.newToday) })} />
        <StatTile label={t("adm.tile.activeToday")} value={formatNumber(totals.activeToday)} hint={t("adm.ofUsers", { pct: share(totals.activeToday) })} />
        <StatTile label={t("adm.tile.active7")} value={formatNumber(totals.active7)} hint={t("adm.ofUsers", { pct: share(totals.active7) })} />
        <StatTile label={t("adm.tile.active30")} value={formatNumber(totals.active30)} hint={t("adm.ofUsers", { pct: share(totals.active30) })} />
      </div>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">{t("adm.activityRange", { range: t(RANGE_LABEL[range]) })}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("dash.col.views")} value={formatNumber(p.total("views"))} current={p.total("views")} previous={p.previousTotal("views")} series={p.values("views")} />
        <StatTile label={t("adm.tile.signups")} value={formatNumber(p.total("signups"))} current={p.total("signups")} previous={p.previousTotal("signups")} series={p.values("signups")} />
        <StatTile label={t("adm.tile.cooksStarted")} value={formatNumber(p.total("cooks"))} current={p.total("cooks")} previous={p.previousTotal("cooks")} series={p.values("cooks")} />
        <StatTile label={t("adm.tile.completionRate")} value={String(p.completionRate)} suffix="%" current={p.completionRate} previous={p.previousCompletionRate} series={p.values("completions")} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t("adm.dailyActive")} description={t("adm.dailyActiveNote")}>
          <TimeSeriesChart data={p.points("active")} label={t("adm.tile.activeToday")} height={220} />
        </Panel>
        <Panel
          title={t("adm.dailyViews")}
          description={t("adm.dailyViewsNote", { range: t(RANGE_LABEL[range]) })}
          action={<Link href={`/admin/analytics${range === 30 ? "" : `?range=${range}`}`} className="text-sm font-medium text-amber-700 hover:underline">{t("adm.moreStats")}</Link>}
        >
          <TimeSeriesChart data={p.points("views")} label={t("dash.col.views")} height={220} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t("adm.topViewed")} description={t("adm.lastRange", { range: t(RANGE_LABEL[range]) })}>
          <BarList
            empty={t("adm.noViews")}
            items={topRecipes.map((r) => ({ key: r.id, label: r.title, sublabel: r.creator, value: r.views, href: `/admin/recipes/${r.id}` }))}
          />
        </Panel>
        <Panel title={t("adm.sources")} description={t("adm.sourcesNote")}>
          <BarList empty={t("adm.noVisits")} items={sources.map((s) => ({ key: s.source, label: s.source === DIRECT_SOURCE ? t("adm.direct") : s.source, value: s.views }))} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={t("adm.platformTotal")} description={t("adm.allTime")}>
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
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-600">{t("adm.creatorSales")}</dt>
              <dd className="mt-1 font-serif text-3xl tabular-nums text-amber-950">{formatPrice(totals.revenue, "UZS", t)}</dd>
              <p className="mt-1 text-sm text-amber-600">
                {t("adm.salesNote", { paid: formatNumber(totals.paidPurchases), pending: formatNumber(totals.pendingOrders) })}
              </p>
            </div>
          </dl>
        </Panel>

        <Panel title={t("adm.tile.signups")} action={<Link href="/admin/users" className="text-sm font-medium text-amber-700 hover:underline">{t("adm.all")}</Link>} flush>
          <ul className="divide-y divide-amber-100">
            {recentUsers.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/60 sm:px-6">
                  <Avatar name={u.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-amber-950">{u.name}</span>
                    <span className="block truncate text-xs text-amber-600">{u.contact}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-amber-600 sm:block">{formatRelative(u.createdAt, t, locale)}</span>
                  <StatusPill tone={u.role === "admin" ? "accent" : u.role === "creator" ? "good" : "neutral"}>{t(`role.${u.role}`)}</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
