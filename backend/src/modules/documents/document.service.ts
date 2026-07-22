import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { applications, documents } from "@/db/schema/index.ts";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ForbiddenError } from "@/lib/errors.ts";
import { generatePresignedDownloadUrl, generatePresignedUrl } from "@/lib/storage.ts";
import type {
	PresignDocumentInput,
	LinkDocumentInput,
} from "@/modules/documents/document.schema.ts";

function getExtension(fileName: string): string {
	const dot = fileName.lastIndexOf(".");
	return dot >= 0 ? fileName.slice(dot) : ".bin";
}

function getContentType(fileName: string): string {
	switch (getExtension(fileName).toLowerCase()) {
		case ".pdf":
			return "application/pdf";
		case ".png":
			return "image/png";
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		default:
			return "application/octet-stream";
	}
}

async function verifyOwnership(
	applicationId: string,
	userId: string,
	role: string,
) {
	const app = await db.query.applications.findFirst({
		where: eq(applications.id, applicationId),
		columns: { studentId: true },
	});
	if (!app) {
		throw new NotFoundError("Application not found");
	}
	if (role === "STUDENT" && app.studentId !== userId) {
		throw new ForbiddenError("You can only upload to your own application");
	}
	return app;
}

export async function presignDocument(
	input: PresignDocumentInput,
	userId: string,
	role: string,
) {
	await verifyOwnership(input.applicationId, userId, role);

	const ext = getExtension(input.fileName);
	const uniqueId = randomUUID();
	const objectKey = `applications/${input.applicationId}/${input.docType}_${uniqueId}${ext}`;

	const contentType = getContentType(input.fileName);
	const url = await generatePresignedUrl(objectKey, contentType);

	return { url, objectKey, contentType };
}

export async function linkDocument(
	input: LinkDocumentInput,
	userId: string,
	role: string,
) {
	await verifyOwnership(input.applicationId, userId, role);

	const [doc] = await db
		.insert(documents)
		.values({
			applicationId: input.applicationId,
			docType: input.docType,
			objectKey: input.objectKey,
			fileSizeKb: input.fileSizeKb,
		})
		.returning({
			id: documents.id,
			docType: documents.docType,
			objectKey: documents.objectKey,
		});

	return doc;
}

export async function listDocuments(
	applicationId: string,
	userId: string,
	role: string,
) {
	await verifyOwnership(applicationId, userId, role);

	const docs = await db.query.documents.findMany({
		where: eq(documents.applicationId, applicationId),
	});

	return Promise.all(
		docs.map(async (document) => ({
			...document,
			url: await generatePresignedDownloadUrl(
				document.objectKey,
				getContentType(document.objectKey),
			),
		})),
	);
}
