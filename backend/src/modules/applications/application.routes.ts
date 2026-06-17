import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { createApplicationSchema } from "@/modules/applications/application.schema.ts";
import {
	applicationIdParamSchema,
} from "@/modules/applications/application.schema.ts";
import {
	createApplication,
	getStudentApplications,
	getApplicationById,
} from "@/modules/applications/application.service.ts";

export async function applicationRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/applications",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Submit an application",
				description: "Submit a single-semester or both-semester application. 'Both' splits into two independent records.",
				tags: ["Applications"],
				security: [{ cookieAuth: [] }],
				body: createApplicationSchema,
				response: {
					201: {
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: { type: "string" },
											referenceNo: { type: "string" },
											semester: { type: "string" },
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
			const input = createApplicationSchema.parse(request.body);
			const result = await createApplication(request.user!.id, input);
			return reply.status(201).send(result);
		},
	);

	fastify.get(
		"/api/applications/mine",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Get my applications",
				tags: ["Applications"],
				security: [{ cookieAuth: [] }],
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										applications: {
											type: "array",
											items: {
												type: "object",
												properties: {
													id: { type: "string" },
													semester: { type: "string" },
													status: { type: "string" },
													referenceNo: { type: "string" },
													gwa: { type: ["number", "null"] },
													submittedAt: { type: "string", format: "date-time" },
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
			const applications = await getStudentApplications(request.user!.id);
			return reply.send({ applications });
		},
	);

	fastify.get(
		"/api/applications/:id",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "Get application by ID",
				tags: ["Applications"],
				security: [{ cookieAuth: [] }],
				params: applicationIdParamSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string" },
										semester: { type: "string" },
										status: { type: "string" },
										referenceNo: { type: "string" },
										gwa: { type: ["number", "null"] },
										submittedAt: { type: "string", format: "date-time" },
										term: {
											type: "object",
											properties: {
												id: { type: "integer" },
												schoolYear: { type: "string" },
												semester: { type: "string" },
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
			const app = await getApplicationById(
				id,
				request.user!.id,
				request.user!.role,
			);
			return reply.send(app);
		},
	);
}
