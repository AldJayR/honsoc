import { describe, it, expect, vi, beforeEach } from "vitest";
import { boss } from "@/lib/queue.ts";
import { resend } from "@/lib/resend.ts";
import { registerWorker } from "@/lib/worker.ts";

vi.mock("@/lib/queue.ts", () => ({
	boss: {
		work: vi.fn(),
	},
}));

vi.mock("@/lib/resend.ts", () => ({
	resend: {
		emails: {
			send: vi.fn(),
		},
	},
}));

vi.mock("@/config/env.ts", () => ({
	env: {
		RESEND_FROM: "NHSVS <noreply@nhsvs.app>",
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

function captureHandler(): Function {
	const calls = vi.mocked(boss.work).mock.calls;
	expect(calls[0]?.[0]).toBe("emails");
	return calls[0]?.[1] as Function;
}

describe("registerWorker", () => {
	it("throws on unknown email template", async () => {
		await registerWorker();
		const handler = captureHandler();

		await expect(
			handler([
				{
					data: {
						to: "test@test.com",
						template: "unknown-template",
						props: { userName: "Test", url: "https://example.com" },
					},
				},
			]),
		).rejects.toThrow("Unknown email template: unknown-template");
	});

	it("throws on Resend error", async () => {
		vi.mocked(resend.emails.send).mockResolvedValue({
			data: null,
			error: {
				message: "API quota exceeded",
				statusCode: 429,
				name: "rate_limit_exceeded",
			},
			headers: null,
		});

		await registerWorker();
		const handler = captureHandler();

		await expect(
			handler([
				{
					data: {
						to: "user@test.com",
						template: "verify-email",
						props: { userName: "Test", url: "https://example.com" },
					},
				},
			]),
		).rejects.toThrow("Resend error: API quota exceeded");
	});
});
