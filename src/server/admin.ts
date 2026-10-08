import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser, type CurrentUser } from "@/server/auth";

const TZ = "Asia/Tashkent";
export const PAGE_SIZE = 20;
export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: string | undefined): Range {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

export function parsePage(value: string | undefined): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Page guard: sends visitors to login, hides the panel from non-admins. */
export async function requireAdminPage(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/admin");
  if (user.role !== "admin") notFound();
  return user;
}

async function rows<T>(query: SQL): Promise<T[]> {
  const result = await db.execute(query);
  return result.rows as T[];
}

const num = (v: unknown) => Number(v ?? 0);
const like = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;

export interface DayPoint {
  day: string;
  views: number;
  signups: number;
  saves: number;
  cooks: number;
  completions: number;
}

/** One row per calendar day (Tashkent time), oldest first, including empty days. */
export async function getDailySeries(days: number): Promise<DayPoint[]> {
  const local = (col: SQL) => sql`(${col} at time zone ${TZ})::date`;
  const data = await rows<Record<keyof DayPoint, string>>(sql`
    with days as (
      select generate_series(
        (now() at time zone ${TZ})::date - ${days - 1}::int,
        (now() at time zone ${TZ})::date,
        interval '1 day'
      )::date as d
    )
    select to_char(d, 'YYYY-MM-DD') as day,
      (select count(*) from analytics_events e where e.name = 'recipe_view' and ${local(sql`e.created_at`)} = d) as views,
      (select count(*) from users u where ${local(sql`u.created_at`)} = d) as signups,
      (select count(*) from saved_recipes s where ${local(sql`s.created_at`)} = d) as saves,
      (select count(*) from cooking_sessions c where ${local(sql`c.started_at`)} = d) as cooks,
      (select count(*) from cooking_sessions c where c.status = 'completed' and ${local(sql`c.completed_at`)} = d) as completions
    from days order by d
  `);
  return data.map((r) => ({
    day: r.day,
    views: num(r.views),
    signups: num(r.signups),
    saves: num(r.saves),
    cooks: num(r.cooks),
    completions: num(r.completions),
  }));
}

export interface PlatformTotals {
  users: number;
  creators: number;
  published: number;
  drafts: number;
  premium: number;
  saves: number;
  views: number;
  cooks: number;
  completions: number;
  revenue: number;
  paidPurchases: number;
}

export async function getPlatformTotals(): Promise<PlatformTotals> {
  const [r] = await rows<Record<keyof PlatformTotals, string>>(sql`
    select
      (select count(*) from users) as users,
      (select count(*) from creators) as creators,
      (select count(*) from recipes where status = 'published') as published,
      (select count(*) from recipes where status = 'draft') as drafts,
      (select count(*) from recipes where is_premium) as premium,
      (select count(*) from saved_recipes) as saves,
      (select count(*) from analytics_events where name = 'recipe_view') as views,
      (select count(*) from cooking_sessions) as cooks,
      (select count(*) from cooking_sessions where status = 'completed') as completions,
      (select coalesce(sum(amount), 0) from purchases where status = 'paid') as revenue,
      (select count(*) from purchases where status = 'paid') as "paidPurchases"
  `);
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, num(v)])) as unknown as PlatformTotals;
}

export interface RecipeStat {
  id: string;
  slug: string;
  title: string;
  creator: string;
  creatorId: string;
  status: "draft" | "published";
  isPremium: boolean;
  isFeatured: boolean;
  priceAmount: number | null;
  updatedAt: string;
  views: number;
  saves: number;
  cooks: number;
  completions: number;
}

type RecipeStatRow = Omit<RecipeStat, "views" | "saves" | "cooks" | "completions" | "priceAmount"> &
  Record<"views" | "saves" | "cooks" | "completions" | "priceAmount", string | null>;

const toRecipeStat = (r: RecipeStatRow): RecipeStat => ({
  ...r,
  priceAmount: r.priceAmount === null ? null : num(r.priceAmount),
  views: num(r.views),
  saves: num(r.saves),
  cooks: num(r.cooks),
  completions: num(r.completions),
});

function recipeStatSelect(days: number | null): SQL {
  const since = (col: SQL) => (days === null ? sql`true` : sql`${col} > now() - make_interval(days => ${days}::int)`);
  return sql`
    select r.id, r.slug, r.title, r.status, r.is_premium as "isPremium", r.is_featured as "isFeatured",
      r.price_amount as "priceAmount", r.updated_at as "updatedAt", c.name as creator, c.id as "creatorId",
      (select count(*) from analytics_events e where e.recipe_id = r.id and e.name = 'recipe_view' and ${since(sql`e.created_at`)}) as views,
      (select count(*) from saved_recipes s where s.recipe_id = r.id and ${since(sql`s.created_at`)}) as saves,
      (select count(*) from cooking_sessions k where k.recipe_id = r.id and ${since(sql`k.started_at`)}) as cooks,
      (select count(*) from cooking_sessions k where k.recipe_id = r.id and k.status = 'completed' and ${since(sql`k.started_at`)}) as completions
    from recipes r join creators c on c.id = r.creator_id`;
}

