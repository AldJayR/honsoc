import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import { getAuditLog } from "@/modules/audit-log/audit-log.service.ts";
import { z } from "zod";

const auditLogFilterSchema = z.object({
	action: z.string().min(1).optional(),
	from: z.iso.date().optional(),
	to: z.iso.date().optional(),
	timezoneOffset: z.coerce.number().int().min(-840).max(840).optional(),
}).refine(
	({ from, to }) => !from || !to || from <= to,
	{ message: "'from' must be on or before 'to'" },
);

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
				querystring: auditLogFilterSchema,
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
													program: { type: "string" },
													yearLevel: { type: "string" },
													student: {
														type: "object",
														properties: {
															name: { type: "string" },
															student_number: { type: ["string", "null"] },
														},
													},
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
			const filters = auditLogFilterSchema.parse(request.query);
			const result = await getAuditLog(filters);
			return reply.send(result);
		},
	);
}
