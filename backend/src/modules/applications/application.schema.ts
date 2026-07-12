import { z } from "zod";
import { gradeSchema } from "@/modules/grades/grade.schema.ts";

const yearLevelEnum = z.enum([
	"1ST_YEAR",
	"2ND_YEAR",
	"3RD_YEAR",
	"4TH_YEAR",
	"5TH_YEAR",
]);

const singleSemesterSchema = z.object({
	semester: z.enum(["1ST", "2ND"]),
	yearLevel: yearLevelEnum,
	program: z.string().min(1).max(200),
	majorId: z.number().int().positive().nullable(),
	grades: z.array(gradeSchema).min(1),
});

const bothSemestersSchema = z.object({
	semester: z.literal("BOTH"),
	yearLevel: yearLevelEnum,
	program: z.string().min(1).max(200),
	majorId: z.number().int().positive().nullable(),
	grades_1st: z.array(gradeSchema).min(1),
	grades_2nd: z.array(gradeSchema).min(1),
});

export const createApplicationSchema = z.discriminatedUnion("semester", [
	singleSemesterSchema,
	bothSemestersSchema,
]);

export const applicationIdParamSchema = z.object({
	id: z.string().meta({
		description: "Application ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	}),
});

export const updateStatusSchema = z.object({
	status: z.enum(["SUBMITTED", "UNDER_REVIEW", "FLAGGED", "VERIFIED", "REJECTED"]),
}).meta({ id: "UpdateStatus" });

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
