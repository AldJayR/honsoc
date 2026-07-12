import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { auth } from "@/auth/index.ts";
import { env } from "@/config/env.ts";
import {
	provisionAdminSchema,
	editOfficerSchema,
	officerIdParamSchema,
	resendInviteParamSchema,
} from "@/modules/users/user.schema.ts";
import {
	provisionAdmin,
	editOfficer,
	deactivateOfficer,
	resendInvite,
} from "@/modules/users/user.service.ts";

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

	fastify.put(
		"/api/admin/officers/:id",
		{
			preHandler: requireRole("PRESIDENT"),
			schema: {
				summary: "Edit officer",
				description: "Update officer role, campus, or department.",
				tags: ["Admin"],
				security: [{ cookieAuth: [] }],
				params: officerIdParamSchema,
				body: editOfficerSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string" },
										email: { type: "string" },
										role: { type: "string" },
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const input = editOfficerSchema.parse(request.body);
			const result = await editOfficer(id, input);
			return reply.send(result);
		},
	);

	fastify.delete(
		"/api/admin/officers/:id",
		{
			preHandler: requireRole("PRESIDENT"),
			schema: {
				summary: "Deactivate officer",
				description: "Set officer status to INACTIVE (soft delete).",
				tags: ["Admin"],
				security: [{ cookieAuth: [] }],
				params: officerIdParamSchema,
				response: {
					200: {
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
			const { id } = request.params as { id: string };
			const result = await deactivateOfficer(id);
			return reply.send(result);
		},
	);

	fastify.post(
		"/api/admin/officers/:id/resend-invite",
		{
			preHandler: requireRole("PRESIDENT"),
			schema: {
				summary: "Resend officer invite",
				description: "Resend password-setup invite for INVITE_PENDING officers.",
				tags: ["Admin"],
				security: [{ cookieAuth: [] }],
				params: resendInviteParamSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
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
			const { id } = request.params as { id: string };
			const redirectTo = `${env.BETTER_AUTH_URL}/auth/reset-password`;
			const result = await resendInvite(id, redirectTo);
			return reply.send(result);
		},
	);
}
