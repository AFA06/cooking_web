import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["user", "creator", "admin"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const recipeCategoryEnum = pgEnum("recipe_category", ["soup", "main", "salad", "bakery", "dessert", "drink"]);
export const recipeStatusEnum = pgEnum("recipe_status", ["draft", "published"]);
export const sessionStatusEnum = pgEnum("cooking_session_status", ["in_progress", "completed", "abandoned"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "paid", "failed", "refunded"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** Optional public handle: lowercase letters, digits and underscores. */
    username: text("username"),
    /** Optional, stored in international form (+998…). */
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("user"),
    locale: text("locale").notNull().default("uz"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), uniqueIndex("users_username_idx").on(t.username)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_idx").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const creators = pgTable(
  "creators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    /** Profile links keyed by platform, e.g. { instagram: "https://instagram.com/…" }. */
    socialLinks: jsonb("social_links").$type<Record<string, string>>().notNull().default({}),
    isFoundingCreator: boolean("is_founding_creator").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("creators_slug_idx").on(t.slug)],
);

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    creatorId: uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    coverUrl: text("cover_url").notNull(),
    coverAlt: text("cover_alt"),
    /** Extra photos shown after the cover in the recipe gallery. */
    galleryUrls: text("gallery_urls").array().notNull().default([]),
    servings: integer("servings").notNull(),
    prepTimeMinutes: integer("prep_time_minutes").notNull(),
    cookTimeMinutes: integer("cook_time_minutes").notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    category: recipeCategoryEnum("category").notNull().default("main"),
    /** Per serving. Either all four are set or none. */
    calories: integer("calories"),
    proteinGrams: integer("protein_grams"),
    fatGrams: integer("fat_grams"),
    carbGrams: integer("carb_grams"),
    isPremium: boolean("is_premium").notNull().default(false),
    priceAmount: integer("price_amount"),
    priceCurrency: text("price_currency"),
    tags: text("tags").array().notNull().default([]),
    status: recipeStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("recipes_slug_idx").on(t.slug), index("recipes_creator_idx").on(t.creatorId)],
);

export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    quantity: text("quantity").notNull(),
    unit: text("unit").notNull().default(""),
    notes: text("notes"),
  },
  (t) => [index("recipe_ingredients_recipe_idx").on(t.recipeId)],
);

export const recipeSteps = pgTable(
  "recipe_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    instruction: text("instruction").notNull(),
    mediaUrl: text("media_url"),
    timerSeconds: integer("timer_seconds"),
    temperatureCelsius: integer("temperature_celsius"),
    tip: text("tip"),
    ingredientPositions: integer("ingredient_positions").array().notNull().default([]),
  },
  (t) => [index("recipe_steps_recipe_idx").on(t.recipeId)],
);

export const savedRecipes = pgTable(
  "saved_recipes",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);

export const cookingSessions = pgTable(
  "cooking_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    status: sessionStatusEnum("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("cooking_sessions_user_idx").on(t.userId)],
);

/** One review per person per recipe; only people who finished cooking it may write one. */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reviews_recipe_user_idx").on(t.recipeId, t.userId),
    index("reviews_recipe_idx").on(t.recipeId),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

/** Result photo for a review, kept apart so listing reviews never loads image data. */
export const reviewPhotos = pgTable(
  "review_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    /** Base64-encoded image, resized in the browser before upload. */
    data: text("data").notNull(),
  },
  (t) => [uniqueIndex("review_photos_review_idx").on(t.reviewId)],
);

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    provider: text("provider"),
    providerReference: text("provider_reference"),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("purchases_user_idx").on(t.userId)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    userId: uuid("user_id"),
    recipeId: uuid("recipe_id"),
    creatorId: uuid("creator_id"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("analytics_events_name_idx").on(t.name)],
);
