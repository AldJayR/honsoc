import { z } from "zod";

export const createTermSchema = z.object({
	schoolYear: z.string().meta({
		description: "School year (e.g. '2025-2026')",
		example: "2025-2026",
	}),
	semester: z.enum(["1ST", "2ND", "BOTH"]).meta({
		description: "Semester(s) open for application",
		example: "BOTH",
	}),
	gwaThreshold: z.string().default("1.75").meta({
		description: "Minimum GWA required for verification",
		example: "1.75",
	}),
}).meta({ id: "CreateTerm" });

export const updateTermSchema = createTermSchema.partial().meta({ id: "UpdateTerm" });

export const termIdParamSchema = z.object({
	id: z.string().meta({
		description: "Term ID",
		example: "1",
	}),
});

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
