import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema/index.ts";
import { env } from "@/config/env.ts";
import { sendEmail } from "@/lib/email.ts";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),

	user: {
		additionalFields: {
			first_name: { type: "string", required: true, input: true },
			middle_name: { type: "string", input: true },
			middle_initial: { type: "string", input: true },
			last_name: { type: "string", required: true, input: true },
			extension: { type: "string", input: true },
			student_number: { type: "string", input: true },
			role: { type: "string", input: false },
			campus_id: { type: "number", input: true },
			department_id: { type: "number", input: true },
			status: { type: "string", input: false },
		},
	},

	session: {
		expiresIn: 1800,
		updateAge: 300,
		storeSessionInDatabase: true,
		cookieCache: { enabled: true, maxAge: 300 },
	},

	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail(user.email, "Reset your password", url);
		},
	},

	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail(user.email, "Verify your email", url);
		},
	},

	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== "/sign-up/email") {
				return;
			}
			const password = ctx.body?.password;
			if (typeof password !== "string") {
				return;
			}
			if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
				throw new APIError("BAD_REQUEST", {
					message:
						"Password must contain at least one letter and one number",
				});
			}
		}),
	},

	trustedOrigins: [env.CORS_ORIGIN],
});
