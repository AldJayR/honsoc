import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import {
	createApplication,
	getStudentApplications,
	getApplicationById,
	updateApplicationStatus,
	getAllApplications,
} from "./application.service.ts";
import { UnprocessableError, NotFoundError, ConflictError } from "@/lib/errors.ts";
import type {
	DbTransaction,
	DbTransactionCallback,
	DbSelectResult,
} from "@/test-utils/db-types.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			terms: {
				findFirst: vi.fn(),
			},
			users: {
				findFirst: vi.fn(),
			},
			applications: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			grades: {
				findMany: vi.fn(),
			},
		},
		insert: vi.fn(),
		update: vi.fn(),
		select: vi.fn(),
		transaction: vi.fn(),
	},
}));

vi.mock("@/modules/grades/gwa.service.ts", () => ({
	computeGWA: vi.fn().mockResolvedValue(1.5),
}));

vi.mock("@/modules/audit-log/audit-log.service.ts", () => ({
	logAction: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

function mockActiveTerm(overrides = {}) {
	const term = {
		id: 1,
		schoolYear: "2025-2026",
		semester: "BOTH",
		...overrides,
	};
	vi.mocked(db.query.terms.findFirst).mockResolvedValue(term as never);
	return term;
}

function mockStudent(studentNumber = "2012345") {
	vi.mocked(db.query.users.findFirst).mockResolvedValue({
		student_number: studentNumber,
	} as never);
}

function mockNoExistingApplication() {
	vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined);
}

function mockGrades(rows: Array<{ applicationId?: string; grade: string; units: number }> = []) {
	const mockWhere = vi.fn().mockResolvedValue(rows);
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
	vi.mocked(db.select).mockReturnValue({ from: mockFrom } as unknown as DbSelectResult);
}

describe("createApplication", () => {
	const grades1st = [
		{ subjectCode: "MATH101", subjectName: "Math 101", units: 3, grade: "1.50" as const },
	];
	const grades2nd = [
		{ subjectCode: "ENG102", subjectName: "Eng 102", units: 3, grade: "1.25" as const },
	];

	it("creates a single semester application", async () => {
		mockActiveTerm({ semester: "1ST" });
		mockStudent();
		mockNoExistingApplication();
		mockGrades();

		const mockApp = { id: "app-1", referenceNo: "HS-251-1-2012345" };
		const mockReturning = vi.fn().mockResolvedValue([mockApp]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockGradesInsert = vi.fn().mockResolvedValue([]);
		const mockInsert = vi.fn().mockReturnValue({ values: mockGradesInsert });
		const mockTx = { insert: mockInsert } as unknown as DbTransaction;
		mockInsert.mockReturnValueOnce({ values: mockValues });
		mockInsert.mockReturnValueOnce({ values: mockGradesInsert });
		vi.mocked(db.transaction).mockImplementation(async (fn: DbTransactionCallback) => fn(mockTx));

		const result = await createApplication("student-1", {
			semester: "1ST",
			yearLevel: "3RD_YEAR",
			program: "BS in Information Technology",
			majorId: 1,
			grades: grades1st,
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.referenceNo).toContain("HS-251");
	});

	it("creates both semester applications when term is BOTH", async () => {
		mockActiveTerm({ semester: "BOTH" });
		mockStudent();
		mockNoExistingApplication();
		mockGrades();

		const mockReturning = vi.fn().mockResolvedValue([
			{ id: "app-1", referenceNo: "HS-251-1-2012345" },
			{ id: "app-2", referenceNo: "HS-252-2-2012345" },
		]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockGradesInsert = vi.fn().mockResolvedValue([]);
		const mockInsert = vi.fn().mockReturnValue({ values: mockGradesInsert });
		const mockTx = { insert: mockInsert } as unknown as DbTransaction;
		mockInsert.mockReturnValueOnce({ values: mockValues });
		mockInsert.mockReturnValueOnce({ values: mockGradesInsert });
		mockInsert.mockReturnValueOnce({ values: mockValues });
		mockInsert.mockReturnValueOnce({ values: mockGradesInsert });
		vi.mocked(db.transaction).mockImplementation(async (fn: DbTransactionCallback) => fn(mockTx));

		const result = await createApplication("student-1", {
			semester: "BOTH",
			yearLevel: "2ND_YEAR",
			program: "BS in Computer Science",
			majorId: null,
			grades_1st: grades1st,
			grades_2nd: grades2nd,
		});

		expect(result).toHaveLength(2);
		expect(result[0]?.semester).toBe("1ST");
		expect(result[1]?.semester).toBe("2ND");
	});

	it("throws when no active term exists", async () => {
		vi.mocked(db.query.terms.findFirst).mockResolvedValue(undefined);

		await expect(
			createApplication("student-1", {
				semester: "1ST",
				yearLevel: "3RD_YEAR",
				program: "BS in Information Technology",
				majorId: null,
				grades: grades1st,
			}),
		).rejects.toThrow(UnprocessableError);
	});

	it("throws when BOTH requested but term is not BOTH", async () => {
		mockActiveTerm({ semester: "1ST" });
		mockStudent();

		await expect(
			createApplication("student-1", {
				semester: "BOTH",
				yearLevel: "2ND_YEAR",
				program: "BS in Computer Science",
				majorId: null,
				grades_1st: grades1st,
				grades_2nd: grades2nd,
			}),
		).rejects.toThrow(UnprocessableError);
	});

	it("creates single semester application when term is BOTH", async () => {
		mockActiveTerm({ semester: "BOTH" });
		mockStudent();
		mockNoExistingApplication();
		mockGrades();

		const mockApp = { id: "app-1", referenceNo: "HS-251-1-2012345" };
		const mockReturning = vi.fn().mockResolvedValue([mockApp]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockGradesInsert = vi.fn().mockResolvedValue([]);
		const mockInsert = vi.fn().mockReturnValue({ values: mockGradesInsert });
		const mockTx = { insert: mockInsert } as unknown as DbTransaction;
		mockInsert.mockReturnValueOnce({ values: mockValues });
		mockInsert.mockReturnValueOnce({ values: mockGradesInsert });
		vi.mocked(db.transaction).mockImplementation(async (fn: DbTransactionCallback) => fn(mockTx));

		const result = await createApplication("student-1", {
			semester: "1ST",
			yearLevel: "3RD_YEAR",
			program: "BS in Information Technology",
			majorId: null,
			grades: grades1st,
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.referenceNo).toContain("HS-251");
	});

	it("throws ConflictError when duplicate application exists", async () => {
		mockActiveTerm({ semester: "BOTH" });
		mockStudent();
		vi.mocked(db.query.applications.findFirst).mockResolvedValue({
			id: "existing",
		} as never);

		await expect(
			createApplication("student-1", {
				semester: "BOTH",
				yearLevel: "2ND_YEAR",
				program: "BS in Computer Science",
				majorId: null,
				grades_1st: grades1st,
				grades_2nd: grades2nd,
			}),
		).rejects.toThrow(ConflictError);
	});

	it("throws when student number is missing", async () => {
		mockActiveTerm();
		vi.mocked(db.query.users.findFirst).mockResolvedValue({
			student_number: null,
		} as never);

		await expect(
			createApplication("student-1", {
				semester: "1ST",
				yearLevel: "3RD_YEAR",
				program: "BS in Information Technology",
				majorId: null,
				grades: grades1st,
			}),
		).rejects.toThrow(UnprocessableError);
	});
});

describe("getStudentApplications", () => {
	it("returns applications with computed GWA", async () => {
		vi.mocked(db.query.applications.findMany).mockResolvedValue([
			{
				id: "app-1",
				semester: "1ST",
				yearLevel: "3RD_YEAR",
				program: "BS in Information Technology",
				majorId: 1,
				status: "SUBMITTED",
				referenceNo: "HS-251-1-2012345",
				submittedAt: new Date(),
			},
		] as never);
		mockGrades([{ applicationId: "app-1", grade: "1.50", units: 3 }]);

		const result = await getStudentApplications("student-1");

		expect(result).toHaveLength(1);
		expect(result[0]?.gwa).toBe(1.5);
		expect(result[0]?.referenceNo).toBe("HS-251-1-2012345");
	});

	it("returns empty array when no applications exist", async () => {
		vi.mocked(db.query.applications.findMany).mockResolvedValue([]);

		const result = await getStudentApplications("student-1");

		expect(result).toEqual([]);
	});
});

describe("getApplicationById", () => {
	it("returns application for student owner", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue({
			id: "app-1",
			studentId: "student-1",
			termId: 1,
			semester: "1ST",
			yearLevel: "3RD_YEAR",
			program: "BS in Information Technology",
			majorId: 1,
			status: "SUBMITTED",
			referenceNo: "HS-251-1-2012345",
			submittedAt: new Date(),
			student: {
				id: "student-1",
				name: "John Doe",
				student_number: "2012345",
			},
		} as never);
		vi.mocked(db.query.terms.findFirst).mockResolvedValue({
			id: 1,
			schoolYear: "2025-2026",
		} as never);

		const result = await getApplicationById("app-1", "student-1", "STUDENT");

		expect(result.id).toBe("app-1");
		expect(result.gwa).toBe(1.5);
		expect(result.student.name).toBe("John Doe");
	});

	it("throws NotFoundError for student accessing other student's application", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue({
			id: "app-1",
			studentId: "other-student",
		} as never);

		await expect(getApplicationById("app-1", "student-1", "STUDENT")).rejects.toThrow(
			NotFoundError,
		);
	});

	it("allows PRESIDENT to view any application", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue({
			id: "app-1",
			studentId: "any-student",
			termId: 1,
			semester: "1ST",
			yearLevel: "2ND_YEAR",
			program: "BS in Computer Science",
			majorId: null,
			status: "SUBMITTED",
			referenceNo: "HS-251-1-2012345",
			submittedAt: new Date(),
			student: {
				id: "other-student",
				name: "Other Student",
				student_number: "2012346",
			},
		} as never);
		vi.mocked(db.query.terms.findFirst).mockResolvedValue({
			id: 1,
			schoolYear: "2025-2026",
		} as never);

		const result = await getApplicationById("app-1", "president-1", "PRESIDENT");

		expect(result.id).toBe("app-1");
	});

	it("throws NotFoundError when application does not exist", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined);

		await expect(getApplicationById("nonexistent", "student-1", "STUDENT")).rejects.toThrow(
			NotFoundError,
		);
	});
});

describe("updateApplicationStatus", () => {
	function mockApplicationWithGrades(
		overrides: Partial<{
			status: string;
			studentId: string;
			grades: Array<{ grade: string; units: number }>;
		}> = {},
	) {
		const defaults = {
			id: "app-1",
			studentId: "student-1",
			termId: 1,
			semester: "1ST",
			status: "SUBMITTED",
			grades: [{ grade: "1.50", units: 3 }],
		};
		const merged = { ...defaults, ...overrides };
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(merged as never);
		return merged;
	}

	function mockTerm(gwaThreshold = "1.75") {
		vi.mocked(db.query.terms.findFirst).mockResolvedValue({
			id: 1,
			schoolYear: "2025-2026",
			semester: "1ST",
			gwaThreshold,
		} as never);
	}

	function mockUpdateSuccess(returnValue = { id: "app-1", status: "VERIFIED" }) {
		const mockReturning = vi.fn().mockResolvedValue([returnValue]);
		const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);
		const mockTx = {
			update: vi.mocked(db.update),
		} as unknown as DbTransaction;
		vi.mocked(db.transaction).mockImplementation(async (fn: DbTransactionCallback) => fn(mockTx));
		return { mockSet, mockWhere, mockReturning };
	}

	it("throws UnprocessableError when VERIFY is attempted with disqualifying grade", async () => {
		mockApplicationWithGrades({
			grades: [{ grade: "INC", units: 3 }],
		});
		mockTerm("1.75");

		await expect(
			updateApplicationStatus("app-1", "admin-1", "COLLEGE_ADMIN", "VERIFIED"),
		).rejects.toThrow(UnprocessableError);
	});

	it("throws UnprocessableError when VERIFY is attempted with GWA above threshold", async () => {
		mockApplicationWithGrades({
			grades: [{ grade: "2.00", units: 3 }],
		});
		mockTerm("1.75");
		const { computeGWA } = await import("@/modules/grades/gwa.service.ts");
		vi.mocked(computeGWA).mockResolvedValue(2.5);

		await expect(
			updateApplicationStatus("app-1", "admin-1", "COLLEGE_ADMIN", "VERIFIED"),
		).rejects.toThrow(UnprocessableError);
	});

	it("VERIFY succeeds when no disqualifiers exist", async () => {
		const { computeGWA } = await import("@/modules/grades/gwa.service.ts");
		vi.mocked(computeGWA).mockResolvedValue(1.5);
		mockApplicationWithGrades({
			grades: [{ grade: "1.50", units: 3 }],
		});
		mockTerm("1.75");
		mockUpdateSuccess({ id: "app-1", status: "VERIFIED" });

		const result = await updateApplicationStatus("app-1", "admin-1", "COLLEGE_ADMIN", "VERIFIED");

		expect(result.status).toBe("VERIFIED");
	});

	it("REJECTED sets status without disqualifier check", async () => {
		mockApplicationWithGrades({
			grades: [{ grade: "INC", units: 3 }],
		});
		mockUpdateSuccess({ id: "app-1", status: "REJECTED" });

		const result = await updateApplicationStatus("app-1", "admin-1", "COLLEGE_ADMIN", "REJECTED");

		expect(result.status).toBe("REJECTED");
	});

	it("throws NotFoundError for non-existent application", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined);

		await expect(
			updateApplicationStatus("nonexistent", "admin-1", "COLLEGE_ADMIN", "VERIFIED"),
		).rejects.toThrow(NotFoundError);
	});
});

describe("getAllApplications", () => {
	it("returns all applications with student and term data", async () => {
		vi.mocked(db.query.applications.findMany).mockResolvedValue([
			{
				id: "app-1",
				semester: "1ST",
				status: "SUBMITTED",
				referenceNo: "HS-251-2012345",
				submittedAt: new Date(),
				student: { id: "student-1", name: "John Doe", student_number: "2012345" },
				term: { id: 1, schoolYear: "2025-2026", semester: "1ST" },
			},
		] as never);
		mockGrades();

		const result = await getAllApplications("COLLEGE_ADMIN");

		expect(result).toHaveLength(1);
		expect(result[0]?.referenceNo).toBe("HS-251-2012345");
		expect(result[0]?.student?.name).toBe("John Doe");
	});

	it("returns empty array when no applications exist", async () => {
		vi.mocked(db.query.applications.findMany).mockResolvedValue([]);

		const result = await getAllApplications("COLLEGE_ADMIN");

		expect(result).toEqual([]);
	});
});
