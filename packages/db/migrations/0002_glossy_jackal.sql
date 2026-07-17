ALTER TABLE "properties" ADD COLUMN "usable_area_m2" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rentable_area_m2" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "patio_m2" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "terrace_m2" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "balcony_m2" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "garden_m2" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_remate" boolean DEFAULT false NOT NULL;