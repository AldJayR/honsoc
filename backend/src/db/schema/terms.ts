import { boolean, date, integer, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";

export const terms = pgTable("terms", {
	id: serial("id").primaryKey(),
	schoolYear: text("school_year").notNull(),
	semester: text("semester").notNull().default("1ST"),
	gwaThreshold: numeric("gwa_threshold", { precision: 4, scale: 2 })
		.default("1.75")
		.notNull(),
	minUnits: integer("min_units").default(18).notNull(),
	deadline: date("deadline").notNull(),
	isActive: boolean("is_active").default(false).notNull(),
});
