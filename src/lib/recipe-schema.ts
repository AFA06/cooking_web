import { z } from "zod";
import { CATEGORY_KEYS } from "@/lib/categories";

const optionalUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Rasm havolasi http:// yoki https:// bilan boshlanishi kerak");

/** Photos a recipe can have besides its cover. */
export const MAX_GALLERY_PHOTOS = 5;

export const recipeInputSchema = z
  .object({
    title: z.string().trim().min(3, "Sarlavha juda qisqa").max(120, "Sarlavha juda uzun"),
    description: z.string().trim().min(10, "Qisqacha tavsif qo‘shing").max(600),
    coverUrl: z.string().trim().regex(/^https?:\/\//i, "Muqova rasmi havolasini kiriting (http:// yoki https:// bilan boshlanadi)").max(1000),
    galleryUrls: z.array(z.string().trim().regex(/^https?:\/\//i, "Rasm havolasi http:// yoki https:// bilan boshlanishi kerak").max(1000)).max(MAX_GALLERY_PHOTOS, `Ko‘pi bilan ${MAX_GALLERY_PHOTOS} ta qo‘shimcha rasm`),
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
    tags: z.array(z.string().trim().min(1).max(30)).max(10),
    ingredients: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Har bir masalliqning nomi bo‘lishi kerak").max(120),
          quantity: z.string().trim().min(1, "Har bir masalliqning miqdori bo‘lishi kerak").max(30),
          unit: z.string().trim().max(30),
        }),
      )
      .min(1, "Kamida bitta masalliq qo‘shing")
      .max(60),
    steps: z
      .array(
        z.object({
          title: z.string().trim().min(1, "Har bir qadamning sarlavhasi bo‘lishi kerak").max(120),
          instruction: z.string().trim().min(1, "Har bir qadamning ko‘rsatmasi bo‘lishi kerak").max(2000),
          mediaUrl: optionalUrl,
          timerMinutes: z.coerce.number().int().min(0).max(1440),
          temperatureCelsius: z.coerce.number().int().min(0).max(500),
          tip: z.string().trim().max(500),
          ingredientPositions: z.array(z.number().int().min(1)).max(60),
        }),
      )
      .min(1, "Kamida bitta qadam qo‘shing")
      .max(60),
  })
  .refine((v) => new Set([v.calories, v.proteinGrams, v.fatGrams, v.carbGrams].map((n) => n === null)).size === 1, {
    message: "Ozuqaviy qiymatning to‘rttasini ham to‘ldiring yoki hammasini bo‘sh qoldiring",
    path: ["calories"],
  })
  .refine((v) => !v.isPremium || (v.priceAmount !== null && v.priceAmount > 0), {
    message: "Premium retsept uchun narx kerak",
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
