import { z } from "zod";

export const presignDocumentSchema = z.object({
	applicationId: z.uuid().meta({
		description: "Application ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	}),
	docType: z.enum(["COR", "COG_1ST", "COG_2ND", "GMC"]).meta({
		description: "Document type",
		example: "COG_1ST",
	}),
	fileName: z.string().min(1).meta({
		description: "Original file name",
		example: "scan.pdf",
	}),
}).meta({ id: "PresignDocument" });

export const linkDocumentSchema = z.object({
	applicationId: z.uuid().meta({
		description: "Application ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	}),
	docType: z.enum(["COR", "COG_1ST", "COG_2ND", "GMC"]).meta({
		description: "Document type",
		example: "COG_1ST",
	}),
	objectKey: z.string().min(1).meta({
		description: "R2 object key from presign response",
		example: "applications/550e8400/COG_1ST_abc123.pdf",
	}),
	fileSizeKb: z.number().int().positive().optional().meta({
		description: "File size in kilobytes",
		example: 2048,
	}),
}).meta({ id: "LinkDocument" });

export const documentIdParamSchema = z.object({
	id: z.string().meta({
		description: "Application ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	}),
});

export type PresignDocumentInput = z.infer<typeof presignDocumentSchema>;
export type LinkDocumentInput = z.infer<typeof linkDocumentSchema>;
