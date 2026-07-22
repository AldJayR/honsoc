import { z } from "zod";

export const FLAG_REASONS = [
	"INCORRECT_GRADE",
	"BLURRY_DOCUMENTS",
	"INCOMPLETE_SUBMISSION",
	"OTHER",
] as const;

export const createFlagSchema = z.object({
	reasonCode: z.enum(FLAG_REASONS),
	note: z.string().min(1, "Note is required"),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
