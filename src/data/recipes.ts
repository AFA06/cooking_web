import type { Recipe, RecipeIngredient, RecipeStep, RecipeMedia, RecipeCreator } from "@/types/recipe";

export const CREATORS: RecipeCreator[] = [
  {
    id: "c1",
    name: "Aziza's Kitchen",
    slug: "aziza-kitchen",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
    bio: "Traditional Uzbek recipes passed down through generations. Making home cooking accessible to everyone.",
    isFoundingCreator: true,
  },
  {
    id: "c2",
    name: "Bekzod Cooks",
    slug: "bekzod-cooks",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    bio: "Modern takes on Central Asian classics. Professional chef sharing restaurant secrets for home cooks.",
    isFoundingCreator: true,
  },
  {
    id: "c3",
    name: "Feruza's Table",
    slug: "feruzas-table",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
    bio: "Vegetarian and vegan Uzbek dishes. Proving plant-based can be just as flavorful and authentic.",
    isFoundingCreator: true,
  },
];

const IMG = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

const PHOTOS = {
  plov: "1603133872878-684f208fb84b",
  lagman: "1569718212165-3a8278d5f624",
  rice: "1512621776951-a57141f2eefd",
  onions: "1556911220-bff31c812dba",
  veg: "1506976785307-8732e854ad03",
  dumplings: "1496116218417-1a781b1c416c",
  soup: "1547592166-23ac45744acd",
  skewers: "1599487488170-d11ec9c172f0",
  platter: "1513558161293-cdaf765ed2fd",
  pasta: "1551183053-bf91a1d81141",
};

function ing(rows: [string, string, string][]): RecipeIngredient[] {
  return rows.map(([name, quantity, unit], i) => ({ id: `i${i + 1}`, name, quantity, unit, order: i + 1 }));
}

type StepInput = {
  title: string;
  instruction: string;
  photo?: string;
  minutes?: number;
  celsius?: number;
  tip?: string;
  uses?: number[];
};

function steps(rows: StepInput[]): RecipeStep[] {
  return rows.map((r, i) => ({
    id: `s${i + 1}`,
    order: i + 1,
    title: r.title,
    instruction: r.instruction,
    mediaUrl: r.photo ? IMG(r.photo, 800) : undefined,
    mediaType: r.photo ? ("image" as const) : undefined,
    timerSeconds: r.minutes ? r.minutes * 60 : undefined,
    temperatureCelsius: r.celsius,
    tip: r.tip,
    ingredientIds: (r.uses ?? []).map((n) => `i${n}`),
  }));
}

function cover(photo: string, alt: string): RecipeMedia {
  return { id: "m1", type: "image", url: IMG(photo), alt, order: 1 };
}

const PUBLISHED = "2026-09-01T10:00:00Z";

