-- The same table is also created by the sms-auth branch; both are safe to run in any order.
CREATE TABLE IF NOT EXISTS "auth_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"key_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_events_lookup_idx" ON "auth_events" USING btree ("kind","key_hash","created_at");