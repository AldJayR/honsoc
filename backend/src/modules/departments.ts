import { db } from "@/db";
import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";

export async function departmentRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/api/departments",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT"),
			schema: {
				summary: "List all departments",
				tags: ["Departments"],
				security: [{ cookieAuth: [] }],
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: { type: "integer" },
											code: { type: "string" },
											name: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (_request, reply) => {
			const result = await db.query.departments.findMany();
			return reply.send(result);
		},
	);
}
