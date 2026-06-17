import { describe, it, expect } from "vitest";
import { checkDisqualifiers } from "./grade.schema.ts";

describe("checkDisqualifiers", () => {
	it("returns no disqualifiers when all grades are passing and units meet minimum", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "1.75", units: 3 },
			{ grade: "2.00", units: 3 },
			{ grade: "1.00", units: 3 },
			{ grade: "1.25", units: 3 },
			{ grade: "1.50", units: 3 },
		];

		const result = checkDisqualifiers(grades, 18);

		expect(result.hasDisqualifier).toBe(false);
		expect(result.reasons).toEqual([]);
	});

	it("detects INC grade as disqualifier", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "INC", units: 3 },
			{ grade: "1.25", units: 3 },
			{ grade: "1.00", units: 3 },
			{ grade: "1.75", units: 3 },
			{ grade: "2.00", units: 3 },
		];

		const result = checkDisqualifiers(grades, 18);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toEqual([
			expect.objectContaining({ code: "GRD-004" }),
		]);
	});

	it("detects 5.0 grade as disqualifier", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "5.0", units: 3 },
			{ grade: "1.25", units: 3 },
			{ grade: "1.00", units: 3 },
			{ grade: "1.75", units: 3 },
			{ grade: "2.00", units: 3 },
		];

		const result = checkDisqualifiers(grades, 18);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toEqual([
			expect.objectContaining({ code: "GRD-004" }),
		]);
	});

	it("detects underloading as disqualifier", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "1.75", units: 3 },
		];

		const result = checkDisqualifiers(grades, 18);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toEqual([
			expect.objectContaining({ code: "GRD-005" }),
		]);
	});

	it("detects both INC and underloading", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "INC", units: 3 },
		];

		const result = checkDisqualifiers(grades, 18);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toHaveLength(2);
		expect(result.reasons.map((r) => r.code)).toContain("GRD-004");
		expect(result.reasons.map((r) => r.code)).toContain("GRD-005");
	});

	it("allows exactly minimum units", () => {
		const grades = Array.from({ length: 6 }, (_, i) => ({
			grade: "1.50" as const,
			units: 3,
		}));

		const result = checkDisqualifiers(grades, 18);

		expect(result.hasDisqualifier).toBe(false);
	});
});
