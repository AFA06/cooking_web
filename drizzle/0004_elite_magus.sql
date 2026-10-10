CREATE TYPE "public"."recipe_category" AS ENUM('soup', 'main', 'salad', 'bakery', 'dessert', 'drink');--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "category" "recipe_category" DEFAULT 'main' NOT NULL;--> statement-breakpoint
UPDATE "recipes" SET "category" = 'soup' WHERE "slug" = 'lagmon-qolda-tortilgan';--> statement-breakpoint
UPDATE "recipes" SET "category" = 'bakery' WHERE "slug" = 'somsa-qatlamali';--> statement-breakpoint
UPDATE "recipes" SET "category" = 'salad' WHERE "slug" = 'achchiq-chuchuk-salat';