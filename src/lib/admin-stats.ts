import type { DayPoint } from "@/server/admin";

type Metric = Exclude<keyof DayPoint, "day">;

/** Builds a URL with only the defined, non-default query parameters. */
export function withQuery(base: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== "all") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

/** Splits a series covering two equal periods into totals for the current and the previous one. */
export function comparePeriods(series: DayPoint[], days: number) {
  const current = series.slice(-days);
  const previous = series.slice(0, Math.max(series.length - days, 0));
  const sum = (rows: DayPoint[], metric: Metric) => rows.reduce((total, row) => total + row[metric], 0);
  const rate = (rows: DayPoint[]) => {
    const cooks = sum(rows, "cooks");
    return cooks === 0 ? 0 : Math.round((sum(rows, "completions") / cooks) * 100);
  };
  return {
    current,
    total: (metric: Metric) => sum(current, metric),
    previousTotal: (metric: Metric) => sum(previous, metric),
    values: (metric: Metric) => current.map((row) => row[metric]),
    points: (metric: Metric) => current.map((row) => ({ day: row.day, value: row[metric] })),
    completionRate: rate(current),
    previousCompletionRate: rate(previous),
  };
}

export const RANGE_LABEL: Record<number, string> = { 7: "7 kun", 30: "30 kun", 90: "90 kun" };
