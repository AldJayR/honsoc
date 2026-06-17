import { boolean, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";

export const terms = pgTable("terms", {
	id: serial("id").primaryKey(),
	schoolYear: text("school_year").notNull(),
	semester: text("semester").notNull().default("1ST"),
	gwaThreshold: numeric("gwa_threshold", { precision: 4, scale: 2 })
		.default("1.75")
		.notNull(),
	isActive: boolean("is_active").default(false).notNull(),
});
