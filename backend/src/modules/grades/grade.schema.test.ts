import { describe, it, expect } from "vitest";
import { checkDisqualifiers } from "./grade.schema.ts";

describe("checkDisqualifiers", () => {
	const THRESHOLD = 1.75;

	it("returns no disqualifiers when all grades are passing and GWA meets threshold", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "1.75", units: 3 },
			{ grade: "2.00", units: 3 },
			{ grade: "1.00", units: 3 },
			{ grade: "1.25", units: 3 },
			{ grade: "1.50", units: 3 },
		];

		const result = checkDisqualifiers(grades, 1.50, THRESHOLD);

		expect(result.hasDisqualifier).toBe(false);
		expect(result.reasons).toEqual([]);
	});

	it("detects INC grade as disqualifier", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "INC", units: 3 },
		];

		const result = checkDisqualifiers(grades, 1.50, THRESHOLD);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toEqual([
			expect.objectContaining({ code: "GRD-004" }),
		]);
	});

	it("detects 5.0 grade as disqualifier", () => {
		const grades = [
			{ grade: "1.50", units: 3 },
			{ grade: "5.0", units: 3 },
		];

		const result = checkDisqualifiers(grades, 1.50, THRESHOLD);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toEqual([
			expect.objectContaining({ code: "GRD-004" }),
		]);
	});

	it("detects GWA above threshold as disqualifier", () => {
		const grades = [
			{ grade: "2.00", units: 3 },
			{ grade: "2.00", units: 3 },
		];

		const result = checkDisqualifiers(grades, 2.0, THRESHOLD);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toEqual([
			expect.objectContaining({ code: "GRD-006" }),
		]);
	});

	it("detects GWA of 1.76 as disqualifier", () => {
		const grades = [
			{ grade: "1.75", units: 3 },
			{ grade: "1.75", units: 3 },
		];

		const result = checkDisqualifiers(grades, 1.76, THRESHOLD);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toEqual([
			expect.objectContaining({ code: "GRD-006" }),
		]);
	});

	it("allows GWA of exactly 1.75", () => {
		const grades = [
			{ grade: "1.75", units: 3 },
			{ grade: "1.75", units: 3 },
		];

		const result = checkDisqualifiers(grades, 1.75, THRESHOLD);

		expect(result.hasDisqualifier).toBe(false);
		expect(result.reasons).toEqual([]);
	});

	it("detects both disqualifying grade and bad GWA", () => {
		const grades = [
			{ grade: "INC", units: 3 },
			{ grade: "2.00", units: 3 },
		];

		const result = checkDisqualifiers(grades, 2.0, THRESHOLD);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toHaveLength(2);
		expect(result.reasons.map((r) => r.code)).toContain("GRD-004");
		expect(result.reasons.map((r) => r.code)).toContain("GRD-006");
	});

	it("returns no disqualifiers when GWA is null (no numeric grades)", () => {
		const grades = [
			{ grade: "INC", units: 3 },
		];

		const result = checkDisqualifiers(grades, null, THRESHOLD);

		expect(result.hasDisqualifier).toBe(true);
		expect(result.reasons).toHaveLength(1);
		expect(result.reasons[0]?.code).toBe("GRD-004");
	});
});
