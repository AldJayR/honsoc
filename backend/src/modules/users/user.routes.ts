import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { auth } from "@/auth/index.ts";
import { env } from "@/config/env.ts";
import { provisionAdminSchema } from "@/modules/users/user.schema.ts";
import { provisionAdmin } from "@/modules/users/user.service.ts";

export async function userRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/api/me",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT"),
			schema: {
				summary: "Get current user profile",
				tags: ["Users"],
				security: [{ cookieAuth: [] }],
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string" },
										name: { type: "string" },
										email: { type: "string" },
										role: { type: "string" },
										student_number: { type: ["string", "null"] },
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			return reply.send(request.user);
		},
	);

	fastify.post(
		"/api/admin/provision",
		{
			preHandler: requireRole("PRESIDENT"),
			schema: {
				summary: "Provision an officer account",
				description: "Creates a new officer account and sends a password-setup invite email.",
				tags: ["Admin"],
				security: [{ cookieAuth: [] }],
				body: provisionAdminSchema,
				response: {
					201: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string" },
										email: { type: "string" },
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			const input = provisionAdminSchema.parse(request.body);
			const result = await provisionAdmin(input);
			try {
				// Generates a password reset token and fires sendResetPassword callback
				// which checks user.status and sends the invite-officer template
				await auth.api.requestPasswordReset({
					body: {
						email: input.email,
						redirectTo: `${env.BETTER_AUTH_URL}/auth/reset-password`,
					},
				});
			} catch (error) {
				request.log.error(error, "Failed to send invite email");
				return reply.status(201).send({
					...result,
					inviteEmailFailed: true,
				});
			}
			return reply.status(201).send(result);
		},
	);
}
