CREATE TABLE IF NOT EXISTS "majors" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	CONSTRAINT "majors_name_unique" UNIQUE("name")
);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "major_id" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_major_id_majors_id_fk" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE no action ON UPDATE no action;
