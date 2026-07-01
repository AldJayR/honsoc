import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import {
	createApplication,
	getStudentApplications,
	getApplicationById,
} from "./application.service.ts";
import { UnprocessableError, NotFoundError, ConflictError } from "@/lib/errors.ts";

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
		transaction: vi.fn(),
	},
}));

vi.mock("@/modules/grades/gwa.service.ts", () => ({
	computeGWA: vi.fn().mockResolvedValue(1.5),
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

		const mockApp = { id: "app-1", referenceNo: "HS-251-1-2012345" };
		const mockReturning = vi.fn().mockResolvedValue([mockApp]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockGradesInsert = vi.fn().mockResolvedValue([]);
		const mockTx = {
			insert: vi.fn().mockReturnValue({ values: mockGradesInsert }),
		};
		mockTx.insert.mockReturnValueOnce({ values: mockValues });
		mockTx.insert.mockReturnValueOnce({ values: mockGradesInsert });
		vi.mocked(db.transaction).mockImplementation(
			async (fn: any) => fn(mockTx),
		);

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

		const mockReturning = vi.fn().mockResolvedValue([
			{ id: "app-1", referenceNo: "HS-251-1-2012345" },
			{ id: "app-2", referenceNo: "HS-252-2-2012345" },
		]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockGradesInsert = vi.fn().mockResolvedValue([]);
		const mockTx = {
			insert: vi.fn().mockReturnValue({ values: mockGradesInsert }),
		};
		mockTx.insert.mockReturnValueOnce({ values: mockValues });
		mockTx.insert.mockReturnValueOnce({ values: mockGradesInsert });
		mockTx.insert.mockReturnValueOnce({ values: mockValues });
		mockTx.insert.mockReturnValueOnce({ values: mockGradesInsert });
		vi.mocked(db.transaction).mockImplementation(
			async (fn: any) => fn(mockTx),
		);

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

		const mockApp = { id: "app-1", referenceNo: "HS-251-1-2012345" };
		const mockReturning = vi.fn().mockResolvedValue([mockApp]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockGradesInsert = vi.fn().mockResolvedValue([]);
		const mockTx = {
			insert: vi.fn().mockReturnValue({ values: mockGradesInsert }),
		};
		mockTx.insert.mockReturnValueOnce({ values: mockValues });
		mockTx.insert.mockReturnValueOnce({ values: mockGradesInsert });
		vi.mocked(db.transaction).mockImplementation(
			async (fn: any) => fn(mockTx),
		);

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
		} as never);
		vi.mocked(db.query.terms.findFirst).mockResolvedValue({
			id: 1,
			schoolYear: "2025-2026",
		} as never);

		const result = await getApplicationById(
			"app-1",
			"student-1",
			"STUDENT",
		);

		expect(result.id).toBe("app-1");
		expect(result.gwa).toBe(1.5);
	});

	it("throws NotFoundError for student accessing other student's application", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue({
			id: "app-1",
			studentId: "other-student",
		} as never);

		await expect(
			getApplicationById("app-1", "student-1", "STUDENT"),
		).rejects.toThrow(NotFoundError);
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
		} as never);
		vi.mocked(db.query.terms.findFirst).mockResolvedValue({
			id: 1,
			schoolYear: "2025-2026",
		} as never);

		const result = await getApplicationById(
			"app-1",
			"president-1",
			"PRESIDENT",
		);

		expect(result.id).toBe("app-1");
	});

	it("throws NotFoundError when application does not exist", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined);

		await expect(
			getApplicationById("nonexistent", "student-1", "STUDENT"),
		).rejects.toThrow(NotFoundError);
	});
});
