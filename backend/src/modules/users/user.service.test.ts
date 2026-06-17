import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { provisionAdmin } from "./user.service.ts";
import { ConflictError } from "@/lib/errors.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			users: {
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(),
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
