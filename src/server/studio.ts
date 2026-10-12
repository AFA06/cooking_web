import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { PLATFORM_CONFIG } from "@/lib/constants";

const TZ = "Asia/Tashkent";
const num = (v: unknown) => Number(v ?? 0);

async function rows<T>(query: SQL): Promise<T[]> {
  const result = await db.execute(query);
  return result.rows as T[];
}

/** Share of each sale the platform keeps: nothing for founding creators, otherwise the standard rate. */
export const commissionRate = (isFounding: boolean) =>
  isFounding ? PLATFORM_CONFIG.creator.foundingCommissionRate : PLATFORM_CONFIG.creator.standardCommissionRate;

export interface StudioDay {
  day: string;
  views: number;
  saves: number;
  cooks: number;
  completions: number;
  sales: number;
  revenue: number;
}

/** One row per calendar day (Tashkent time), oldest first, for this creator's recipes only. */
export async function getStudioSeries(creatorId: string, days: number): Promise<StudioDay[]> {
  const local = (col: SQL) => sql`(${col} at time zone ${TZ})::date`;
  const data = await rows<Record<keyof StudioDay, string>>(sql`
    with days as (
      select generate_series(
        (now() at time zone ${TZ})::date - ${days - 1}::int,
        (now() at time zone ${TZ})::date,
        interval '1 day'
      )::date as d
    ),
    own as (select id from recipes where creator_id = ${creatorId})
    select to_char(d, 'YYYY-MM-DD') as day,
      (select count(*) from analytics_events e where e.name = 'recipe_view' and e.recipe_id in (select id from own) and ${local(sql`e.created_at`)} = d) as views,
      (select count(*) from saved_recipes s where s.recipe_id in (select id from own) and ${local(sql`s.created_at`)} = d) as saves,
      (select count(*) from cooking_sessions c where c.recipe_id in (select id from own) and ${local(sql`c.started_at`)} = d) as cooks,
      (select count(*) from cooking_sessions c where c.recipe_id in (select id from own) and c.status = 'completed' and ${local(sql`c.completed_at`)} = d) as completions,
      (select count(*) from purchases p where p.recipe_id in (select id from own) and p.status = 'paid' and ${local(sql`p.created_at`)} = d) as sales,
      (select coalesce(sum(p.amount), 0) from purchases p where p.recipe_id in (select id from own) and p.status = 'paid' and ${local(sql`p.created_at`)} = d) as revenue
    from days order by d
  `);
  return data.map((r) => ({
    day: r.day,
    views: num(r.views),
    saves: num(r.saves),
    cooks: num(r.cooks),
    completions: num(r.completions),
    sales: num(r.sales),
    revenue: num(r.revenue),
  }));
}

type Metric = Exclude<keyof StudioDay, "day">;

/** Splits a series covering two equal periods into totals for the current and the previous one. */
export function compareStudioPeriods(series: StudioDay[], days: number) {
  const current = series.slice(-days);
  const previous = series.slice(0, Math.max(series.length - days, 0));
  const sum = (list: StudioDay[], metric: Metric) => list.reduce((total, row) => total + row[metric], 0);
  return {
    current,
    total: (metric: Metric) => sum(current, metric),
    previousTotal: (metric: Metric) => sum(previous, metric),
    values: (metric: Metric) => current.map((row) => row[metric]),
    points: (metric: Metric) => current.map((row) => ({ day: row.day, value: row[metric] })),
  };
}

export interface StudioTotals {
  recipes: number;
  published: number;
  premium: number;
  revenue: number;
  orders: number;
  buyers: number;
}

export async function getStudioTotals(creatorId: string): Promise<StudioTotals> {
  const [r] = await rows<Record<keyof StudioTotals, string>>(sql`
    select
      (select count(*) from recipes where creator_id = ${creatorId}) as recipes,
      (select count(*) from recipes where creator_id = ${creatorId} and status = 'published') as published,
      (select count(*) from recipes where creator_id = ${creatorId} and is_premium) as premium,
      (select coalesce(sum(p.amount), 0) from purchases p join recipes r on r.id = p.recipe_id where r.creator_id = ${creatorId} and p.status = 'paid') as revenue,
      (select count(*) from purchases p join recipes r on r.id = p.recipe_id where r.creator_id = ${creatorId} and p.status = 'paid') as orders,
      (select count(distinct p.user_id) from purchases p join recipes r on r.id = p.recipe_id where r.creator_id = ${creatorId} and p.status = 'paid') as buyers
  `);
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, num(v)])) as unknown as StudioTotals;
}

