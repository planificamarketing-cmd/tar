CREATE TYPE "public"."video_orientation" AS ENUM('horizontal', 'vertical');--> statement-breakpoint
CREATE TABLE "property_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"url" text NOT NULL,
	"orientation" "video_orientation" DEFAULT 'horizontal' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_videos" ADD CONSTRAINT "property_videos_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "property_videos_prop_idx" ON "property_videos" USING btree ("property_id","position");