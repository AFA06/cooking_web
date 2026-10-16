import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
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
export const mediaKindEnum = pgEnum("media_kind", ["image", "video"]);
export const mediaStatusEnum = pgEnum("media_status", ["pending", "ready"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Optional: people can sign up with a phone number alone. Only a verified email is used for recovery. */
    email: text("email"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    name: text("name").notNull(),
    /** Optional public handle: lowercase letters, digits and underscores. */
    username: text("username"),
    /** Stored in international form (+998…). Required for new accounts, verified by SMS code. */
    phone: text("phone"),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    passwordHash: text("password_hash").notNull(),
    /** Set on accounts an admin created with a temporary password; cleared when the person picks their own. */
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    role: roleEnum("role").notNull().default("user"),
    /** Last time the person used the site while signed in; refreshed at most every few minutes. */
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    /** Set by an admin: the person can no longer sign in and all their sessions are ended. */
    blockedAt: timestamp("blocked_at", { withTimezone: true }),
    locale: text("locale").notNull().default("uz"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    uniqueIndex("users_username_idx").on(t.username),
    uniqueIndex("users_phone_idx").on(t.phone),
  ],
);

export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected"]);

/**
 * A signed-in person asking to become a creator. The team checks their audience and either approves
 * (which makes them a creator) or rejects. One open request per person at a time.
 */
export const creatorApplications = pgTable(
  "creator_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    instagram: text("instagram"),
    telegram: text("telegram"),
    /** Rough follower count across their channels, as the person picked it (e.g. "10k-50k"). */
    audience: text("audience").notNull(),
    about: text("about").notNull(),
    status: applicationStatusEnum("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("creator_applications_status_idx").on(t.status, t.createdAt),
    uniqueIndex("creator_applications_open_idx").on(t.userId).where(sql`${t.status} = 'pending'`),
  ],
);

export const challengePurposeEnum = pgEnum("challenge_purpose", ["signup", "password_reset", "email_change", "phone_change"]);
export const challengeChannelEnum = pgEnum("challenge_channel", ["sms", "email"]);

/**
 * One-time codes sent to a phone or an email. The code itself is never stored, only a keyed hash.
 * A signup challenge also carries the pending account (name and password hash) until the code is entered.
 */
export const authChallenges = pgTable(
  "auth_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purpose: challengePurposeEnum("purpose").notNull(),
    channel: challengeChannelEnum("channel").notNull(),
    /** Phone (+998…) or email the code goes to. Empty for password resets, where the account decides. */
    destination: text("destination"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<Record<string, string>>(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    sendCount: integer("send_count").notNull().default(1),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_challenges_user_idx").on(t.userId), index("auth_challenges_expires_idx").on(t.expiresAt)],
);

/** Sliding-window counters for throttling: failed logins, code requests, SMS sends. Keys are hashed. */
export const authEvents = pgTable(
  "auth_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    keyHash: text("key_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_events_lookup_idx").on(t.kind, t.keyHash, t.createdAt)],
);

/** One row per person per day (Tashkent time) they used the site signed in. Daily, weekly and monthly active users come from here. */
export const userActivity = pgTable(
  "user_activity",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] }), index("user_activity_day_idx").on(t.day)],
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
    /** Where buyers of this creator's premium recipes are sent (t.me/<username>). Set by an admin only. */
    telegramUsername: text("telegram_username"),
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
    /** A lower price the creator runs for a while. Active while sale_ends_at is empty or still ahead. */
    salePrice: integer("sale_price"),
    saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }),
    tags: text("tags").array().notNull().default([]),
    /** A YouTube or Vimeo link, or a direct video file, shown on the recipe page. */
    videoUrl: text("video_url"),
    /** Hidden tips that only buyers (and the creator) can read; kept out of the public recipe object. */
    secretNotes: text("secret_notes"),
    status: recipeStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("recipes_slug_idx").on(t.slug), index("recipes_creator_idx").on(t.creatorId)],
);

/**
 * Photos uploaded by creators, stored as resized JPEG (base64) and served from /api/media/:id.
 * Each upload gets its own id, so responses can be cached for good.
 */
export const mediaUploads = pgTable(
  "media_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    data: text("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_uploads_owner_idx").on(t.ownerId)],
);

const bytea = customType<{ data: Buffer; driverData: string | Uint8Array }>({
  dataType: () => "bytea",
  toDriver: (value) => `\\x${value.toString("hex")}`,
  fromDriver: (value) => (typeof value === "string" ? Buffer.from(value.replace(/^\\x/, ""), "hex") : Buffer.from(value)),
});

/**
 * Video clips uploaded by creators, served from /api/video/:id. A clip arrives in parts and is only
 * shown once every part is in (`ready`).
 */
export const videoUploads = pgTable(
  "video_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    mime: text("mime").notNull().default("video/mp4"),
    size: integer("size").notNull(),
    ready: boolean("ready").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("video_uploads_owner_idx").on(t.ownerId)],
);

