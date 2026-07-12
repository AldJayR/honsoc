import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { logAction, getAuditLog } from "./audit-log.service.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			auditLog: {
				findMany: vi.fn(),
			},
		},
		insert: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("logAction", () => {
	it("inserts an audit log entry with actor, application, action, and note", async () => {
		const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

		await logAction("actor-1", "app-1", "VERIFIED", "All good");

		expect(db.insert).toHaveBeenCalledOnce();
		expect(mockValues).toHaveBeenCalledWith({
			actorId: "actor-1",
			applicationId: "app-1",
			action: "VERIFIED",
			note: "All good",
		});
	});

	it("inserts audit log entry without optional note", async () => {
		const mockReturning = vi.fn().mockResolvedValue([{ id: 2 }]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

		await logAction("actor-1", "app-1", "SUBMITTED");

		expect(mockValues).toHaveBeenCalledWith({
			actorId: "actor-1",
			applicationId: "app-1",
			action: "SUBMITTED",
			note: undefined,
		});
	});
});

describe("getAuditLog", () => {
	it("returns audit log entries with actor and application data", async () => {
		const mockEntries = [
			{
				id: 1,
				action: "VERIFIED",
				note: "All good",
				createdAt: new Date(),
				actor: { id: "actor-1", name: "Admin", role: "COLLEGE_ADMIN" },
				application: { id: "app-1", referenceNo: "HS-251-2012345", semester: "1ST" },
			},
		];
		vi.mocked(db.query.auditLog.findMany).mockResolvedValue(mockEntries as never);

		const result = await getAuditLog();

		expect(result).toHaveLength(1);
		expect(result[0]?.action).toBe("VERIFIED");
		expect(result[0]?.actor?.name).toBe("Admin");
		expect(result[0]?.application?.referenceNo).toBe("HS-251-2012345");
	});

	it("returns empty array when no entries exist", async () => {
		vi.mocked(db.query.auditLog.findMany).mockResolvedValue([]);

		const result = await getAuditLog();

		expect(result).toEqual([]);
	});
});
