import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";

export const documents = pgTable("documents", {
	id: serial("id").primaryKey(),
	applicationId: uuid("application_id")
		.notNull()
		.references(() => applications.id, { onDelete: "cascade" }),
	docType: text("doc_type").notNull(),
	objectKey: text("object_key").notNull().unique(),
	fileSizeKb: integer("file_size_kb"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
	application: one(applications, {
		fields: [documents.applicationId],
		references: [applications.id],
	}),
}));
