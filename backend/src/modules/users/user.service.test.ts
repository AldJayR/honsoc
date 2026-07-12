import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { provisionAdmin, editOfficer, deactivateOfficer, resendInvite } from "./user.service.ts";
import { ConflictError, NotFoundError, UnprocessableError } from "@/lib/errors.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			users: {
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(),
		update: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("provisionAdmin", () => {
	const validInput = {
		email: "officer@email.com",
		name: "Maria C. Santos",
		first_name: "Maria",
		last_name: "Santos",
		role: "OFFICER" as const,
		campus_id: 1,
		department_id: 2,
	};

	function mockInsertSuccess(result: { id: string; email: string }) {
		const mockReturning = vi.fn().mockResolvedValue([result]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);
		return { mockValues, mockReturning };
	}

	it("inserts a user with INVITE_PENDING status, creates accounts record, and returns id and email", async () => {
		const expected = { id: "new-user-1", email: "officer@email.com" };
		const { mockValues } = mockInsertSuccess(expected);
		vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

		const result = await provisionAdmin(validInput);

		expect(result).toEqual(expected);
		expect(db.insert).toHaveBeenCalledTimes(2);
		expect(mockValues).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				email: "officer@email.com",
				name: "Maria C. Santos",
				role: "OFFICER",
				status: "INVITE_PENDING",
				campus_id: 1,
				department_id: 2,
			}),
		);
		expect(mockValues).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				providerId: "credential",
			}),
		);
	});

	it("rejects with ConflictError when email already exists", async () => {
		vi.mocked(db.query.users.findFirst).mockResolvedValue({
			id: "existing-id",
		} as never);

		await expect(provisionAdmin(validInput)).rejects.toThrow(ConflictError);
		expect(db.insert).not.toHaveBeenCalled();
	});

	it("creates a COLLEGE_ADMIN when that role is specified", async () => {
		const adminInput = { ...validInput, role: "COLLEGE_ADMIN" as const };
		const expected = { id: "u-3", email: adminInput.email };
		const { mockValues } = mockInsertSuccess(expected);
		vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

		await provisionAdmin(adminInput);

		expect(mockValues).toHaveBeenCalledWith(
			expect.objectContaining({ role: "COLLEGE_ADMIN" }),
		);
	});
});

describe("editOfficer", () => {
	function mockUpdateSuccess(result: { id: string; email: string; role: string }) {
		const mockReturning = vi.fn().mockResolvedValue([result]);
		const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);
		return { mockSet };
	}

	it("updates officer role", async () => {
		const { mockSet } = mockUpdateSuccess({
			id: "officer-1", email: "officer@email.com", role: "COLLEGE_ADMIN",
		});

		const result = await editOfficer("officer-1", { role: "COLLEGE_ADMIN" });

		expect(result.role).toBe("COLLEGE_ADMIN");
		expect(mockSet).toHaveBeenCalledWith({ role: "COLLEGE_ADMIN" });
	});

	it("throws NotFoundError when officer does not exist", async () => {
		const mockReturning = vi.fn().mockResolvedValue([]);
		const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

		await expect(
			editOfficer("nonexistent", { role: "COLLEGE_ADMIN" }),
		).rejects.toThrow(NotFoundError);
	});
});

describe("deactivateOfficer", () => {
	it("sets officer status to INACTIVE", async () => {
		const mockReturning = vi.fn().mockResolvedValue([
			{ id: "officer-1", email: "officer@email.com" },
		]);
		const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

		const result = await deactivateOfficer("officer-1");

		expect(result.id).toBe("officer-1");
		expect(mockSet).toHaveBeenCalledWith({ status: "INACTIVE" });
	});

	it("throws NotFoundError when officer does not exist", async () => {
		const mockReturning = vi.fn().mockResolvedValue([]);
		const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

		await expect(deactivateOfficer("nonexistent")).rejects.toThrow(NotFoundError);
	});
});

describe("resendInvite", () => {
	it("throws NotFoundError when officer does not exist", async () => {
		vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

		await expect(
			resendInvite("nonexistent", "http://example.com/reset"),
		).rejects.toThrow(NotFoundError);
	});

	it("throws UnprocessableError when officer is not INVITE_PENDING", async () => {
		vi.mocked(db.query.users.findFirst).mockResolvedValue({
			id: "officer-1",
			email: "officer@email.com",
			status: "ACTIVE",
		} as never);

		await expect(
			resendInvite("officer-1", "http://example.com/reset"),
		).rejects.toThrow(UnprocessableError);
	});
});
