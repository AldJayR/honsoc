import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url(),
	BETTER_AUTH_SECRET: z
		.string()
		.min(32)
		.regex(
			/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			"Must contain uppercase, lowercase, and digit",
		),
	BETTER_AUTH_URL: z.url(),
	PORT: z.coerce.number().default(3000),
	HOST: z.string().default("0.0.0.0"),
	CORS_ORIGIN: z.url(),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	R2_ENDPOINT: z.url(),
	R2_ACCESS_KEY_ID: z.string().min(1),
	R2_SECRET_ACCESS_KEY: z.string().min(1),
	R2_BUCKET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
