import { db } from "@/db";
import { grades } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";

export async function computeGWA(
	applicationId: string,
): Promise<number | null> {
	const rows = await db
		.select()
		.from(grades)
		.where(eq(grades.applicationId, applicationId));

	const numericGrades = rows.filter((g) => /^[0-9.]+$/.test(g.grade));

	if (numericGrades.length === 0) return null;

	const totalWeighted = numericGrades.reduce(
		(sum, g) => sum + Number.parseFloat(g.grade) * g.units,
		0,
	);
	const totalUnits = numericGrades.reduce((sum, g) => sum + g.units, 0);

	return Math.round((totalWeighted / totalUnits) * 100) / 100;
}
