import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser, type CurrentUser } from "@/server/auth";

export async function getCreatorForUser(userId: string) {
  const [row] = await db.select().from(schema.creators).where(eq(schema.creators.userId, userId)).limit(1);
  return row ?? null;
}

/** Returns the signed-in user's creator profile, or null if they are not a creator. */
export async function getCurrentCreator(): Promise<{ user: CurrentUser; creator: typeof schema.creators.$inferSelect } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const creator = await getCreatorForUser(user.id);
  return creator ? { user, creator } : null;
}

export async function listCreatorRecipes(creatorId: string) {
  const rows = await db
    .select({
      id: schema.recipes.id,
      slug: schema.recipes.slug,
      title: schema.recipes.title,
      status: schema.recipes.status,
      isPremium: schema.recipes.isPremium,
      updatedAt: schema.recipes.updatedAt,
      views: sql<number>`(select count(*) from analytics_events e where e.recipe_id = recipes.id and e.name = 'recipe_view')`.mapWith(Number),
      saves: sql<number>`(select count(*) from saved_recipes s where s.recipe_id = recipes.id)`.mapWith(Number),
      cooks: sql<number>`(select count(*) from cooking_sessions c where c.recipe_id = recipes.id)`.mapWith(Number),
      completions: sql<number>`(select count(*) from cooking_sessions c where c.recipe_id = recipes.id and c.status = 'completed')`.mapWith(Number),
    })
    .from(schema.recipes)
    .where(eq(schema.recipes.creatorId, creatorId))
    .orderBy(desc(schema.recipes.updatedAt));
  return rows;
}
