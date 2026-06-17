import { z } from "zod";

export const presignDocumentSchema = z.object({
	applicationId: z.uuid(),
	docType: z.enum(["COR", "COG_1ST", "COG_2ND", "GMC"]),
	fileName: z.string().min(1),
});

export const linkDocumentSchema = z.object({
	applicationId: z.uuid(),
	docType: z.enum(["COR", "COG_1ST", "COG_2ND", "GMC"]),
	objectKey: z.string().min(1),
	fileSizeKb: z.number().int().positive().optional(),
});

export type PresignDocumentInput = z.infer<typeof presignDocumentSchema>;
export type LinkDocumentInput = z.infer<typeof linkDocumentSchema>;
