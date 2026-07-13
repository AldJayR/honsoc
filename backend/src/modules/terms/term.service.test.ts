import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { createTerm, listTerms, getActiveTerm, updateTerm } from "./term.service.ts";
import { NotFoundError } from "@/lib/errors.ts";
import type { DbInsertResult, DbSelectResult, DbUpdateResult } from "@/test-utils/db-types.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			terms: {
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(),
		update: vi.fn(),
		select: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createTerm", () => {
	it("inserts a term and returns it", async () => {
		const input = {
			schoolYear: "2025-2026",
			semester: "1ST" as const,
			gwaThreshold: "1.75",
		};
		const expected = { id: 1, ...input, isActive: false };

		const mockReturning = vi.fn().mockResolvedValue([expected]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		vi.mocked(db.insert).mockReturnValue({ values: mockValues } as unknown as DbInsertResult);

		const result = await createTerm(input);

		expect(result).toEqual(expected);
		expect(db.insert).toHaveBeenCalled();
		expect(mockValues).toHaveBeenCalledWith(input);
	});
});

describe("listTerms", () => {
	it("returns all terms ordered by id", async () => {
		const expected = [
			{ id: 1, schoolYear: "2025-2026", semester: "1ST" },
			{ id: 2, schoolYear: "2025-2026", semester: "2ND" },
		];
		const mockOrderBy = vi.fn().mockResolvedValue(expected);
		const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as DbSelectResult);

		const result = await listTerms();

		expect(result).toEqual(expected);
	});
});

describe("getActiveTerm", () => {
	it("returns the active term", async () => {
		const expected = { id: 1, schoolYear: "2025-2026", isActive: true };
		vi.mocked(db.query.terms.findFirst).mockResolvedValue(expected as never);

		const result = await getActiveTerm();

		expect(result).toEqual(expected);
	});

	it("returns undefined when no active term exists", async () => {
		vi.mocked(db.query.terms.findFirst).mockResolvedValue(undefined);

		const result = await getActiveTerm();

		expect(result).toBeUndefined();
	});
});

describe("updateTerm", () => {
	it("updates a term and returns it", async () => {
		const existing = { id: 1 };
		const input = { gwaThreshold: "1.50" };
		const updated = { id: 1, gwaThreshold: "1.50" };

		vi.mocked(db.query.terms.findFirst).mockResolvedValue(existing as never);

		const mockReturning = vi.fn().mockResolvedValue([updated]);
		const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as unknown as DbUpdateResult);

		const result = await updateTerm(1, input);

		expect(result).toEqual(updated);
	});

	it("throws NotFoundError when term does not exist", async () => {
		vi.mocked(db.query.terms.findFirst).mockResolvedValue(undefined);

		await expect(updateTerm(999, { gwaThreshold: "1.50" })).rejects.toThrow(NotFoundError);
	});
});