export const RECIPES: Recipe[] = [
  {
    id: "1",
    slug: "classic-uzbek-plov",
    title: "Classic Uzbek Plov",
    description:
      "Fragrant rice, tender lamb, sweet carrots and cumin, cooked in a kazan the way it is made for celebrations.",
    coverMedia: cover(PHOTOS.plov, "A platter of Uzbek plov with lamb and carrots"),
    creator: CREATORS[0],
    servings: 6,
    prepTimeMinutes: 30,
    cookTimeMinutes: 100,
    difficulty: "medium",
    isPremium: true,
    price: 15000,
    currency: "UZS",
    ingredients: ing([
      ["Long-grain rice", "3", "cups"],
      ["Lamb shoulder", "500", "g"],
      ["Carrots", "3", "large"],
      ["Onions", "2", "large"],
      ["Garlic", "1", "head"],
      ["Cumin seeds", "1", "tbsp"],
      ["Salt", "1.5", "tbsp"],
      ["Vegetable oil", "150", "ml"],
    ]),
    steps: steps([
      { title: "Prepare ingredients", instruction: "Rinse the rice until the water runs clear, then soak it in cold salted water. Cut the carrots into thin matchsticks, slice the onions and cube the lamb.", photo: PHOTOS.veg, tip: "Soaking the rice keeps the grains whole and separate.", uses: [1, 2, 3, 4] },
      { title: "Fry the onions", instruction: "Heat the oil in a kazan until it just begins to smoke. Add the onions and fry over medium heat until deep golden.", photo: PHOTOS.onions, minutes: 7, celsius: 180, tip: "Golden onions are the flavor base of good plov.", uses: [4, 8] },
      { title: "Brown the meat", instruction: "Add the lamb, raise the heat and brown it on all sides without overcrowding the pot.", minutes: 5, celsius: 200, tip: "Pat the meat dry first so it browns instead of steaming.", uses: [2] },
      { title: "Add carrots and spices", instruction: "Add the carrots and fry for 3 minutes, then add the cumin and salt and stir until fragrant.", minutes: 4, uses: [3, 6, 7] },
      { title: "Simmer the zirvak", instruction: "Pour in 4 cups of boiling water, set the whole garlic head in the center, and simmer covered over low heat.", photo: PHOTOS.soup, minutes: 30, celsius: 100, tip: "The broth should taste slightly too salty; the rice will absorb it.", uses: [5] },
      { title: "Add the rice", instruction: "Drain the rice and spread it evenly over the meat. Do not stir. Add water to cover the rice by one finger-width and bring to a boil.", photo: PHOTOS.rice, minutes: 5, uses: [1] },
      { title: "Steam", instruction: "Gather the rice into a mound, poke holes with a spoon handle, cover tightly and cook on the lowest heat. Do not lift the lid.", minutes: 20, celsius: 90, tip: "Rest the pot off the heat for 15 minutes afterwards." },
      { title: "Mix and serve", instruction: "Remove the garlic, gently mix the rice with the meat and carrots, and serve on a large platter.", photo: PHOTOS.platter, tip: "Serve with achichuk and hot tea." },
    ]),
    media: [cover(PHOTOS.plov, "A platter of Uzbek plov with lamb and carrots")],
    tags: ["Uzbek", "Rice", "Lamb", "Traditional"],
    publishedAt: PUBLISHED,
    viewCount: 0,
    saveCount: 0,
  },
  {
    id: "2",
    slug: "lagman-hand-pulled-noodles",
    title: "Lagman — Hand-Pulled Noodles",
    description:
      "Silky hand-pulled noodles in a rich beef and vegetable sauce. A labor of love that is worth every pull.",
    coverMedia: cover(PHOTOS.lagman, "A bowl of lagman noodles with beef and vegetables"),
    creator: CREATORS[1],
    servings: 4,
    prepTimeMinutes: 45,
    cookTimeMinutes: 60,
    difficulty: "hard",
    isPremium: true,
    price: 20000,
    currency: "UZS",
    ingredients: ing([
      ["Wheat flour", "500", "g"],
      ["Beef", "400", "g"],
      ["Onion", "1", "large"],
      ["Bell peppers", "2", "pcs"],
      ["Tomato paste", "2", "tbsp"],
      ["Garlic", "4", "cloves"],
      ["Salt", "2", "tsp"],
      ["Vegetable oil", "80", "ml"],
    ]),
    steps: steps([
      { title: "Make the dough", instruction: "Knead the flour with 200 ml salted water into a firm dough. Cover and rest for 30 minutes.", minutes: 30, uses: [1, 7] },
      { title: "Brown the beef", instruction: "Heat the oil and brown the cubed beef with the onion over high heat.", photo: PHOTOS.onions, minutes: 10, uses: [2, 3, 8] },
      { title: "Build the sauce", instruction: "Add peppers, garlic and tomato paste, cover with water and simmer until the beef is tender.", photo: PHOTOS.soup, minutes: 40, uses: [4, 5, 6] },
      { title: "Pull the noodles", instruction: "Roll the dough into ropes, oil them, then stretch and fold into thin strands.", tip: "Rest the ropes for 10 minutes if the dough springs back." },
      { title: "Cook and serve", instruction: "Boil the noodles for 3 minutes, drain, and top with the sauce.", photo: PHOTOS.lagman, minutes: 3 },
    ]),
    media: [cover(PHOTOS.lagman, "A bowl of lagman noodles with beef and vegetables")],
    tags: ["Uzbek", "Noodles", "Beef", "Soup"],
    publishedAt: PUBLISHED,
    viewCount: 0,
    saveCount: 0,
  },
  {
    id: "3",
    slug: "manti-steamed-dumplings",
    title: "Manti — Steamed Dumplings",
    description: "Juicy lamb and onion dumplings, folded by hand and steamed until tender.",
    coverMedia: cover(PHOTOS.dumplings, "Steamed manti dumplings on a wooden plate"),
    creator: CREATORS[0],
    servings: 4,
    prepTimeMinutes: 60,
    cookTimeMinutes: 40,
    difficulty: "medium",
    isPremium: true,
    price: 12000,
    currency: "UZS",
    ingredients: ing([
      ["Wheat flour", "500", "g"],
      ["Lamb, minced", "500", "g"],
      ["Onions", "3", "large"],
      ["Salt", "2", "tsp"],
      ["Black pepper", "1", "tsp"],
      ["Butter", "50", "g"],
    ]),
    steps: steps([
      { title: "Make the dough", instruction: "Knead flour, water and a pinch of salt into a firm dough. Rest it for 30 minutes.", minutes: 30, uses: [1] },
      { title: "Prepare the filling", instruction: "Dice the onions finely and mix with the lamb, salt and pepper.", uses: [2, 3, 4, 5], tip: "Hand-cut onion keeps the filling juicy." },
      { title: "Fold the manti", instruction: "Roll the dough thin, cut squares, add filling and pinch the corners together.", photo: PHOTOS.dumplings },
      { title: "Steam", instruction: "Place the manti in an oiled steamer and steam over boiling water.", minutes: 40, celsius: 100 },
      { title: "Serve", instruction: "Brush with melted butter and serve hot.", uses: [6] },
    ]),
    media: [cover(PHOTOS.dumplings, "Steamed manti dumplings on a wooden plate")],
    tags: ["Uzbek", "Dumplings", "Lamb"],
    publishedAt: PUBLISHED,
    viewCount: 0,
    saveCount: 0,
  },
  {
    id: "4",
    slug: "samsa-flaky-meat-pastries",
    title: "Samsa — Flaky Meat Pastries",
    description: "Crisp, flaky pastries filled with spiced lamb and onion, baked until golden.",
    coverMedia: cover(PHOTOS.platter, "Golden baked samsa pastries"),
    creator: CREATORS[1],
    servings: 8,
    prepTimeMinutes: 45,
    cookTimeMinutes: 35,
    difficulty: "medium",
    isPremium: false,
    ingredients: ing([
      ["Puff pastry", "500", "g"],
      ["Lamb, minced", "400", "g"],
      ["Onions", "3", "large"],
      ["Cumin", "1", "tsp"],
      ["Salt", "1", "tsp"],
      ["Egg yolk", "1", "pcs"],
    ]),
    steps: steps([
      { title: "Make the filling", instruction: "Dice the onions and mix with lamb, cumin and salt.", photo: PHOTOS.onions, uses: [2, 3, 4, 5] },
      { title: "Heat the oven", instruction: "Preheat the oven to 200°C and line a baking tray.", minutes: 10, celsius: 200 },
      { title: "Shape the samsa", instruction: "Cut the pastry into squares, add filling, and fold into triangles, sealing the edges.", uses: [1], tip: "Press out the air so the pastry does not balloon." },
      { title: "Glaze and bake", instruction: "Brush with egg yolk and bake until golden.", photo: PHOTOS.platter, minutes: 30, celsius: 200, uses: [6] },
    ]),
    media: [cover(PHOTOS.platter, "Golden baked samsa pastries")],
    tags: ["Uzbek", "Pastry", "Lamb"],
    publishedAt: PUBLISHED,
    viewCount: 0,
    saveCount: 0,
  },
  {
    id: "5",
    slug: "shivit-oshi-khorezm-green-noodles",
    title: "Shivit Oshi — Khorezm Green Noodles",
    description: "Bright dill noodles from Khorezm, served with a hearty meat and vegetable stew and yogurt.",
    coverMedia: cover(PHOTOS.pasta, "Noodles with meat and vegetables"),
    creator: CREATORS[2],
    servings: 4,
    prepTimeMinutes: 40,
    cookTimeMinutes: 40,
    difficulty: "medium",
    isPremium: false,
    ingredients: ing([
      ["Wheat flour", "400", "g"],
      ["Fresh dill", "1", "bunch"],
      ["Eggs", "2", "pcs"],
      ["Beef", "300", "g"],
      ["Potatoes", "2", "pcs"],
      ["Yogurt", "200", "g"],
      ["Salt", "1.5", "tsp"],
    ]),
    steps: steps([
      { title: "Blend the dill", instruction: "Blend the dill with the eggs and a splash of water until smooth.", uses: [2, 3] },
      { title: "Make the dough", instruction: "Mix into the flour with salt and knead. Rest the dough.", minutes: 20, uses: [1, 7] },
      { title: "Cook the stew", instruction: "Simmer the beef and potatoes until tender.", photo: PHOTOS.soup, minutes: 30, uses: [4, 5] },
      { title: "Cut and boil the noodles", instruction: "Roll the dough thin, cut into strips and boil.", minutes: 4, celsius: 100 },
      { title: "Serve", instruction: "Plate the noodles with the stew and a spoon of yogurt.", photo: PHOTOS.pasta, uses: [6] },
    ]),
    media: [cover(PHOTOS.pasta, "Noodles with meat and vegetables")],
    tags: ["Khorezm", "Noodles", "Beef"],
    publishedAt: PUBLISHED,
    viewCount: 0,
    saveCount: 0,
  },
  {
    id: "6",
    slug: "achichuk-fresh-tomato-salad",
    title: "Achichuk — Fresh Tomato Salad",
    description: "A sharp, fresh tomato and onion salad that goes with every rich Uzbek dish.",
    coverMedia: cover(PHOTOS.veg, "Fresh sliced tomatoes and vegetables"),
    creator: CREATORS[2],
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    difficulty: "easy",
    isPremium: false,
    ingredients: ing([
      ["Tomatoes", "4", "large"],
      ["Red onion", "1", "pcs"],
      ["Chili pepper", "1", "pcs"],
      ["Fresh cilantro", "1", "bunch"],
      ["Salt", "1", "tsp"],
    ]),
    steps: steps([
      { title: "Slice the onion", instruction: "Slice the onion paper-thin, salt it and leave it for 5 minutes.", minutes: 5, uses: [2, 5], tip: "Salting softens the onion's bite." },
      { title: "Cut the tomatoes", instruction: "Slice the tomatoes thinly and layer them on a plate.", photo: PHOTOS.veg, uses: [1] },
      { title: "Add and serve", instruction: "Top with onion, sliced chili and chopped cilantro. Serve right away.", uses: [3, 4] },
    ]),
    media: [cover(PHOTOS.veg, "Fresh sliced tomatoes and vegetables")],
    tags: ["Uzbek", "Salad", "Vegetarian"],
    publishedAt: PUBLISHED,
    viewCount: 0,
    saveCount: 0,
  },
];

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return RECIPES.find((r) => r.slug === slug);
}

export function getRecipesByCreator(creatorSlug: string): Recipe[] {
  return RECIPES.filter((r) => r.creator.slug === creatorSlug);
}

export function getFeaturedRecipes(limit = 6): Recipe[] {
  return RECIPES.slice(0, limit);
}

export function getFreeRecipes(): Recipe[] {
  return RECIPES.filter((r) => !r.isPremium);
}

export function getPremiumRecipes(): Recipe[] {
  return RECIPES.filter((r) => r.isPremium);
}

export function searchRecipes(query: string): Recipe[] {
  const lowerQuery = query.toLowerCase();
  return RECIPES.filter(
    (r) =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.creator.name.toLowerCase().includes(lowerQuery) ||
      r.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

export const CUISINES = ["All", "Uzbek", "Khorezm"] as const;
export const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"] as const;
export const PRICE_FILTERS = ["All", "Free", "Premium"] as const;

export function getCreatorBySlug(slug: string): RecipeCreator | undefined {
  return CREATORS.find((c) => c.slug === slug);
}
