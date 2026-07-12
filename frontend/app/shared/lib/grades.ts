import type { GradeInput } from "@/shared/services/auth.api";

/**
 * Calculates the Grade Weighted Average (GWA) from a list of grades.
 * Non-numeric, failing (5.0), and incomplete (INC) grades are excluded from the GWA.
 */
export function calculateGWA(grades: GradeInput[]): number {
	let totalPoints = 0;
	let totalUnits = 0;

	for (const g of grades) {
		const gradeNum = Number.parseFloat(g.grade);
		// Exclude non-numeric grades from average calculation
		if (!Number.isNaN(gradeNum) && g.grade !== "INC" && g.grade !== "5.0") {
			totalPoints += gradeNum * g.units;
			totalUnits += g.units;
		}
	}

	if (totalUnits === 0) return 0;
	return Math.round((totalPoints / totalUnits) * 100) / 100;
}

/**
 * Checks if the grades contain any disqualifying values (5.0 or INC).
 */
export function hasDisqualifyingGrade(grades: GradeInput[]): boolean {
	return grades.some((g) => g.grade === "5.0" || g.grade === "INC");
}

/**
 * Checks if the GWA exceeds the eligibility threshold.
 * (Note: lower numeric value represents a higher grade in the grading scale, so GWA > threshold is a disqualifier).
 */
export function isDisqualifiedByGWA(gwa: number, threshold: number): boolean {
	return gwa > 0 && gwa > threshold;
}

