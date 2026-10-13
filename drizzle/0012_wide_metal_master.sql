ALTER TABLE "recipe_steps" ADD COLUMN "is_free" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Recipes published before steps could be marked one by one showed their first three steps for free; keep that until the creator changes it.
UPDATE "recipe_steps" SET "is_free" = true WHERE "position" <= 3 AND "recipe_id" IN (SELECT "id" FROM "recipes" WHERE "is_premium" = true);
