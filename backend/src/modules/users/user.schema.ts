import { z } from "zod";

export const provisionAdminSchema = z.object({
	email: z.email(),
	name: z.string().min(1),
	first_name: z.string().min(1),
	last_name: z.string().min(1),
	role: z.enum(["COLLEGE_ADMIN", "OFFICER"]),
	campus_id: z.number().int().positive(),
	department_id: z.number().int().positive(),
});

export type ProvisionAdminInput = z.infer<typeof provisionAdminSchema>;
