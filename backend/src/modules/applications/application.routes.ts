import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { createApplicationSchema } from "@/modules/applications/application.schema.ts";
import {
	applicationIdParamSchema,
	updateStatusSchema,
} from "@/modules/applications/application.schema.ts";
import {
	createApplication,
	getStudentApplications,
	getApplicationById,
	updateApplicationStatus,
	getAllApplications,
} from "@/modules/applications/application.service.ts";

export async function applicationRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/applications",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT"),
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
											yearLevel: { type: "string" },
											program: { type: "string" },
											majorId: { type: ["integer", "null"] },
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
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT"),
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
													yearLevel: { type: "string" },
													program: { type: "string" },
													majorId: { type: ["integer", "null"] },
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
										yearLevel: { type: "string" },
										program: { type: "string" },
										majorId: { type: ["integer", "null"] },
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

	fastify.get(
		"/api/applications",
		{
			preHandler: requireRole("COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "Get all applications",
				description: "Returns all applications with student and term data. Available to COLLEGE_ADMIN and PRESIDENT.",
				tags: ["Applications"],
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
											id: { type: "string" },
											semester: { type: "string" },
											yearLevel: { type: "string" },
											program: { type: "string" },
											gwa: { type: ["number", "null"] },
											status: { type: "string" },
											referenceNo: { type: "string" },
											submittedAt: { type: "string", format: "date-time" },
											student: {
												type: "object",
												properties: {
													id: { type: "string" },
													name: { type: "string" },
													student_number: { type: ["string", "null"] },
												},
											},
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
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			const applications = await getAllApplications(request.user!.role);
			return reply.send(applications);
		},
	);

	fastify.patch(
		"/api/applications/:id/status",
		{
			preHandler: requireRole("COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "Update application status",
				description: "Update application status. VERIFY is hard-blocked if disqualifiers exist (422). Records audit entry.",
				tags: ["Applications"],
				security: [{ cookieAuth: [] }],
				params: applicationIdParamSchema,
				body: updateStatusSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string" },
										status: { type: "string" },
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
			const { status } = updateStatusSchema.parse(request.body);
			const result = await updateApplicationStatus(
				id,
				request.user!.id,
				request.user!.role,
				status,
			);
			return reply.send(result);
		},
	);
}
