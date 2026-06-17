import type { FastifyInstance } from "fastify";
import { requireRole } from "@/auth/guards.ts";
import { auth } from "@/auth/index.ts";
import { env } from "@/config/env.ts";
import { provisionAdminSchema } from "@/modules/users/user.schema.ts";
import { provisionAdmin } from "@/modules/users/user.service.ts";

export async function userRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/api/me",
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT") },
		async (request, reply) => {
			return reply.send(request.user);
		},
	);

	fastify.post(
		"/api/admin/provision",
		{ preHandler: requireRole("PRESIDENT") },
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
}
