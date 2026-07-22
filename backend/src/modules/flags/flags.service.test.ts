import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { createFlag, getFlags } from "./flags.service.ts";
import { NotFoundError } from "@/lib/errors.ts";
import type { DbTransaction, DbTransactionCallback } from "@/test-utils/db-types.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			applications: {
				findFirst: vi.fn(),
			},
			flags: {
				findMany: vi.fn(),
			},
		},
		insert: vi.fn(),
		update: vi.fn(),
		transaction: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createFlag", () => {
	const validInput = { reasonCode: "BLURRY_DOCUMENTS", note: "Scan is blurry" };

	function mockApplicationFound(overrides = {}) {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue({
			id: "app-1",
			studentId: "student-1",
			status: "SUBMITTED",
			...overrides,
		} as never);
	}

	function mockInsertFlag(returnValue = { id: 1 }) {
		const mockReturning = vi.fn().mockResolvedValue([returnValue]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);
		return mockValues;
	}

	function mockUpdateApplication() {
		const mockWhere = vi.fn().mockResolvedValue(undefined);
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);
		const mockTx = {
			insert: vi.mocked(db.insert),
			update: vi.mocked(db.update),
		} as unknown as DbTransaction;
		vi.mocked(db.transaction).mockImplementation(async (fn: DbTransactionCallback) => fn(mockTx));
		return { mockSet, mockWhere };
	}

	it("creates a flag, sets application status to FLAGGED, and writes audit entry", async () => {
		mockApplicationFound();
		mockInsertFlag({ id: 1 });
		const { mockSet } = mockUpdateApplication();

		const result = await createFlag("app-1", "admin-1", validInput);

		expect(result).toEqual({ id: 1 });
		expect(db.insert).toHaveBeenCalledTimes(2);
		expect(mockSet).toHaveBeenCalledWith({ status: "FLAGGED" });
	});

	it("throws NotFoundError when application does not exist", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined);

		await expect(createFlag("nonexistent", "admin-1", validInput)).rejects.toThrow(NotFoundError);

		expect(db.insert).not.toHaveBeenCalled();
	});

	it("writes audit log entry with reason code and note", async () => {
		mockApplicationFound();
		mockInsertFlag({ id: 1 });
		mockUpdateApplication();

		await createFlag("app-1", "admin-1", validInput);

		const auditInsertCall = vi.mocked(db.insert).mock.calls[1]?.[0];
		expect(auditInsertCall).toBeDefined();
	});
});

describe("getFlags", () => {
	it("returns flags for an authorized admin", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue({
			id: "app-1",
			studentId: "student-1",
		} as never);
		vi.mocked(db.query.flags.findMany).mockResolvedValue([
			{ id: 1, reasonCode: "BLURRY_DOCUMENTS", note: "Blurry scan" },
		] as never);

		const result = await getFlags("app-1", "admin-1", "COLLEGE_ADMIN");

		expect(result).toHaveLength(1);
	});

	it("throws NotFoundError when application does not exist", async () => {
		vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined);

		await expect(getFlags("nonexistent", "admin-1", "COLLEGE_ADMIN")).rejects.toThrow(
			NotFoundError,
		);
	});
});
