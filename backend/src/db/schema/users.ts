import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { departments } from "./departments.ts";
import { campus } from "./campus.ts";
import { accounts } from "./accounts.ts";
import { sessions } from "./sessions.ts";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),

	first_name: text("first_name").notNull(),
	middle_name: text("middle_name"),
	middle_initial: text("middle_initial"),
	last_name: text("last_name").notNull(),
	extension: text("extension"),

	student_number: text("student_number").unique(),
	role: text("role").notNull().default("STUDENT"),
	campus_id: integer("campus_id").references(() => campus.id),
	department_id: integer("department_id").references(() => departments.id),
	status: text("status").notNull().default("ACTIVE"),
});

export const usersRelations = relations(users, ({ many, one }) => ({
	campus: one(campus, {
		fields: [users.campus_id],
		references: [campus.id],
	}),
	department: one(departments, {
		fields: [users.department_id],
		references: [departments.id],
	}),
	sessions: many(sessions),
	accounts: many(accounts),
}));
