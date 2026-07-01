CREATE TABLE "majors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "majors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "applications" RENAME COLUMN "major" TO "major_id";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_object_key_unique";--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_major_id_majors_id_fk" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE no action ON UPDATE no action;