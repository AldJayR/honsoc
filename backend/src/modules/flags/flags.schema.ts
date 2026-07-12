import { z } from "zod";

export const FLAG_REASON_CODES = [
	"DOC-001",
	"GRD-002",
	"DOC-003",
	"GRD-004",
	"GRD-006",
	"OTH-005",
] as const;

export const createFlagSchema = z.object({
	reasonCode: z.enum(FLAG_REASON_CODES),
	note: z.string().min(1, "Note is required"),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
