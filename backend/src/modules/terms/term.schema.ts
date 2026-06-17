import { z } from "zod";

export const createTermSchema = z.object({
	schoolYear: z.string(),
	semester: z.enum(["1ST", "2ND", "BOTH"]),
	gwaThreshold: z.string().default("1.75"),
	minUnits: z.number().int().default(18),
	deadline: z.string(),
});

export const updateTermSchema = createTermSchema.partial();

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
