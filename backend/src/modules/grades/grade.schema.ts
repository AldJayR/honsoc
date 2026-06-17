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
	subjectName: z.string().min(1).max(100),
	units: z.number().int().min(1).max(6),
	grade: z.enum(ALLOWED_GRADES),
});

export type GradeInput = z.infer<typeof gradeSchema>;

export function checkDisqualifiers(
	grades: Array<{ grade: string; units: number }>,
	minUnits: number,
) {
	const reasons: Array<{ code: string; message: string }> = [];
	const totalUnits = grades.reduce((sum, g) => sum + g.units, 0);

	const hasDisqualifyingGrade = grades.some(
		(g) => g.grade === "5.0" || g.grade === "INC",
	);
	if (hasDisqualifyingGrade) {
		reasons.push({
			code: "GRD-004",
			message: "Contains a disqualifying grade (5.0 or INC)",
		});
	}

	if (totalUnits < minUnits) {
		reasons.push({
			code: "GRD-005",
			message: `Underloading: ${totalUnits} units (minimum ${minUnits})`,
		});
	}

	return { hasDisqualifier: reasons.length > 0, reasons };
}
