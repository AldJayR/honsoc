import type { FastifyInstance } from "fastify";
import { requireRole } from "@/auth/guards.ts";
import { createApplicationSchema } from "@/modules/applications/application.schema.ts";
import {
	createApplication,
	getStudentApplications,
	getApplicationById,
} from "@/modules/applications/application.service.ts";

export async function applicationRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/applications",
		{ preHandler: requireRole("STUDENT") },
		async (request, reply) => {
			const input = createApplicationSchema.parse(request.body);
			const result = await createApplication(request.user!.id, input);
			return reply.status(201).send(result);
		},
	);

	fastify.get(
		"/api/applications/mine",
		{ preHandler: requireRole("STUDENT") },
		async (request, reply) => {
			const applications = await getStudentApplications(request.user!.id);
			return reply.send({ applications });
		},
	);

	fastify.get(
		"/api/applications/:id",
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT") },
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const app = await getApplicationById(
				id,
				request.user!.id,
				request.user!.role,
			);
			return reply.send(app);
		},
	);
}
