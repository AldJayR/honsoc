import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { terms } from "./terms.ts";
import { grades } from "./grades.ts";
import { documents } from "./documents.ts";

export const applications = pgTable("applications", {
	id: uuid("id").defaultRandom().primaryKey(),
	studentId: uuid("student_id")
		.notNull()
		.references(() => users.id),
	termId: integer("term_id")
		.notNull()
		.references(() => terms.id),
	semester: text("semester").notNull(),
	yearLevel: text("year_level").notNull(),
	program: text("program").notNull(),
	major: text("major"),
	status: text("status").notNull().default("SUBMITTED"),
	referenceNo: text("reference_no").notNull().unique(),
	reviewedBy: uuid("reviewed_by").references(() => users.id),
	submittedAt: timestamp("submitted_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const applicationsRelations = relations(applications, ({ one, many }) => ({
	student: one(users, {
		fields: [applications.studentId],
		references: [users.id],
	}),
	term: one(terms, {
		fields: [applications.termId],
		references: [terms.id],
	}),
	reviewer: one(users, {
		fields: [applications.reviewedBy],
		references: [users.id],
	}),
	grades: many(grades),
	documents: many(documents),
}));