export async function getTopRecipes(days: number, limit = 6): Promise<RecipeStat[]> {
  const data = await rows<RecipeStatRow>(sql`${recipeStatSelect(days)} order by views desc, r.title limit ${limit}`);
  return data.map(toRecipeStat);
}

export async function getRecipeStat(id: string): Promise<RecipeStat | null> {
  const data = await rows<RecipeStatRow>(sql`${recipeStatSelect(null)} where r.id = ${id} limit 1`);
  return data[0] ? toRecipeStat(data[0]) : null;
}

export interface RecipeFilter {
  q?: string;
  status?: string;
  type?: string;
  creatorId?: string;
  page?: number;
}

export async function listRecipesAdmin(f: RecipeFilter): Promise<{ items: RecipeStat[]; total: number }> {
  const where = sql`where true
    ${f.q ? sql`and (r.title ilike ${like(f.q)} or c.name ilike ${like(f.q)})` : sql``}
    ${f.status === "published" || f.status === "draft" ? sql`and r.status = ${f.status}` : sql``}
    ${f.type === "premium" ? sql`and r.is_premium` : f.type === "free" ? sql`and not r.is_premium` : sql``}
    ${f.creatorId ? sql`and r.creator_id = ${f.creatorId}` : sql``}`;
  const offset = ((f.page ?? 1) - 1) * PAGE_SIZE;
  const [items, [count]] = await Promise.all([
    rows<RecipeStatRow>(sql`${recipeStatSelect(null)} ${where} order by r.updated_at desc limit ${PAGE_SIZE} offset ${offset}`),
    rows<{ n: string }>(sql`select count(*) as n from recipes r join creators c on c.id = r.creator_id ${where}`),
  ]);
  return { items: items.map(toRecipeStat), total: num(count.n) };
}

export interface SourceStat {
  source: string;
  views: number;
}

export async function getSources(days: number, limit = 8): Promise<SourceStat[]> {
  const data = await rows<{ source: string | null; views: string }>(sql`
    select nullif(trim(source), '') as source, count(*) as views
    from analytics_events
    where name = 'recipe_view' and created_at > now() - make_interval(days => ${days}::int)
    group by 1 order by 2 desc limit ${limit}`);
  return data.map((r) => ({ source: r.source ?? "To‘g‘ridan-to‘g‘ri", views: num(r.views) }));
}

export interface CreatorStat {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  isFoundingCreator: boolean;
  isFeatured: boolean;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  recipes: number;
  published: number;
  views: number;
  saves: number;
  cooks: number;
  completions: number;
}

type CreatorStatRow = Omit<CreatorStat, "recipes" | "published" | "views" | "saves" | "cooks" | "completions"> &
  Record<"recipes" | "published" | "views" | "saves" | "cooks" | "completions", string>;

const toCreatorStat = (r: CreatorStatRow): CreatorStat => ({
  ...r,
  recipes: num(r.recipes),
  published: num(r.published),
  views: num(r.views),
  saves: num(r.saves),
  cooks: num(r.cooks),
  completions: num(r.completions),
});

const CREATOR_STAT_SELECT = sql`
  select c.id, c.slug, c.name, c.bio, c.avatar_url as "avatarUrl", c.is_founding_creator as "isFoundingCreator",
    c.is_featured as "isFeatured", c.created_at as "createdAt", c.user_id as "userId", u.email as "userEmail",
    (select count(*) from recipes r where r.creator_id = c.id) as recipes,
    (select count(*) from recipes r where r.creator_id = c.id and r.status = 'published') as published,
    (select count(*) from analytics_events e where e.creator_id = c.id and e.name = 'recipe_view') as views,
    (select count(*) from saved_recipes s join recipes r on r.id = s.recipe_id where r.creator_id = c.id) as saves,
    (select count(*) from cooking_sessions k join recipes r on r.id = k.recipe_id where r.creator_id = c.id) as cooks,
    (select count(*) from cooking_sessions k join recipes r on r.id = k.recipe_id where r.creator_id = c.id and k.status = 'completed') as completions
  from creators c left join users u on u.id = c.user_id`;

export async function listCreatorsAdmin(q?: string): Promise<CreatorStat[]> {
  const data = await rows<CreatorStatRow>(sql`${CREATOR_STAT_SELECT}
    ${q ? sql`where c.name ilike ${like(q)} or c.slug ilike ${like(q)} or u.email ilike ${like(q)}` : sql``}
    order by views desc, c.name`);
  return data.map(toCreatorStat);
}

