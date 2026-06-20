import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const majors = pgTable("majors", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
});
