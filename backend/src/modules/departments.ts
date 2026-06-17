import { db } from "@/db";
import type { FastifyInstance } from "fastify";
import { requireRole } from "@/auth/guards.ts";

export async function departmentRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/api/departments",
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT") },
		async (_request, reply) => {
			const result = await db.query.departments.findMany();
			return reply.send(result);
		},
	);
}
