import { z } from "zod";

export const provisionAdminSchema = z.object({
	email: z.email().meta({
		description: "Officer's email address",
		example: "officer@neust.edu.ph",
	}),
	name: z.string().min(1).meta({
		description: "Full name (computed from components)",
		example: "Maria C. Santos",
	}),
	first_name: z.string().min(1).meta({
		description: "First name",
		example: "Maria",
	}),
	last_name: z.string().min(1).meta({
		description: "Last name",
		example: "Santos",
	}),
	role: z.enum(["COLLEGE_ADMIN", "OFFICER"]).meta({
		description: "Admin role",
		example: "COLLEGE_ADMIN",
	}),
	campus_id: z.number().int().positive().meta({
		description: "Assigned campus ID",
		example: 1,
	}),
	department_id: z.number().int().positive().meta({
		description: "Assigned department ID",
		example: 2,
	}),
}).meta({ id: "ProvisionAdmin" });

export type ProvisionAdminInput = z.infer<typeof provisionAdminSchema>;
