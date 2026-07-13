import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { computeGWA } from "./gwa.service.ts";
import type { DbSelectResult } from "@/test-utils/db-types.ts";

vi.mock("@/db", () => ({
	db: {
		select: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

function mockGradesQuery(rows: Array<{ grade: string; units: number }>) {
	const mockWhere = vi.fn().mockResolvedValue(rows);
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
	vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as DbSelectResult);
}

describe("computeGWA", () => {
	it("computes weighted average from numeric grades", async () => {
		mockGradesQuery([
			{ grade: "1.50", units: 3 },
			{ grade: "1.75", units: 3 },
			{ grade: "2.00", units: 3 },
		]);

		const result = await computeGWA("app-1");

		expect(result).toBe(1.75);
	});

	it("returns null when no numeric grades exist", async () => {
		mockGradesQuery([
			{ grade: "INC", units: 3 },
			{ grade: "INC", units: 3 },
		]);

		const result = await computeGWA("app-1");

		expect(result).toBeNull();
	});

	it("skips INC grades and computes from remaining numeric grades", async () => {
		mockGradesQuery([
			{ grade: "1.50", units: 3 },
			{ grade: "INC", units: 3 },
			{ grade: "1.25", units: 3 },
		]);

		const result = await computeGWA("app-1");

		expect(result).toBe(1.38);
	});

	it("includes 5.0 in numeric grade calculation", async () => {
		mockGradesQuery([
			{ grade: "1.00", units: 3 },
			{ grade: "5.0", units: 3 },
		]);

		const result = await computeGWA("app-1");

		expect(result).toBe(3.0);
	});

	it("returns null when grades array is empty", async () => {
		mockGradesQuery([]);

		const result = await computeGWA("app-1");

		expect(result).toBeNull();
	});

	it("handles different unit weights correctly", async () => {
		mockGradesQuery([
			{ grade: "1.00", units: 4 },
			{ grade: "2.00", units: 1 },
		]);

		const result = await computeGWA("app-1");

		expect(result).toBe(1.2);
	});
});
