import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { saveDraft, deleteDraft } from "./draft.service.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			applicationDrafts: {
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("saveDraft", () => {
	it("creates a new draft when none exists", async () => {
		vi.mocked(db.query.applicationDrafts.findFirst).mockResolvedValue(
			undefined,
		);

		const now = new Date();
		const mockReturning = vi.fn().mockResolvedValue([
			{ id: "draft-1", updatedAt: now },
		]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

		const result = await saveDraft("user-1", { currentStep: 2 });

		expect(result).toEqual({ id: "draft-1", updatedAt: now });
		expect(db.insert).toHaveBeenCalledTimes(1);
		expect(mockValues).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-1" }),
		);
	});

	it("updates existing draft when one exists", async () => {
		vi.mocked(db.query.applicationDrafts.findFirst).mockResolvedValue({
			id: "draft-1",
		} as never);

		const now = new Date();
		const mockReturning = vi.fn().mockResolvedValue([
			{ id: "draft-1", updatedAt: now },
		]);
		const mockWhere = vi
			.fn()
			.mockReturnValue({ returning: mockReturning });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

		const result = await saveDraft("user-1", { currentStep: 3, profile: { campusId: 1 } });

		expect(result).toEqual({ id: "draft-1", updatedAt: now });
		expect(db.update).toHaveBeenCalledTimes(1);
		expect(mockSet).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { currentStep: 3, profile: { campusId: 1 } },
			}),
		);
		expect(mockWhere).toHaveBeenCalled();
	});
});

describe("deleteDraft", () => {
	it("deletes draft by user id", async () => {
		const mockWhere = vi.fn().mockResolvedValue(undefined);
		vi.mocked(db.delete).mockReturnValue({ where: mockWhere } as never);

		await deleteDraft("user-1");

		expect(db.delete).toHaveBeenCalledTimes(1);
		expect(mockWhere).toHaveBeenCalled();
	});
});
