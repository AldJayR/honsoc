import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { z } from "zod";
import {
	applicationIdParamSchema,
} from "@/modules/applications/application.schema.ts";
import { gradeSchema } from "@/modules/grades/grade.schema.ts";
import {
	submitGrades,
	getGrades,
	getGwaWithDisqualifiers,
} from "@/modules/grades/grade.service.ts";

const addGradesSchema = z.object({
	grades: z.array(gradeSchema).min(1),
});

export async function gradeRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/applications/:id/grades",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Submit grades for an application",
				description: "Replace all grades for an application. Recomputes GWA and checks disqualifiers.",
				tags: ["Grades"],
				security: [{ cookieAuth: [] }],
				params: applicationIdParamSchema,
				body: addGradesSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										applicationId: { type: "string" },
										gwa: { type: ["number", "null"] },
										disqualifiers: {
											type: "array",
											items: {
												type: "object",
												properties: {
													code: { type: "string" },
													message: { type: "string" },
												},
											},
										},
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
			const { grades: gradeRows } = addGradesSchema.parse(request.body);
			const result = await submitGrades(id, request.user!.id, gradeRows);
			return reply.send(result);
		},
	);

	fastify.get(
		"/api/applications/:id/grades",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "Get grades for an application",
				tags: ["Grades"],
				security: [{ cookieAuth: [] }],
				params: applicationIdParamSchema,
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
											applicationId: { type: "string" },
											subjectCode: { type: "string" },
											subjectName: { type: "string" },
											units: { type: "integer" },
											grade: { type: "string" },
										},
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
			const result = await getGrades(id, request.user!.id, request.user!.role);
			return reply.send(result);
		},
	);

	fastify.get(
		"/api/applications/:id/gwa",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "Get GWA and disqualifiers for an application",
				tags: ["Grades"],
				security: [{ cookieAuth: [] }],
				params: applicationIdParamSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										gwa: { type: ["number", "null"] },
										disqualifiers: {
											type: "array",
											items: {
												type: "object",
												properties: {
													code: { type: "string" },
													message: { type: "string" },
												},
											},
										},
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
			const result = await getGwaWithDisqualifiers(
				id,
				request.user!.id,
				request.user!.role,
			);
			return reply.send(result);
		},
	);
}
