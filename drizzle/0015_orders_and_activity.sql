CREATE TABLE "purchase_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"note" text,
	"client_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	CONSTRAINT "user_activity_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "telegram_username" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "order_code" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "confirmed_by" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "purchase_events" ADD CONSTRAINT "purchase_events_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_events" ADD CONSTRAINT "purchase_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_events_purchase_idx" ON "purchase_events" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "user_activity_day_idx" ON "user_activity" USING btree ("day");--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchases_creator_idx" ON "purchases" USING btree ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_order_code_idx" ON "purchases" USING btree ("order_code");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_live_idx" ON "purchases" USING btree ("user_id","recipe_id") WHERE "purchases"."status" in ('pending', 'paid');