export const videoParts = pgTable(
  "video_parts",
  {
    uploadId: uuid("upload_id").notNull().references(() => videoUploads.id, { onDelete: "cascade" }),
    part: integer("part").notNull(),
    data: bytea("data").notNull(),
  },
  (t) => [primaryKey({ columns: [t.uploadId, t.part] })],
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
    videoUrl: text("video_url"),
    /** On a premium recipe: the creator lets everyone read this step before buying. Ignored on free recipes. */
    isFree: boolean("is_free").notNull().default(false),
    timerSeconds: integer("timer_seconds"),
    temperatureCelsius: integer("temperature_celsius"),
    tip: text("tip"),
    ingredientPositions: integer("ingredient_positions").array().notNull().default([]),
  },
  (t) => [index("recipe_steps_recipe_idx").on(t.recipeId)],
);

/**
 * A photo or clip kept in file storage (see server/storage). Steps point at it as /api/files/:id;
 * the storage key never leaves the server. `pending` until the upload has been checked.
 * It belongs to exactly one step once the recipe is saved; before that, only to whoever uploaded it.
 * Deleting a user, recipe or step only unlinks the row, so the stored file can still be found and removed.
 */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    recipeId: uuid("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
    stepId: uuid("step_id").references(() => recipeSteps.id, { onDelete: "set null" }),
    kind: mediaKindEnum("kind").notNull(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    status: mediaStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("media_assets_key_idx").on(t.objectKey),
    // A step has at most one photo and one clip.
    uniqueIndex("media_assets_step_kind_idx").on(t.stepId, t.kind),
    index("media_assets_owner_idx").on(t.ownerId),
    index("media_assets_recipe_idx").on(t.recipeId),
    check("media_assets_size_check", sql`${t.size} > 0`),
  ],
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

/** A person's own named collection of recipes, alongside the general saved list. */
export const cookbooks = pgTable(
  "cookbooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cookbooks_user_idx").on(t.userId)],
);

export const cookbookRecipes = pgTable(
  "cookbook_recipes",
  {
    cookbookId: uuid("cookbook_id").notNull().references(() => cookbooks.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.cookbookId, t.recipeId] })],
);

/** Recipes whose ingredients the person plans to buy, with the servings they chose. Separate from saved recipes. */
export const shoppingRecipes = pgTable(
  "shopping_recipes",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    servings: integer("servings").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);

/** One ingredient to buy: a copy taken when the recipe was added, already scaled to the chosen servings. */
export const shoppingItems = pgTable(
  "shopping_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    /** The amount as text, shown when it is not a number ("ta’bga ko‘ra"). */
    quantity: text("quantity").notNull(),
    /** The amount as a number, so the same product from several recipes can be added up. */
    amount: real("amount"),
    unit: text("unit").notNull().default(""),
    checked: boolean("checked").notNull().default(false),
  },
  (t) => [index("shopping_items_user_idx").on(t.userId)],
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

export const promoKindEnum = pgEnum("promo_kind", ["percent", "amount", "free"]);

/**
 * A creator's promo code. Takes a percent or a fixed sum off, or makes the recipe free, on all of the creator's
 * premium recipes or only the chosen ones. Optional limit on uses and an optional end time.
 */
export const promoCodes = pgTable(
  "promo_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
    /** Stored in capitals; buyers may type it in any case. */
    code: text("code").notNull(),
    kind: promoKindEnum("kind").notNull(),
    /** Percent (1–99) for "percent", so'm for "amount", unused for "free". */
    value: integer("value").notNull().default(0),
    /** Empty means every premium recipe of the creator. */
    recipeIds: uuid("recipe_ids").array().notNull().default([]),
    maxUses: integer("max_uses"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("promo_codes_code_idx").on(t.code), index("promo_codes_creator_idx").on(t.creatorId)],
);

/**
 * A buyer's order for a premium recipe. Payment happens outside the site (a card transfer agreed in the
 * creator's Telegram chat), so an order starts `pending` and becomes `paid` only when the creator who owns
 * the recipe confirms it. `paid` is what unlocks the recipe (see server/access).
 */
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
    /** The recipe's normal price when the order was made; `amount` is what the buyer pays after a sale or promo code. */
    originalAmount: integer("original_amount"),
    promoCodeId: uuid("promo_code_id").references(() => promoCodes.id, { onDelete: "set null" }),
    /** Short public code such as DM-7K4Q2P that ties the Telegram chat to this order. */
    orderCode: text("order_code"),
    creatorId: uuid("creator_id").references(() => creators.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    confirmedBy: uuid("confirmed_by").references(() => users.id, { onDelete: "set null" }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("purchases_user_idx").on(t.userId),
    index("purchases_creator_idx").on(t.creatorId),
    uniqueIndex("purchases_order_code_idx").on(t.orderCode),
    // One open or paid order per person and recipe.
    uniqueIndex("purchases_live_idx").on(t.userId, t.recipeId).where(sql`${t.status} in ('pending', 'paid')`),
  ],
);

/** Append-only history of an order: who did what and when. Never updated or deleted by the app. */
export const purchaseEvents = pgTable(
  "purchase_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purchaseId: uuid("purchase_id").notNull().references(() => purchases.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    /** created | chat_opened | granted | rejected | cancelled | expired | revoked */
    action: text("action").notNull(),
    note: text("note"),
    clientHash: text("client_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("purchase_events_purchase_idx").on(t.purchaseId)],
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
