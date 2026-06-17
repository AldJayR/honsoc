import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { computeGWA } from "@/modules/grades/gwa.service.ts";
import {
	submitGrades,
	getGrades,
	getGwaWithDisqualifiers,
} from "./grade.service.ts";
import { NotFoundError, UnprocessableError } from "@/lib/errors.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			applications: {
				findFirst: vi.fn(),
			},
			terms: {
				findFirst: vi.fn(),
			},
			grades: {
				findMany: vi.fn(),
			},
		},
		insert: vi.fn(),
		transaction: vi.fn(),
	},
}));

vi.mock("@/modules/grades/gwa.service.ts", () => ({
	computeGWA: vi.fn().mockResolvedValue(1.5),
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(computeGWA).mockResolvedValue(1.5);
});

function mockApplication(
	overrides = {},
) {
	vi.mocked(db.query.applications.findFirst).mockResolvedValue({
		id: "app-1",
		studentId: "student-1",
		termId: "term-1",
		semester: "1ST",
		status: "SUBMITTED",
		referenceNo: "HS-261-12345",
		submittedAt: new Date(),
		...overrides,
	} as any);
}

function mockTerm(overrides = {}) {
	vi.mocked(db.query.terms.findFirst).mockResolvedValue({
		id: "term-1",
		schoolYear: "2025-2026",
		semester: "1ST",
		gwaThreshold: "1.75",
		isActive: true,
		...overrides,
	} as any);
}

describe("submitGrades", () => {
	it("submits grades successfully for SUBMITTED application", async () => {
		mockApplication();
		mockTerm();
		vi.mocked(db.transaction).mockImplementation(async (fn: any) => {
			await fn({
				delete: vi.fn().mockReturnValue({ where: vi.fn() }),
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockResolvedValue([]),
				}),
			});
		});

		const input = [
			{ subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
		];

		const result = await submitGrades("app-1", "student-1", input);

		expect(result.applicationId).toBe("app-1");
		expect(result.gwa).toBe(1.5);
		expect(result.disqualifiers).toEqual([]);
	});

	it("allows submission for FLAGGED application", async () => {
		mockApplication({ status: "FLAGGED" });
		mockTerm();
		vi.mocked(db.transaction).mockImplementation(async (fn: any) => {
			await fn({
				delete: vi.fn().mockReturnValue({ where: vi.fn() }),
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockResolvedValue([]),
				}),
			});
		});

		const input = [
			{ subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
		];

		const result = await submitGrades("app-1", "student-1", input);

		expect(result.applicationId).toBe("app-1");
	});

	it("throws NotFoundError when application not found", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined as any);

		await expect(
			submitGrades("app-1", "student-1", [
				{ subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
			]),
		).rejects.toThrow(NotFoundError);
	});

	it("throws NotFoundError when student does not own application", async () => {
		mockApplication({ studentId: "other-student" });

		await expect(
			submitGrades("app-1", "student-1", [
				{ subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
			]),
		).rejects.toThrow(NotFoundError);
	});

	it("throws UnprocessableError when application status is not SUBMITTED or FLAGGED", async () => {
		mockApplication({ status: "APPROVED" });

		await expect(
			submitGrades("app-1", "student-1", [
				{ subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
			]),
		).rejects.toThrow(UnprocessableError);
	});

	it("returns disqualifiers when grades have INC", async () => {
		mockApplication();
		mockTerm();
		vi.mocked(db.transaction).mockImplementation(async (fn: any) => {
			await fn({
				delete: vi.fn().mockReturnValue({ where: vi.fn() }),
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockResolvedValue([]),
				}),
			});
		});

		const input = [
			{ subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "INC" },
		];

		const result = await submitGrades("app-1", "student-1", input);

		expect(result.disqualifiers).toHaveLength(1);
		expect(result.disqualifiers[0]).toHaveProperty("code", "GRD-004");
	});
});

describe("getGrades", () => {
	it("returns grades for own application", async () => {
		mockApplication();
		const mockGrades = [
			{ id: 1, applicationId: "app-1", subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
		];
		vi.mocked(db.query.grades.findMany).mockResolvedValue(mockGrades as any);

		const result = await getGrades("app-1", "student-1", "STUDENT");

		expect(result).toEqual(mockGrades);
	});

	it("throws NotFoundError when application not found", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined as any);

		await expect(
			getGrades("app-1", "student-1", "STUDENT"),
		).rejects.toThrow(NotFoundError);
	});

	it("throws NotFoundError when student does not own application", async () => {
		mockApplication({ studentId: "other-student" });

		await expect(
			getGrades("app-1", "student-1", "STUDENT"),
		).rejects.toThrow(NotFoundError);
	});

	it("allows admin to view any application's grades", async () => {
		mockApplication({ studentId: "other-student" });
		const mockGrades = [
			{ id: 1, applicationId: "app-1", subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
		];
		vi.mocked(db.query.grades.findMany).mockResolvedValue(mockGrades as any);

		const result = await getGrades("app-1", "admin-1", "PRESIDENT");

		expect(result).toEqual(mockGrades);
	});
});

describe("getGwaWithDisqualifiers", () => {
	it("returns GWA and disqualifiers for own application", async () => {
		mockApplication();
		mockTerm();
		const mockGrades = [
			{ id: 1, applicationId: "app-1", subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
		];
		vi.mocked(db.query.grades.findMany).mockResolvedValue(mockGrades as any);

		const result = await getGwaWithDisqualifiers("app-1", "student-1", "STUDENT");

		expect(result.gwa).toBe(1.5);
		expect(result.disqualifiers).toEqual([]);
	});

	it("throws NotFoundError when application not found", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined as any);

		await expect(
			getGwaWithDisqualifiers("app-1", "student-1", "STUDENT"),
		).rejects.toThrow(NotFoundError);
	});

	it("throws NotFoundError when student does not own application", async () => {
		mockApplication({ studentId: "other-student" });

		await expect(
			getGwaWithDisqualifiers("app-1", "student-1", "STUDENT"),
		).rejects.toThrow(NotFoundError);
	});

	it("allows admin to view any application's GWA", async () => {
		mockApplication({ studentId: "other-student" });
		mockTerm();
		const mockGrades = [
			{ id: 1, applicationId: "app-1", subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "1.50" },
		];
		vi.mocked(db.query.grades.findMany).mockResolvedValue(mockGrades as any);

		const result = await getGwaWithDisqualifiers("app-1", "admin-1", "PRESIDENT");

		expect(result.gwa).toBe(1.5);
		expect(result.disqualifiers).toEqual([]);
	});

	it("returns disqualifiers when GWA exceeds threshold", async () => {
		mockApplication();
		mockTerm();
		vi.mocked(computeGWA).mockResolvedValue(2.0);
		const mockGrades = [
			{ id: 1, applicationId: "app-1", subjectCode: "MATH101", subjectName: "Calculus I", units: 3, grade: "2.00" },
			{ id: 2, applicationId: "app-1", subjectCode: "ENG101", subjectName: "English I", units: 3, grade: "2.00" },
		];
		vi.mocked(db.query.grades.findMany).mockResolvedValue(mockGrades as any);

		const result = await getGwaWithDisqualifiers("app-1", "student-1", "STUDENT");

		expect(result.gwa).toBe(2.0);
		expect(result.disqualifiers).toHaveLength(1);
		expect(result.disqualifiers[0]).toHaveProperty("code", "GRD-006");
	});
});
