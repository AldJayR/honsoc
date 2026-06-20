ALTER TABLE "applications" ADD COLUMN "year_level" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "program" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "major" text;--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "subject_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "terms" DROP COLUMN "min_units";--> statement-breakpoint
ALTER TABLE "terms" DROP COLUMN "deadline";