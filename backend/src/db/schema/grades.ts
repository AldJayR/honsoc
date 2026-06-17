import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, uuid } from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";

export const grades = pgTable("grades", {
	id: serial("id").primaryKey(),
	applicationId: uuid("application_id")
		.notNull()
		.references(() => applications.id, { onDelete: "cascade" }),
	subjectName: text("subject_name").notNull(),
	units: integer("units").notNull(),
	grade: text("grade").notNull(),
});

export const gradesRelations = relations(grades, ({ one }) => ({
	application: one(applications, {
		fields: [grades.applicationId],
		references: [applications.id],
	}),
}));