export async function getCreatorAdmin(id: string): Promise<CreatorStat | null> {
  const data = await rows<CreatorStatRow>(sql`${CREATOR_STAT_SELECT} where c.id = ${id} limit 1`);
  return data[0] ? toCreatorStat(data[0]) : null;
}

export interface UserStat {
  id: string;
  name: string;
  email: string;
  role: "user" | "creator" | "admin";
  createdAt: string;
  lastSeenAt: string | null;
  saves: number;
  cooks: number;
  completions: number;
  creatorId: string | null;
  creatorName: string | null;
}

type UserStatRow = Omit<UserStat, "saves" | "cooks" | "completions"> & Record<"saves" | "cooks" | "completions", string>;

const toUserStat = (r: UserStatRow): UserStat => ({ ...r, saves: num(r.saves), cooks: num(r.cooks), completions: num(r.completions) });

const USER_STAT_SELECT = sql`
  select u.id, u.name, u.email, u.role, u.created_at as "createdAt",
    (select max(s.created_at) from sessions s where s.user_id = u.id) as "lastSeenAt",
    (select count(*) from saved_recipes s where s.user_id = u.id) as saves,
    (select count(*) from cooking_sessions k where k.user_id = u.id) as cooks,
    (select count(*) from cooking_sessions k where k.user_id = u.id and k.status = 'completed') as completions,
    c.id as "creatorId", c.name as "creatorName"
  from users u left join creators c on c.user_id = u.id`;

export async function listUsersAdmin(f: { q?: string; role?: string; page?: number }): Promise<{ items: UserStat[]; total: number }> {
  const where = sql`where true
    ${f.q ? sql`and (u.name ilike ${like(f.q)} or u.email ilike ${like(f.q)})` : sql``}
    ${f.role === "user" || f.role === "creator" || f.role === "admin" ? sql`and u.role = ${f.role}` : sql``}`;
  const offset = ((f.page ?? 1) - 1) * PAGE_SIZE;
  const [items, [count]] = await Promise.all([
    rows<UserStatRow>(sql`${USER_STAT_SELECT} ${where} order by u.created_at desc limit ${PAGE_SIZE} offset ${offset}`),
    rows<{ n: string }>(sql`select count(*) as n from users u ${where}`),
  ]);
  return { items: items.map(toUserStat), total: num(count.n) };
}

export async function getUserAdmin(id: string): Promise<UserStat | null> {
  const data = await rows<UserStatRow>(sql`${USER_STAT_SELECT} where u.id = ${id} limit 1`);
  return data[0] ? toUserStat(data[0]) : null;
}

export interface UserActivity {
  kind: "save" | "cook_start" | "cook_done";
  at: string;
  recipeTitle: string;
  recipeSlug: string;
}

export async function getUserActivity(userId: string, limit = 25): Promise<UserActivity[]> {
  return rows<UserActivity>(sql`
    select * from (
      select 'save' as kind, s.created_at as at, r.title as "recipeTitle", r.slug as "recipeSlug"
        from saved_recipes s join recipes r on r.id = s.recipe_id where s.user_id = ${userId}
      union all
      select 'cook_start', k.started_at, r.title, r.slug
        from cooking_sessions k join recipes r on r.id = k.recipe_id where k.user_id = ${userId}
      union all
      select 'cook_done', k.completed_at, r.title, r.slug
        from cooking_sessions k join recipes r on r.id = k.recipe_id where k.user_id = ${userId} and k.completed_at is not null
    ) a order by at desc limit ${limit}`);
}

export interface PurchaseRow {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: string | null;
  createdAt: string;
  userEmail: string;
  recipeTitle: string;
  creatorName: string;
}

export async function listPurchasesAdmin(page: number): Promise<{ items: PurchaseRow[]; total: number }> {
  const offset = (page - 1) * PAGE_SIZE;
  const [items, [count]] = await Promise.all([
    rows<Omit<PurchaseRow, "amount"> & { amount: string }>(sql`
      select p.id, p.amount, p.currency, p.status, p.provider, p.created_at as "createdAt",
        u.email as "userEmail", r.title as "recipeTitle", c.name as "creatorName"
      from purchases p
        join users u on u.id = p.user_id
        join recipes r on r.id = p.recipe_id
        join creators c on c.id = r.creator_id
      order by p.created_at desc limit ${PAGE_SIZE} offset ${offset}`),
    rows<{ n: string }>(sql`select count(*) as n from purchases`),
  ]);
  return { items: items.map((p) => ({ ...p, amount: num(p.amount) })), total: num(count.n) };
}

export async function getRecentUsers(limit = 6): Promise<Pick<UserStat, "id" | "name" | "email" | "role" | "createdAt">[]> {
  return rows(sql`select id, name, email, role, created_at as "createdAt" from users order by created_at desc limit ${limit}`);
}
