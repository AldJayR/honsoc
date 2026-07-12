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

export const officerIdParamSchema = z.object({
	id: z.string().meta({
		description: "Officer ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	}),
});

export const resendInviteParamSchema = z.object({
	id: z.string().meta({
		description: "Officer ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	}),
});

export const editOfficerSchema = z.object({
	role: z.enum(["COLLEGE_ADMIN", "OFFICER", "PRESIDENT"]).optional(),
	campus_id: z.number().int().positive().optional(),
	department_id: z.number().int().positive().optional(),
}).meta({ id: "EditOfficer" });

export const resendInviteParamsSchema = z.object({
	id: z.string(),
	redirectTo: z.string().url().optional().default("http://localhost:5173/auth/reset-password"),
});

export type ProvisionAdminInput = z.infer<typeof provisionAdminSchema>;
export type EditOfficerInput = z.infer<typeof editOfficerSchema>;
