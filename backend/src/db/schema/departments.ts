import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const departments = pgTable("departments", {
	id: serial("id").primaryKey(),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
});
