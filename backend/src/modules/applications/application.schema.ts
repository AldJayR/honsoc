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

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
