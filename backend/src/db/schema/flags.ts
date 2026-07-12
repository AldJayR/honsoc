import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";
import { users } from "./users.ts";

export const flags = pgTable("flags", {
	id: serial("id").primaryKey(),
	applicationId: uuid("application_id")
		.notNull()
		.references(() => applications.id),
	reasonCode: text("reason_code").notNull(),
	note: text("note").notNull(),
	flaggedBy: uuid("flagged_by")
		.notNull()
		.references(() => users.id),
	flaggedAt: timestamp("flagged_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const flagsRelations = relations(flags, ({ one }) => ({
	application: one(applications, {
		fields: [flags.applicationId],
		references: [applications.id],
	}),
	flagger: one(users, {
		fields: [flags.flaggedBy],
		references: [users.id],
	}),
}));
