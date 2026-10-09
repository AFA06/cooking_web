/**
 * Adds or removes placeholder recipes for testing lists and paging.
 *   npm run test-recipes          add 20 placeholder recipes
 *   npm run test-recipes -- clean remove them again
 * Placeholder recipes have a slug starting with "sinov-" and reuse the steps of an existing recipe.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const PREFIX = "sinov-";

const DISHES: [title: string, photo: string, minutes: number, difficulty: "easy" | "medium" | "hard", price: number | null][] = [
  ["Norin", "1569718212165-3a8278d5f624", 90, "hard", 18000],
  ["Chuchvara", "1496116218417-1a781b1c416c", 70, "medium", null],
  ["Mastava", "1547592166-23ac45744acd", 60, "easy", null],
  ["Qozon kabob", "1599487488170-d11ec9c172f0", 80, "medium", 22000],
  ["Dimlama", "1574484284002-952d92456975", 110, "easy", null],
  ["Moshxo‘rda", "1547592166-23ac45744acd", 75, "easy", null],
  ["Tandir go‘sht", "1555939594-58d7cb561ad1", 180, "hard", 30000],
  ["Qovurma lag‘mon", "1551183053-bf91a1d81141", 50, "medium", null],
  ["Shashlik", "1599487488170-d11ec9c172f0", 45, "medium", 15000],
  ["Go‘shtli somsa", "1601050690597-df0568f70950", 85, "medium", null],
  ["Oshqovoq somsa", "1601050690597-df0568f70950", 70, "easy", null],
  ["To‘y oshi", "1603133872878-684f208fb84b", 150, "hard", 25000],
  ["Bahor salati", "1540189549336-e6e99c3679fe", 15, "easy", null],
  ["Toshkent salati", "1546069901-ba9599a7e63c", 25, "easy", null],
  ["Pomidorli salat", "1592417817098-8fd3d9eb14a5", 10, "easy", null],
  ["Baliq qovurma", "1574484284002-952d92456975", 40, "medium", 12000],
  ["Tuxum barak", "1496116218417-1a781b1c416c", 55, "medium", null],
  ["Moshkichiri", "1512621776951-a57141f2eefd", 65, "easy", null],
  ["Qiyma kabob", "1555939594-58d7cb561ad1", 35, "easy", 10000],
  ["Go‘shtli lag‘mon", "1569718212165-3a8278d5f624", 95, "hard", 20000],
];

const slugify = (s: string) => s.toLowerCase().replace(/[‘’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const { db, schema } = await import("../src/db");
  const { like, eq } = await import("drizzle-orm");

  const removed = await db.delete(schema.recipes).where(like(schema.recipes.slug, `${PREFIX}%`)).returning({ id: schema.recipes.id });
  if (process.argv[2] === "clean") return console.log(`Removed ${removed.length} placeholder recipes`);

  const creators = await db.select({ id: schema.creators.id }).from(schema.creators);
  const [template] = await db.select().from(schema.recipes).where(eq(schema.recipes.status, "published")).limit(1);
  if (creators.length === 0 || !template) throw new Error("Run `npm run db:seed` first: no creators or recipes to base placeholders on.");
  const [ingredients, steps] = await Promise.all([
    db.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, template.id)),
    db.select().from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, template.id)),
  ]);

  for (const [i, [title, photo, minutes, difficulty, price]] of DISHES.entries()) {
    const [row] = await db
      .insert(schema.recipes)
      .values({
        slug: PREFIX + slugify(title),
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
  console.log(`Added ${DISHES.length} placeholder recipes`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
