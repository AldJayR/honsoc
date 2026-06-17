import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const campus = pgTable("campus", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
});
