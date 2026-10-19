import type { Metadata } from "next";
import Link from "next/link";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { PageHeader, Panel, table } from "@/components/admin/ui";
import { RANGE_LABEL, comparePeriods } from "@/lib/admin-stats";
import { getLocale, getT } from "@/i18n/server";
import { formatDayKey, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getDailySeries, getTopRecipes, listCreatorsAdmin, parseRange, requireAdminPage } from "@/server/admin";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("adm.nav.stats") };
}

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const [, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const range = parseRange((await searchParams).range);
  const [series, recipes, creators] = await Promise.all([getDailySeries(range * 2), getTopRecipes(range, 15), listCreatorsAdmin()]);
  const p = comparePeriods(series, range);

  const funnel = [
    { label: t("adm.funnel.viewed"), value: p.total("views") },
    { label: t("adm.funnel.saved"), value: p.total("saves") },
    { label: t("adm.funnel.started"), value: p.total("cooks") },
    { label: t("adm.funnel.finished"), value: p.total("completions") },
  ];
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1);

  const charts = [
    { metric: "active", label: t("adm.dailyActive") },
    { metric: "views", label: t("dash.col.views") },
    { metric: "signups", label: t("adm.chart.signups") },
    { metric: "cooks", label: t("adm.tile.cooksStarted") },
    { metric: "completions", label: t("adm.chart.cooksDone") },
    { metric: "saves", label: t("dash.col.saves") },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow={t("adm.analysis")}
        title={t("adm.nav.stats")}
        description={t("adm.statsDesc", { range: t(RANGE_LABEL[range]) })}
        actions={<RangeTabs base="/admin/analytics" range={range} />}
      />

      <Panel title={t("adm.funnelTitle")} description={t("adm.funnelNote")}>
        <ol className="space-y-5">
          {funnel.map((step, i) => (
            <li key={step.label} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 sm:grid-cols-[14rem_1fr_9rem]">
              <span className="text-sm font-medium text-amber-950">
                <span className="mr-2 text-amber-500 tabular-nums">{i + 1}</span>
                {step.label}
              </span>
              <div className="h-7 overflow-hidden rounded bg-amber-100">
                <div className="h-full rounded bg-amber-700" style={{ width: `${Math.max((step.value / funnelMax) * 100, step.value > 0 ? 1.5 : 0)}%` }} />
              </div>
              <span className="text-sm tabular-nums text-amber-950 sm:text-right">
                <span className="font-semibold">{formatNumber(step.value)}</span>
                {i > 0 && <span className="ml-2 text-amber-600">{percent(step.value, funnel[i - 1].value)}%</span>}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs text-amber-600">{t("adm.funnelFoot")}</p>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {charts.map((c) => (
          <Panel key={c.metric} title={c.label} description={c.metric === "active" ? t("adm.dailyActiveNote") : t("adm.chartTotal", { total: formatNumber(p.total(c.metric)), prev: formatNumber(p.previousTotal(c.metric)) })}>
            <TimeSeriesChart data={p.points(c.metric)} label={c.label} height={220} />
          </Panel>
        ))}
      </div>

      <Panel className="mt-6" title={t("adm.recipePerf")} description={t("adm.recipePerfNote", { range: t(RANGE_LABEL[range]) })} flush>
        <div className={table.wrap}>
          <table className={table.root}>
            <thead>
              <tr>
                <th className={table.th}>{t("dash.col.recipe")}</th>
                <th className={table.th}>{t("role.creator")}</th>
                <th className={cn(table.th, table.thNum)}>{t("dash.col.views")}</th>
                <th className={cn(table.th, table.thNum)}>{t("dash.col.saves")}</th>
                <th className={cn(table.th, table.thNum)}>{t("account.started")}</th>
                <th className={cn(table.th, table.thNum)}>{t("account.completed")}</th>
                <th className={cn(table.th, table.thNum)}>{t("adm.completion")}</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className={table.tr}>
                  <td className={table.td}><Link href={`/admin/recipes/${r.id}`} className="font-medium hover:text-amber-700 hover:underline">{r.title}</Link></td>
                  <td className={table.td}><Link href={`/admin/creators/${r.creatorId}`} className="text-amber-900 hover:underline">{r.creator}</Link></td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(r.views)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(r.saves)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(r.cooks)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(r.completions)}</td>
                  <td className={cn(table.td, table.tdNum)}>{r.cooks > 0 ? `${percent(r.completions, r.cooks)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-6" title={t("adm.creatorRank")} description={t("adm.rankNote")} flush>
        <div className={table.wrap}>
          <table className={table.root}>
            <thead>
              <tr>
                <th className={table.th}>{t("role.creator")}</th>
                <th className={cn(table.th, table.thNum)}>{t("nav.recipes")}</th>
                <th className={cn(table.th, table.thNum)}>{t("dash.col.views")}</th>
                <th className={cn(table.th, table.thNum)}>{t("dash.col.saves")}</th>
                <th className={cn(table.th, table.thNum)}>{t("adm.cooks")}</th>
                <th className={cn(table.th, table.thNum)}>{t("adm.completion")}</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c, i) => (
                <tr key={c.id} className={table.tr}>
                  <td className={table.td}>
                    <span className="mr-3 inline-block w-5 text-amber-500 tabular-nums">{i + 1}</span>
                    <Link href={`/admin/creators/${c.id}`} className="font-medium hover:text-amber-700 hover:underline">{c.name}</Link>
                  </td>
                  <td className={cn(table.td, table.tdNum)}>{c.published} / {c.recipes}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(c.views)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(c.saves)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(c.cooks)}</td>
                  <td className={cn(table.td, table.tdNum)}>{c.cooks > 0 ? `${percent(c.completions, c.cooks)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <details className="mt-6 rounded-lg border border-amber-200 bg-amber-100">
        <summary className="px-5 py-4 font-serif text-xl font-medium text-amber-950 sm:px-6">{t("adm.dailyTable")}</summary>
        <div className={cn(table.wrap, "border-t border-amber-100")}>
          <table className={table.root}>
            <thead>
              <tr>
                <th className={table.th}>{t("adm.day")}</th>
                <th className={cn(table.th, table.thNum)}>{t("dash.col.views")}</th>
                <th className={cn(table.th, table.thNum)}>{t("adm.signupsCol")}</th>
                <th className={cn(table.th, table.thNum)}>{t("dash.col.saves")}</th>
                <th className={cn(table.th, table.thNum)}>{t("account.started")}</th>
                <th className={cn(table.th, table.thNum)}>{t("account.completed")}</th>
              </tr>
            </thead>
            <tbody>
              {[...p.current].reverse().map((d) => (
                <tr key={d.day} className={table.tr}>
                  <td className={table.td}>{formatDayKey(d.day, locale)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(d.views)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(d.signups)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(d.saves)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(d.cooks)}</td>
                  <td className={cn(table.td, table.tdNum)}>{formatNumber(d.completions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
