import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";
import { users } from "./users.ts";

export const auditLog = pgTable("audit_log", {
	id: serial("id").primaryKey(),
	actorId: uuid("actor_id")
		.notNull()
		.references(() => users.id),
	applicationId: uuid("application_id")
		.notNull()
		.references(() => applications.id),
	action: text("action").notNull(),
	note: text("note"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	actor: one(users, {
		fields: [auditLog.actorId],
		references: [users.id],
	}),
	application: one(applications, {
		fields: [auditLog.applicationId],
		references: [applications.id],
	}),
}));
