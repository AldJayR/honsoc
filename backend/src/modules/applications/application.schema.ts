import { z } from "zod";
import { gradeSchema } from "@/modules/grades/grade.schema.ts";

const singleSemesterSchema = z.object({
	semester: z.enum(["1ST", "2ND"]),
	grades: z.array(gradeSchema).min(1),
});

const bothSemestersSchema = z.object({
	semester: z.literal("BOTH"),
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

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
