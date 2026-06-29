import { z } from "zod";

export const step1Schema = z.object({
	firstName: z.string().min(1, "First name is required"),
	middleName: z.string().optional().default(""),
	lastName: z.string().min(1, "Last name is required"),
	middleInitial: z.string().optional().default(""),
	studentNumber: z.string().min(1, "Student number is required"),
});

export const step2Schema = z
	.object({
		email: z.email("Please enter a valid email address"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.regex(/[a-zA-Z]/, "Password must contain at least one letter")
			.regex(/[0-9]/, "Password must contain at least one number"),
		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type Step1Values = z.input<typeof step1Schema>;
export type Step2Values = z.input<typeof step2Schema>;
