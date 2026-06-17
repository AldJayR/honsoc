import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { presignDocument, linkDocument, listDocuments } from "./document.service.ts";
import { NotFoundError, ForbiddenError } from "@/lib/errors.ts";
import { generatePresignedUrl } from "@/lib/storage.ts";

vi.mock("@/db", () => ({
	db: {
		query: {
			applications: {
				findFirst: vi.fn(),
			},
			documents: {
				findMany: vi.fn(),
			},
		},
		insert: vi.fn(),
	},
}));

vi.mock("@/lib/storage.ts", () => ({
	generatePresignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/signed-url"),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

function mockApplicationExists(studentId = "student-1") {
	vi.mocked(db.query.applications.findFirst).mockResolvedValue({
		studentId,
	} as never);
}

function mockApplicationNotFound() {
	vi.mocked(db.query.applications.findFirst).mockResolvedValue(undefined);
}

describe("presignDocument", () => {
	it("generates a presigned URL for own application", async () => {
		mockApplicationExists();

		const result = await presignDocument(
			{
				applicationId: "app-1",
				docType: "COG_1ST",
				fileName: "scan.pdf",
			},
			"student-1",
			"STUDENT",
		);

		expect(result.url).toBe("https://r2.example.com/signed-url");
		expect(result.objectKey).toMatch(/^applications\/app-1\/COG_1ST_/);
		expect(result.objectKey).toContain(".pdf");
		expect(generatePresignedUrl).toHaveBeenCalledWith(
			expect.stringContaining("applications/app-1/COG_1ST_"),
			"application/octet-stream",
		);
	});

	it("throws ForbiddenError when student accesses other student's application", async () => {
		mockApplicationExists("other-student");

		await expect(
			presignDocument(
				{
					applicationId: "app-1",
					docType: "COR",
					fileName: "cor.pdf",
				},
				"student-1",
				"STUDENT",
			),
		).rejects.toThrow(ForbiddenError);
	});

	it("throws NotFoundError when application does not exist", async () => {
		mockApplicationNotFound();

		await expect(
			presignDocument(
				{
					applicationId: "nonexistent",
					docType: "COR",
					fileName: "cor.pdf",
				},
				"student-1",
				"STUDENT",
			),
		).rejects.toThrow(NotFoundError);
	});

	it("allows PRESIDENT to presign for any application", async () => {
		mockApplicationExists("any-student");

		const result = await presignDocument(
			{
				applicationId: "app-1",
				docType: "GMC",
				fileName: "gmc.pdf",
			},
			"president-1",
			"PRESIDENT",
		);

		expect(result.url).toBeTruthy();
		expect(result.objectKey).toContain("GMC");
	});
});

describe("linkDocument", () => {
	it("links a document to own application", async () => {
		mockApplicationExists();

		const mockReturning = vi.fn().mockResolvedValue([
			{
				id: 1,
				docType: "COG_1ST",
				objectKey: "applications/app-1/COG_1ST_abc.pdf",
			},
		]);
		const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
		vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

		const result = await linkDocument(
			{
				applicationId: "app-1",
				docType: "COG_1ST",
				objectKey: "applications/app-1/COG_1ST_abc.pdf",
				fileSizeKb: 1024,
			},
			"student-1",
			"STUDENT",
		);

		expect(result?.docType).toBe("COG_1ST");
		expect(result?.objectKey).toBe("applications/app-1/COG_1ST_abc.pdf");
	});

	it("throws ForbiddenError when student links to other student's application", async () => {
		mockApplicationExists("other-student");

		await expect(
			linkDocument(
				{
					applicationId: "app-1",
					docType: "COR",
					objectKey: "applications/app-1/COR_abc.pdf",
				},
				"student-1",
				"STUDENT",
			),
		).rejects.toThrow(ForbiddenError);
	});
});

describe("listDocuments", () => {
	it("returns documents for own application", async () => {
		mockApplicationExists();

		const expected = [
			{ id: 1, docType: "COR", objectKey: "applications/app-1/COR_abc.pdf" },
			{ id: 2, docType: "COG_1ST", objectKey: "applications/app-1/COG_1ST_abc.pdf" },
		];
		vi.mocked(db.query.documents.findMany).mockResolvedValue(expected as never);

		const result = await listDocuments("app-1", "student-1", "STUDENT");

		expect(result).toEqual(expected);
	});

	it("throws NotFoundError when application does not exist", async () => {
		mockApplicationNotFound();

		await expect(
			listDocuments("nonexistent", "student-1", "STUDENT"),
		).rejects.toThrow(NotFoundError);
	});

	it("throws ForbiddenError when student lists other student's documents", async () => {
		mockApplicationExists("other-student");

		await expect(
			listDocuments("app-1", "student-1", "STUDENT"),
		).rejects.toThrow(ForbiddenError);
	});
});
