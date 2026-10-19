import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { BarList, EmptyState, PageHeader, Panel, StatTile, table } from "@/components/admin/ui";
import { getT } from "@/i18n/server";
import { RANGE_LABEL } from "@/lib/admin-stats";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { parseRange, DIRECT_SOURCE } from "@/server/admin";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { compareStudioPeriods, getRecipePerformance, getStudioSeries, getStudioSources } from "@/server/studio";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("adm.nav.stats"), robots: { index: false } };
}

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export default async function StudioStatsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const [user, t, sp] = await Promise.all([getCurrentUser(), getT(), searchParams]);
  if (!user) redirect("/auth/login?next=/dashboard/stats");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");

  const range = parseRange(sp.range);
  const [series, recipes, sources] = await Promise.all([getStudioSeries(creator.id, range * 2), getRecipePerformance(creator.id, range), getStudioSources(creator.id, range)]);
  const p = compareStudioPeriods(series, range);
  const rangeLabel = t(RANGE_LABEL[range]);

  const funnel = [
    { label: t("adm.funnel.viewed"), value: p.total("views") },
    { label: t("adm.funnel.saved"), value: p.total("saves") },
    { label: t("adm.funnel.started"), value: p.total("cooks") },
    { label: t("adm.funnel.finished"), value: p.total("completions") },
  ];
  const funnelMax = Math.max(...funnel.map((f) => f.value), 1);
  const charts = [
    { metric: "views", label: t("dash.col.views") },
    { metric: "saves", label: t("dash.col.saves") },
    { metric: "cooks", label: t("adm.tile.cooksStarted") },
    { metric: "completions", label: t("adm.chart.cooksDone") },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("adm.analysis")}
        title={t("adm.nav.stats")}
        description={t("studio.stats.desc", { range: rangeLabel })}
        actions={<RangeTabs base="/dashboard/stats" range={range} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("dash.col.views")} value={formatNumber(p.total("views"))} current={p.total("views")} previous={p.previousTotal("views")} series={p.values("views")} />
        <StatTile label={t("dash.col.saves")} value={formatNumber(p.total("saves"))} current={p.total("saves")} previous={p.previousTotal("saves")} series={p.values("saves")} />
        <StatTile label={t("adm.tile.cooksStarted")} value={formatNumber(p.total("cooks"))} current={p.total("cooks")} previous={p.previousTotal("cooks")} series={p.values("cooks")} />
        <StatTile label={t("studio.stats.sales")} value={formatNumber(p.total("sales"))} current={p.total("sales")} previous={p.previousTotal("sales")} series={p.values("sales")} hint={formatPrice(p.total("revenue"), "UZS", t)} />
      </div>

      <Panel className="mt-6" title={t("adm.funnelTitle")} description={t("adm.funnelNote")}>
        <ol className="space-y-5">
          {funnel.map((step, i) => (
            <li key={step.label} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 sm:grid-cols-[14rem_1fr_9rem]">
              <span className="text-sm font-medium text-amber-950">
                <span className="mr-2 tabular-nums text-amber-500">{i + 1}</span>
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
          <Panel key={c.metric} title={c.label} description={t("adm.chartTotal", { total: formatNumber(p.total(c.metric)), prev: formatNumber(p.previousTotal(c.metric)) })}>
            <TimeSeriesChart data={p.points(c.metric)} label={c.label} height={220} />
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={t("adm.recipePerf")} description={t("adm.recipePerfNote", { range: rangeLabel })} flush>
          {recipes.length === 0 ? (
            <EmptyState title={t("studio.empty")} text={t("studio.emptyText")} action={<Link href="/dashboard/recipes/new" className="font-medium text-amber-700 underline">{t("dash.createFirst")}</Link>} />
          ) : (
            <div className={table.wrap}>
              <table className={table.root}>
                <thead>
                  <tr>
                    <th className={table.th}>{t("dash.col.recipe")}</th>
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
                      <td className={table.td}>
                        <Link href={`/dashboard/recipes/${r.id}`} className="font-medium hover:text-amber-700 hover:underline">{r.title}</Link>
                      </td>
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
          )}
        </Panel>

        <Panel title={t("adm.sources")} description={t("adm.sourcesNote")}>
          <BarList empty={t("adm.noVisits")} items={sources.map((s) => ({ key: s.source ?? DIRECT_SOURCE, label: s.source ?? t("adm.direct"), value: s.views }))} />
          <p className="mt-5 text-xs leading-relaxed text-amber-600">
            {t("dash.viewsNote1")} <code>?src=instagram</code> {t("dash.viewsNote2")}
          </p>
        </Panel>
      </div>
    </div>
  );
}
