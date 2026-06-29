import { z } from "zod";

export const profileSchema = z.object({
	campusId: z.string().min(1, "Campus is required"),
	departmentId: z.string().min(1, "Department is required"),
	academicYear: z.string().min(1, "Academic year is required"),
	yearLevel: z.enum([
		"1ST_YEAR",
		"2ND_YEAR",
		"3RD_YEAR",
		"4TH_YEAR",
		"5TH_YEAR",
	]),
	program: z.string().min(1, "Program is required"),
	majorId: z.string(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
