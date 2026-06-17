import { z } from "zod";

export const createTermSchema = z.object({
	schoolYear: z.string(),
	semester: z.enum(["1ST", "2ND", "BOTH"]),
	gwaThreshold: z.string().default("1.75"),
});

export const updateTermSchema = createTermSchema.partial();

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
