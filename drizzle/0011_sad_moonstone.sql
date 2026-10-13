CREATE TABLE "video_parts" (
	"upload_id" uuid NOT NULL,
	"part" integer NOT NULL,
	"data" "bytea" NOT NULL,
	CONSTRAINT "video_parts_upload_id_part_pk" PRIMARY KEY("upload_id","part")
);
--> statement-breakpoint
CREATE TABLE "video_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"mime" text DEFAULT 'video/mp4' NOT NULL,
	"size" integer NOT NULL,
	"ready" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "video_parts" ADD CONSTRAINT "video_parts_upload_id_video_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."video_uploads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_uploads_owner_idx" ON "video_uploads" USING btree ("owner_id");