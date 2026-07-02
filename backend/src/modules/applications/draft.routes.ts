import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { draftDataSchema } from "@/modules/applications/draft.schema.ts";
import {
	getDraft,
	saveDraft,
	deleteDraft,
} from "@/modules/applications/draft.service.ts";

export async function draftRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/api/applications/draft",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Get my application draft",
				description:
					"Returns the authenticated student's in-progress application draft, or 404 if none exists.",
				tags: ["Drafts"],
				security: [{ cookieAuth: [] }],
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string" },
										data: {
											type: "object",
											additionalProperties: true,
										},
										createdAt: {
											type: "string",
											format: "date-time",
										},
										updatedAt: {
											type: "string",
											format: "date-time",
										},
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
		async (request, reply) => {
			const draft = await getDraft(request.user!.id);
			if (!draft) {
				return reply.status(404).send({ error: "No draft found" });
			}
			return reply.send(draft);
		},
	);

	fastify.put(
		"/api/applications/draft",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Save my application draft",
				description:
					"Creates or updates the authenticated student's in-progress application draft.",
				tags: ["Drafts"],
				security: [{ cookieAuth: [] }],
				body: draftDataSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string" },
										updatedAt: {
											type: "string",
											format: "date-time",
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
			const data = draftDataSchema.parse(request.body);
			const result = await saveDraft(request.user!.id, data);
			return reply.send(result);
		},
	);

	fastify.delete(
		"/api/applications/draft",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Delete my application draft",
				description:
					"Deletes the authenticated student's in-progress application draft.",
				tags: ["Drafts"],
				security: [{ cookieAuth: [] }],
				response: {
					204: {
						description: "Draft deleted",
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (_request, reply) => {
			await deleteDraft(_request.user!.id);
			return reply.status(204).send();
		},
	);
}
