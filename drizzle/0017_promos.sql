CREATE TYPE "public"."promo_kind" AS ENUM('percent', 'amount', 'free');--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"code" text NOT NULL,
	"kind" "promo_kind" NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"recipe_ids" uuid[] DEFAULT '{}' NOT NULL,
	"max_uses" integer,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "original_amount" integer;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "promo_code_id" uuid;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "sale_price" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "sale_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promo_codes_creator_idx" ON "promo_codes" USING btree ("creator_id");--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;