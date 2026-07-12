import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { createFlagSchema } from "@/modules/flags/flags.schema.ts";
import { applicationIdParamSchema } from "@/modules/applications/application.schema.ts";
import { createFlag, getFlags } from "@/modules/flags/flags.service.ts";

export async function flagRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/applications/:id/flags",
		{
			preHandler: requireRole("COLLEGE_ADMIN"),
			schema: {
				summary: "Flag an application",
				description: "Create a flag for an application, auto-sets status to FLAGGED, writes audit entry.",
				tags: ["Flags"],
				security: [{ cookieAuth: [] }],
				params: applicationIdParamSchema,
				body: createFlagSchema,
				response: {
					201: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "integer" },
										applicationId: { type: "string" },
										reasonCode: { type: "string" },
										note: { type: "string" },
										flaggedBy: { type: "string" },
										flaggedAt: { type: "string", format: "date-time" },
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
			const input = createFlagSchema.parse(request.body);
			const flag = await createFlag(id, request.user!.id, input);
			return reply.status(201).send(flag);
		},
	);

	fastify.get(
		"/api/applications/:id/flags",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "Get flags for an application",
				tags: ["Flags"],
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
											reasonCode: { type: "string" },
											note: { type: "string" },
											flaggedBy: { type: "string" },
											flaggedAt: { type: "string", format: "date-time" },
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
			const result = await getFlags(id, request.user!.id, request.user!.role);
			return reply.send(result);
		},
	);
}
