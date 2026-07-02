import { z } from "zod";
import { gradeSchema } from "@/modules/grades/grade.schema.ts";

const yearLevelEnum = z.enum([
	"1ST_YEAR",
	"2ND_YEAR",
	"3RD_YEAR",
	"4TH_YEAR",
	"5TH_YEAR",
]);

const draftFileSchema = z.object({
	name: z.string(),
	size: z.number(),
	type: z.string(),
});

export const draftDataSchema = z.object({
	profile: z
		.object({
			campusId: z.number().int().positive(),
			departmentId: z.number().int().positive(),
			academicYear: z.string(),
			yearLevel: yearLevelEnum,
			program: z.string().min(1).max(200),
			majorId: z.number().int().positive().nullable(),
		})
		.partial()
		.optional(),
	semesters: z
		.object({
			firstSem: z.boolean(),
			secondSem: z.boolean(),
		})
		.optional(),
	grades1st: z.array(gradeSchema).optional(),
	grades2nd: z.array(gradeSchema).optional(),
	files: z
		.object({
			COR: draftFileSchema.nullable(),
			COG_1ST: draftFileSchema.nullable(),
			COG_2ND: draftFileSchema.nullable(),
			GMC: draftFileSchema.nullable(),
		})
		.optional(),
	currentStep: z.number().int().min(1).max(5).optional(),
});

export type DraftData = z.infer<typeof draftDataSchema>;
