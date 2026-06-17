import type { FastifyInstance } from "fastify";
import { requireRole } from "@/auth/guards.ts";
import {
	createTermSchema,
	updateTermSchema,
} from "@/modules/terms/term.schema.ts";
import {
	createTerm,
	listTerms,
	getActiveTerm,
	updateTerm,
} from "@/modules/terms/term.service.ts";

export async function termRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/terms",
		{ preHandler: requireRole("PRESIDENT") },
		async (request, reply) => {
			const input = createTermSchema.parse(request.body);
			const term = await createTerm(input);
			return reply.status(201).send(term);
		},
	);

	fastify.get(
		"/api/terms/active",
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT") },
		async (_request, reply) => {
			const term = await getActiveTerm();
			if (!term) {
				return reply.status(404).send({ error: "No active term" });
			}
			return reply.send(term);
		},
	);

	fastify.get(
		"/api/terms",
		{ preHandler: requireRole("PRESIDENT") },
		async (_request, reply) => {
			const allTerms = await listTerms();
			return reply.send(allTerms);
		},
	);

	fastify.patch(
		"/api/terms/:id",
		{ preHandler: requireRole("PRESIDENT") },
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const input = updateTermSchema.parse(request.body);
			const term = await updateTerm(Number(id), input);
			return reply.send(term);
		},
	);
}