export interface RecipePerformance {
  id: string;
  title: string;
  isPremium: boolean;
  priceAmount: number | null;
  views: number;
  saves: number;
  cooks: number;
  completions: number;
  sold: number;
  revenue: number;
}

/** Every recipe of the creator with its results inside the last `days` days (sales: all time when days is null). */
export async function getRecipePerformance(creatorId: string, days: number | null): Promise<RecipePerformance[]> {
  const since = days === null ? sql`'-infinity'::timestamptz` : sql`now() - (${days}::int * interval '1 day')`;
  const data = await rows<Record<keyof RecipePerformance, string>>(sql`
    select r.id, r.title, r.is_premium as "isPremium", r.price_amount as "priceAmount",
      (select count(*) from analytics_events e where e.recipe_id = r.id and e.name = 'recipe_view' and e.created_at >= ${since}) as views,
      (select count(*) from saved_recipes s where s.recipe_id = r.id and s.created_at >= ${since}) as saves,
      (select count(*) from cooking_sessions c where c.recipe_id = r.id and c.started_at >= ${since}) as cooks,
      (select count(*) from cooking_sessions c where c.recipe_id = r.id and c.status = 'completed' and c.completed_at >= ${since}) as completions,
      (select count(*) from purchases p where p.recipe_id = r.id and p.status = 'paid' and p.created_at >= ${since}) as sold,
      (select coalesce(sum(p.amount), 0) from purchases p where p.recipe_id = r.id and p.status = 'paid' and p.created_at >= ${since}) as revenue
    from recipes r where r.creator_id = ${creatorId}
    order by views desc, r.updated_at desc
  `);
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    isPremium: r.isPremium as unknown as boolean,
    priceAmount: r.priceAmount === null ? null : num(r.priceAmount),
    views: num(r.views),
    saves: num(r.saves),
    cooks: num(r.cooks),
    completions: num(r.completions),
    sold: num(r.sold),
    revenue: num(r.revenue),
  }));
}

export async function getStudioSources(creatorId: string, days: number, limit = 8): Promise<{ source: string | null; views: number }[]> {
  const data = await rows<{ source: string | null; views: string }>(sql`
    select e.source, count(*) as views
    from analytics_events e join recipes r on r.id = e.recipe_id
    where r.creator_id = ${creatorId} and e.name = 'recipe_view' and e.created_at >= now() - (${days}::int * interval '1 day')
    group by e.source order by views desc limit ${limit}
  `);
  return data.map((r) => ({ source: r.source, views: num(r.views) }));
}

export interface StudioPurchase {
  id: string;
  buyer: string;
  recipeTitle: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  createdAt: string;
}

/** Newest first. Buyers appear as a first name and an initial: enough to thank them, not to track them. */
export async function listStudioPurchases(creatorId: string, limit = 25): Promise<StudioPurchase[]> {
  const data = await rows<{ id: string; name: string; recipeTitle: string; amount: string; currency: string; status: StudioPurchase["status"]; createdAt: string }>(sql`
    select p.id, u.name, r.title as "recipeTitle", p.amount, p.currency, p.status, p.created_at as "createdAt"
    from purchases p join recipes r on r.id = p.recipe_id join users u on u.id = p.user_id
    where r.creator_id = ${creatorId}
    order by p.created_at desc limit ${limit}
  `);
  return data.map((r) => {
    const [first = "", second = ""] = r.name.trim().split(/\s+/);
    return {
      id: r.id,
      buyer: second ? `${first} ${second.slice(0, 1).toUpperCase()}.` : first,
      recipeTitle: r.recipeTitle,
      amount: num(r.amount),
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt,
    };
  });
}
