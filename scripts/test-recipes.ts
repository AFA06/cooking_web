/**
 * Adds or removes placeholder recipes for testing lists and paging.
 *   npm run test-recipes          add the placeholder recipes (existing ones are kept and updated)
 *   npm run test-recipes -- clean remove them again
 * Placeholder recipes have a slug starting with "sinov-" and reuse the steps of an existing recipe.
 */
import { config } from "dotenv";
import type { RecipeCategory } from "../src/lib/categories";
config({ path: ".env.local" });

const PREFIX = "sinov-";

const DISHES: [title: string, photo: string, minutes: number, difficulty: "easy" | "medium" | "hard", price: number | null, category: RecipeCategory][] = [
  ["Norin", "1569718212165-3a8278d5f624", 90, "hard", 18000, "main"],
  ["Chuchvara", "1496116218417-1a781b1c416c", 70, "medium", null, "soup"],
  ["Mastava", "1547592166-23ac45744acd", 60, "easy", null, "soup"],
  ["Qozon kabob", "1599487488170-d11ec9c172f0", 80, "medium", 22000, "main"],
  ["Dimlama", "1574484284002-952d92456975", 110, "easy", null, "main"],
  ["Moshxo‘rda", "1547592166-23ac45744acd", 75, "easy", null, "soup"],
  ["Tandir go‘sht", "1555939594-58d7cb561ad1", 180, "hard", 30000, "main"],
  ["Qovurma lag‘mon", "1551183053-bf91a1d81141", 50, "medium", null, "main"],
  ["Shashlik", "1599487488170-d11ec9c172f0", 45, "medium", 15000, "main"],
  ["Go‘shtli somsa", "1601050690597-df0568f70950", 85, "medium", null, "bakery"],
  ["Oshqovoq somsa", "1601050690597-df0568f70950", 70, "easy", null, "bakery"],
  ["To‘y oshi", "1603133872878-684f208fb84b", 150, "hard", 25000, "main"],
  ["Bahor salati", "1540189549336-e6e99c3679fe", 15, "easy", null, "salad"],
  ["Toshkent salati", "1546069901-ba9599a7e63c", 25, "easy", null, "salad"],
  ["Pomidorli salat", "1592417817098-8fd3d9eb14a5", 10, "easy", null, "salad"],
  ["Baliq qovurma", "1574484284002-952d92456975", 40, "medium", 12000, "main"],
  ["Tuxum barak", "1496116218417-1a781b1c416c", 55, "medium", null, "main"],
  ["Moshkichiri", "1512621776951-a57141f2eefd", 65, "easy", null, "main"],
  ["Qiyma kabob", "1555939594-58d7cb561ad1", 35, "easy", 10000, "main"],
  ["Go‘shtli lag‘mon", "1569718212165-3a8278d5f624", 95, "hard", 20000, "soup"],
  ["Chak-chak", "1551024601-bec78aea704b", 60, "medium", null, "dessert"],
  ["Asalli tort", "1578985545062-69928b1d9587", 120, "hard", 16000, "dessert"],
  ["Mevali muzqaymoq", "1488477181946-6428a0291777", 20, "easy", null, "dessert"],
  ["Shokoladli pirojniy", "1563729784474-d77dbb933a9e", 50, "medium", 12000, "dessert"],
  ["Limonli choy", "1544145945-f90425340c7e", 10, "easy", null, "drink"],
  ["Uy limonadi", "1556679343-c7306c1976bc", 15, "easy", null, "drink"],
];

/** Rough per-serving figures by category, nudged per dish so placeholder cards do not all read the same. */
const NUTRITION: Record<RecipeCategory, [calories: number, protein: number, fat: number, carbs: number]> = {
  soup: [320, 18, 12, 34],
  main: [540, 28, 24, 52],
  salad: [140, 4, 8, 12],
  bakery: [380, 13, 20, 36],
  dessert: [410, 6, 18, 56],
  drink: [70, 0, 0, 17],
};
const nutritionFor = (category: RecipeCategory, i: number) => {
  const [calories, proteinGrams, fatGrams, carbGrams] = NUTRITION[category];
  const nudge = (i * 7) % 5;
  return { calories: calories + nudge * 10, proteinGrams: proteinGrams + (nudge % 3), fatGrams, carbGrams: carbGrams + nudge };
};

const slugify = (s: string) => s.toLowerCase().replace(/[‘’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const { db, schema } = await import("../src/db");
  const { like, eq } = await import("drizzle-orm");

  if (process.argv[2] === "clean") {
    const removed = await db.delete(schema.recipes).where(like(schema.recipes.slug, `${PREFIX}%`)).returning({ id: schema.recipes.id });
    return console.log(`Removed ${removed.length} placeholder recipes`);
  }
  const existing = new Set((await db.select({ slug: schema.recipes.slug }).from(schema.recipes).where(like(schema.recipes.slug, `${PREFIX}%`))).map((r) => r.slug));

  const creators = await db.select({ id: schema.creators.id }).from(schema.creators);
  const [template] = await db.select().from(schema.recipes).where(eq(schema.recipes.status, "published")).limit(1);
  if (creators.length === 0 || !template) throw new Error("Run `npm run db:seed` first: no creators or recipes to base placeholders on.");
  const [ingredients, steps] = await Promise.all([
    db.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, template.id)),
    db.select().from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, template.id)),
  ]);

  for (const [i, [title, photo, minutes, difficulty, price, category]] of DISHES.entries()) {
    const slug = PREFIX + slugify(title);
    // Already there: only keep its category and nutrition in step, so saves and cooking sessions on it survive.
    if (existing.has(slug)) {
      await db.update(schema.recipes).set({ category, ...nutritionFor(category, i) }).where(eq(schema.recipes.slug, slug));
      continue;
    }
    const [row] = await db
      .insert(schema.recipes)
      .values({
        slug,
        creatorId: creators[i % creators.length].id,
        title,
        description: "Sinov uchun namuna retsept. Qadamlari boshqa retseptdan olingan.",
        coverUrl: `https://images.unsplash.com/photo-${photo}?w=1200&q=80`,
        coverAlt: title,
        galleryUrls: [1, 2].map((offset) => `https://images.unsplash.com/photo-${DISHES[(i + offset * 3) % DISHES.length][1]}?w=1200&q=80`).filter((url) => !url.includes(photo)),
        servings: 4,
        prepTimeMinutes: Math.round(minutes * 0.3),
        cookTimeMinutes: Math.round(minutes * 0.7),
        difficulty,
        category,
        ...nutritionFor(category, i),
        isPremium: price !== null,
        priceAmount: price,
        priceCurrency: price !== null ? "UZS" : null,
        tags: ["Sinov"],
        status: "published",
        // Older than the real demo recipes, so those stay first.
        publishedAt: new Date(Date.UTC(2026, 7, 1 + i)),
      })
      .returning({ id: schema.recipes.id });
    await db.insert(schema.recipeIngredients).values(ingredients.map((item) => ({ ...item, id: undefined, recipeId: row.id })));
    await db.insert(schema.recipeSteps).values(steps.map((step) => ({ ...step, id: undefined, recipeId: row.id })));
  }
  console.log(`Placeholder recipes: ${DISHES.length - existing.size} added, ${existing.size} already there`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
