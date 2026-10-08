import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db, schema } = await import("../src/db");
  const { CREATORS, RECIPES } = await import("../src/db/seed-data");
  const { eq } = await import("drizzle-orm");

  // Remove the previous (English) demo creators; their recipes cascade.
  const { inArray } = await import("drizzle-orm");
  await db.delete(schema.creators).where(inArray(schema.creators.slug, ["aziza-kitchen", "bekzod-cooks", "feruzas-table"]));

  const creatorIds = new Map<string, string>();
  for (const c of CREATORS) {
    const [row] = await db
      .insert(schema.creators)
      .values({ slug: c.slug, name: c.name, bio: c.bio, avatarUrl: c.avatarUrl, isFoundingCreator: c.isFoundingCreator })
      .onConflictDoUpdate({ target: schema.creators.slug, set: { name: c.name, bio: c.bio, avatarUrl: c.avatarUrl } })
      .returning({ id: schema.creators.id });
    creatorIds.set(c.slug, row.id);
  }

  for (const [idx, r] of RECIPES.entries()) {
    const values = {
      slug: r.slug,
      creatorId: creatorIds.get(r.creator.slug)!,
      title: r.title,
      description: r.description,
      coverUrl: r.coverMedia.url,
      coverAlt: r.coverMedia.alt,
      servings: r.servings,
      prepTimeMinutes: r.prepTimeMinutes,
      cookTimeMinutes: r.cookTimeMinutes,
      difficulty: r.difficulty,
      isPremium: r.isPremium,
      priceAmount: r.price ?? null,
      priceCurrency: r.price ? (r.currency ?? "UZS") : null,
      tags: r.tags,
      status: "published" as const,
      isFeatured: idx < 6,
      publishedAt: new Date(r.publishedAt),
    };
    const [row] = await db
      .insert(schema.recipes)
      .values(values)
      .onConflictDoUpdate({ target: schema.recipes.slug, set: { ...values, updatedAt: new Date() } })
      .returning({ id: schema.recipes.id });

    await db.delete(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, row.id));
    await db.delete(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, row.id));
    await db.insert(schema.recipeIngredients).values(
      r.ingredients.map((i) => ({ recipeId: row.id, position: i.order, name: i.name, quantity: i.quantity, unit: i.unit, notes: i.notes })),
    );
    await db.insert(schema.recipeSteps).values(
      r.steps.map((s) => ({
        recipeId: row.id,
        position: s.order,
        title: s.title,
        instruction: s.instruction,
        mediaUrl: s.mediaUrl,
        timerSeconds: s.timerSeconds,
        temperatureCelsius: s.temperatureCelsius,
        tip: s.tip,
        ingredientPositions: (s.ingredientIds ?? []).map((id) => Number(id.slice(1))),
      })),
    );
  }
  console.log(`Seeded ${CREATORS.length} creators and ${RECIPES.length} recipes`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
