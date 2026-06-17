import { z } from "zod";

export const ALLOWED_GRADES = [
	"1.00",
	"1.25",
	"1.50",
	"1.75",
	"2.00",
	"5.0",
	"INC",
] as const;

export const gradeSchema = z.object({
	subjectCode: z.string().min(1).max(20).meta({
		description: "Subject code (e.g. 'MATH101')",
		example: "MATH101",
	}),
	subjectName: z.string().min(1).max(100).meta({
		description: "Subject name",
		example: "Calculus I",
	}),
	units: z.number().int().min(1).max(6).meta({
		description: "Number of units (1–6)",
		example: 3,
	}),
	grade: z.enum(ALLOWED_GRADES).meta({
		description: "Grade value",
		example: "1.50",
	}),
}).meta({ id: "Grade" });

export type GradeInput = z.infer<typeof gradeSchema>;

export function checkDisqualifiers(
	grades: Array<{ grade: string; units: number }>,
	gwa: number | null,
	gwaThreshold: number,
) {
	const reasons: Array<{ code: string; message: string }> = [];

	const hasDisqualifyingGrade = grades.some(
		(g) => g.grade === "5.0" || g.grade === "INC",
	);
	if (hasDisqualifyingGrade) {
		reasons.push({
			code: "GRD-004",
			message: "Contains a disqualifying grade (5.0 or INC)",
		});
	}

	if (gwa !== null && gwa > gwaThreshold) {
		reasons.push({
			code: "GRD-006",
			message: `GWA ${gwa} does not meet the required threshold of ${gwaThreshold}`,
		});
	}

	return { hasDisqualifier: reasons.length > 0, reasons };
}
