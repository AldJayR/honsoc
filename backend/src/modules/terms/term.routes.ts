import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import {
	createTermSchema,
	updateTermSchema,
	termIdParamSchema,
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
		{
			preHandler: requireRole("PRESIDENT"),
			schema: {
				summary: "Create a new term",
				tags: ["Terms"],
				security: [{ cookieAuth: [] }],
				body: createTermSchema,
				response: {
					201: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "integer" },
										schoolYear: { type: "string" },
										semester: { type: "string" },
										gwaThreshold: { type: "string" },
										isActive: { type: "boolean" },
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			const input = createTermSchema.parse(request.body);
			const term = await createTerm(input);
			return reply.status(201).send(term);
		},
	);

	fastify.get(
		"/api/terms/active",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "OFFICER", "PRESIDENT"),
			schema: {
				summary: "Get the currently active term",
				tags: ["Terms"],
				security: [{ cookieAuth: [] }],
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "integer" },
										schoolYear: { type: "string" },
										semester: { type: "string" },
										gwaThreshold: { type: "string" },
										isActive: { type: "boolean" },
									},
								},
							},
						},
					},
					404: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: { type: "string" },
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
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
		{
			preHandler: requireRole("PRESIDENT"),
			schema: {
				summary: "List all terms",
				tags: ["Terms"],
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
											schoolYear: { type: "string" },
											semester: { type: "string" },
											gwaThreshold: { type: "string" },
											isActive: { type: "boolean" },
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
			const allTerms = await listTerms();
			return reply.send(allTerms);
		},
	);

	fastify.patch(
		"/api/terms/:id",
		{
			preHandler: requireRole("PRESIDENT"),
			schema: {
				summary: "Update a term",
				tags: ["Terms"],
				security: [{ cookieAuth: [] }],
				params: termIdParamSchema,
				body: updateTermSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "integer" },
										schoolYear: { type: "string" },
										semester: { type: "string" },
										gwaThreshold: { type: "string" },
										isActive: { type: "boolean" },
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
			const input = updateTermSchema.parse(request.body);
			const term = await updateTerm(Number(id), input);
			return reply.send(term);
		},
	);
}
