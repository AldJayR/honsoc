import { db } from "@/db";
import type { FastifyInstance } from "fastify";
import { requireRole } from "@/auth/guards.ts";

export async function campusRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/api/campus",
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT") },
		async (_request, reply) => {
			const result = await db.query.campus.findMany();
			return reply.send(result);
		},
	);
}
