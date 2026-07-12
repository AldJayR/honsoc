import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { getAuditLog } from "@/modules/audit-log/audit-log.service.ts";

export async function auditLogRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/api/audit-log",
		{
			preHandler: requireRole("COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "Get audit log entries",
				description: "Returns filterable audit log with actor and application data.",
				tags: ["Audit Log"],
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
											action: { type: "string" },
											note: { type: ["string", "null"] },
											createdAt: { type: "string", format: "date-time" },
											actor: {
												type: "object",
												properties: {
													id: { type: "string" },
													name: { type: "string" },
													role: { type: "string" },
												},
											},
											application: {
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
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			const result = await getAuditLog();
			return reply.send(result);
		},
	);
}
