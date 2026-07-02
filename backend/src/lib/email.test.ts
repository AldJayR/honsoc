import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { boss } from "@/lib/queue.ts";
import { sendEmail } from "@/lib/email.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			users: {
				findFirst: vi.fn(),
			},
		},
	},
}));

vi.mock("@/lib/queue.ts", () => ({
	boss: {
		send: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("sendEmail", () => {
	it("looks up user name and enqueues with userName", async () => {
		vi.mocked(db.query.users.findFirst).mockResolvedValue({
			name: "Juan",
		} as never);

		await sendEmail(
			"juan@test.com",
			"verify-email",
			"https://example.com/verify",
		);

		expect(boss.send).toHaveBeenCalledWith("emails", {
			to: "juan@test.com",
			template: "verify-email",
			props: { userName: "Juan", url: "https://example.com/verify" },
		});
	});

	it('falls back to "User" when user not found', async () => {
		vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

		await sendEmail(
			"unknown@test.com",
			"reset-password",
			"https://example.com/reset",
		);

		expect(boss.send).toHaveBeenCalledWith("emails", {
			to: "unknown@test.com",
			template: "reset-password",
			props: { userName: "User", url: "https://example.com/reset" },
		});
	});

	it("passes through url to the job", async () => {
		vi.mocked(db.query.users.findFirst).mockResolvedValue({
			name: "Maria",
		} as never);

		await sendEmail(
			"maria@test.com",
			"invite-officer",
			"https://example.com/invite?token=abc123",
		);

		expect(boss.send).toHaveBeenCalledWith(
			"emails",
			expect.objectContaining({
				props: expect.objectContaining({
					url: "https://example.com/invite?token=abc123",
				}),
			}),
		);
	});
});
