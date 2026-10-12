import { z } from "zod";
import { CATEGORY_KEYS } from "@/lib/categories";
import { parseVideoUrl } from "@/lib/video";

/** A picture is either a web link or one of our own uploads. */
export const IMAGE_URL = /^(https?:\/\/|\/api\/media\/[0-9a-f-]{36}$)/i;

const optionalUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || IMAGE_URL.test(v), "err.imgUrl");

/** Photos a recipe can have besides its cover. */
export const MAX_GALLERY_PHOTOS = 5;

export const recipeInputSchema = z
  .object({
    title: z.string().trim().min(3, "err.titleShort").max(120, "err.titleLong"),
    description: z.string().trim().min(10, "err.descShort").max(600),
    coverUrl: z.string().trim().regex(IMAGE_URL, "err.coverUrl").max(1000),
    videoUrl: z.string().trim().max(500).refine((v) => v === "" || parseVideoUrl(v) !== null, "err.videoUrl"),
    galleryUrls: z.array(z.string().trim().regex(IMAGE_URL, "err.imgUrl").max(1000)).max(MAX_GALLERY_PHOTOS, "err.maxGallery"),
    servings: z.coerce.number().int().min(1).max(100),
    prepTimeMinutes: z.coerce.number().int().min(0).max(2880),
    cookTimeMinutes: z.coerce.number().int().min(0).max(2880),
    difficulty: z.enum(["easy", "medium", "hard"]),
    category: z.enum(CATEGORY_KEYS),
    calories: z.coerce.number().int().min(0).max(5000).nullable(),
    proteinGrams: z.coerce.number().int().min(0).max(500).nullable(),
    fatGrams: z.coerce.number().int().min(0).max(500).nullable(),
    carbGrams: z.coerce.number().int().min(0).max(1000).nullable(),
    isPremium: z.boolean(),
    priceAmount: z.coerce.number().int().min(0).max(100_000_000).nullable(),
    secretNotes: z.string().trim().max(4000),
    tags: z.array(z.string().trim().min(1).max(30)).max(10),
    ingredients: z
      .array(
        z.object({
          name: z.string().trim().min(1, "err.ingName").max(120),
          quantity: z.string().trim().min(1, "err.ingQty").max(30),
          unit: z.string().trim().max(30),
        }),
      )
      .min(1, "err.ingMin")
      .max(60),
    steps: z
      .array(
        z.object({
          title: z.string().trim().min(1, "err.stepTitle").max(120),
          instruction: z.string().trim().min(1, "err.stepInstr").max(2000),
          mediaUrl: optionalUrl,
          timerMinutes: z.coerce.number().int().min(0).max(1440),
          temperatureCelsius: z.coerce.number().int().min(0).max(500),
          tip: z.string().trim().max(500),
          ingredientPositions: z.array(z.number().int().min(1)).max(60),
        }),
      )
      .min(1, "err.stepMin")
      .max(60),
  })
  .refine((v) => new Set([v.calories, v.proteinGrams, v.fatGrams, v.carbGrams].map((n) => n === null)).size === 1, {
    message: "err.nutritionAll",
    path: ["calories"],
  })
  .refine((v) => !v.isPremium || (v.priceAmount !== null && v.priceAmount > 0), {
    message: "err.premiumPrice",
    path: ["priceAmount"],
  });

export type RecipeInput = z.input<typeof recipeInputSchema>;
export type RecipeData = z.output<typeof recipeInputSchema>;

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ў: "u", қ: "q", ғ: "g", ҳ: "h",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
