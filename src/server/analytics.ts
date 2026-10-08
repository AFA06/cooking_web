import "server-only";
import { db, schema } from "@/db";

export type AnalyticsEventName = "recipe_view" | "creator_view" | "start_cooking" | "finish_cooking" | "recipe_save";

export async function trackEvent(event: {
  name: AnalyticsEventName;
  userId?: string | null;
  recipeId?: string | null;
  creatorId?: string | null;
  source?: string | null;
}): Promise<void> {
  try {
    await db.insert(schema.analyticsEvents).values({
      name: event.name,
      userId: event.userId ?? null,
      recipeId: event.recipeId ?? null,
      creatorId: event.creatorId ?? null,
      source: event.source?.slice(0, 80) ?? null,
    });
  } catch (error) {
    console.error("analytics event failed", error);
  }
}
