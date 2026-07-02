import { z } from "zod";

export const programsByDepartment: Record<string, string[]> = {
	ARCH: ["BS in Architecture"],
	EDUC: ["BS in Education"],
	COE: [
		"BS in Civil Engineering",
		"BS in Electrical Engineering",
		"BS in Mechanical Engineering",
	],
	CRIM: ["BS in Criminology"],
	CICT: ["BS in Information Technology", "BS in Data Science"],
	CMBT: ["BS in Business Administration"],
	CON: ["BS in Nursing"],
	COA: ["BS in Agriculture"],
	CAS: [
		"BS in Biology",
		"BS in Psychology",
		"BS in Environmental Science",
		"BS in Chemistry",
		"BS in Food Technology",
	],
	CIT: ["Bachelor of Industrial Technology"],
	CPADM: ["BS in Public Administration"],
	ILL: ["BA in Literary and Cultural"],
};

export const profileSchema = z.object({
	campusId: z.string().min(1, "Campus is required"),
	departmentId: z.string().min(1, "Department is required"),
	academicYear: z.string().min(1, "Academic year is required"),
	yearLevel: z.enum([
		"1ST_YEAR",
		"2ND_YEAR",
		"3RD_YEAR",
		"4TH_YEAR",
	]),
	program: z.string().min(1, "Program is required"),
	majorId: z.string(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface MinimalDepartment {
	id: number;
	name: string;
	code: string;
}

export const getRefinedProfileSchema = (departments: MinimalDepartment[]) => {
	return profileSchema.superRefine((data, ctx) => {
		const selectedDept = departments.find((d) => d.id.toString() === data.departmentId);
		if (!selectedDept) return;

		// Architecture/4th year constraint
		if (data.yearLevel === "4TH_YEAR" && selectedDept.code !== "ARCH") {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "4th year is only available for College of Architecture",
				path: ["yearLevel"],
			});
		}

		// Program/Department alignment constraint
		const validPrograms = programsByDepartment[selectedDept.code] || [];
		if (!validPrograms.includes(data.program)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Selected program is not offered by ${selectedDept.name}`,
				path: ["program"],
			});
		}
	});
};
