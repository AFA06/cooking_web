ALTER TABLE "recipes" ADD COLUMN "calories" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "protein_grams" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "fat_grams" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "carb_grams" integer;--> statement-breakpoint
UPDATE "recipes" SET "calories" = 620, "protein_grams" = 24, "fat_grams" = 28, "carb_grams" = 68 WHERE "slug" = 'klassik-osh';--> statement-breakpoint
UPDATE "recipes" SET "calories" = 540, "protein_grams" = 28, "fat_grams" = 18, "carb_grams" = 66 WHERE "slug" = 'lagmon-qolda-tortilgan';--> statement-breakpoint
UPDATE "recipes" SET "calories" = 480, "protein_grams" = 22, "fat_grams" = 22, "carb_grams" = 48 WHERE "slug" = 'manti-bugda-pishgan';--> statement-breakpoint
UPDATE "recipes" SET "calories" = 390, "protein_grams" = 14, "fat_grams" = 22, "carb_grams" = 34 WHERE "slug" = 'somsa-qatlamali';--> statement-breakpoint
UPDATE "recipes" SET "calories" = 450, "protein_grams" = 20, "fat_grams" = 14, "carb_grams" = 60 WHERE "slug" = 'shivit-oshi-xorazm';--> statement-breakpoint
UPDATE "recipes" SET "calories" = 45, "protein_grams" = 2, "fat_grams" = 0, "carb_grams" = 9 WHERE "slug" = 'achchiq-chuchuk-salat';