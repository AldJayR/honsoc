import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { requireRole } from "@/auth/guards.ts";
import {
	presignDocumentSchema,
	linkDocumentSchema,
	documentIdParamSchema,
} from "@/modules/documents/document.schema.ts";
import {
	presignDocument,
	linkDocument,
	listDocuments,
} from "@/modules/documents/document.service.ts";

export async function documentRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/documents/presign",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Get presigned upload URL",
				description: "Generate a presigned R2 URL for direct client upload.",
				tags: ["Documents"],
				security: [{ cookieAuth: [] }],
				body: presignDocumentSchema,
				response: {
					200: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										url: { type: "string", format: "uri" },
										objectKey: { type: "string" },
										contentType: { type: "string" },
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			const input = presignDocumentSchema.parse(request.body);
			const result = await presignDocument(
				input,
				request.user!.id,
				request.user!.role,
			);
			return reply.send(result);
		},
	);

	fastify.post(
		"/api/documents/link",
		{
			preHandler: requireRole("STUDENT"),
			schema: {
				summary: "Link uploaded document",
				description: "Record an uploaded file in the documents table after client-side R2 upload.",
				tags: ["Documents"],
				security: [{ cookieAuth: [] }],
				body: linkDocumentSchema,
				response: {
					201: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "integer" },
										docType: { type: "string" },
										objectKey: { type: "string" },
									},
								},
							},
						},
					},
				},
			} satisfies FastifyZodOpenApiSchema,
		},
		async (request, reply) => {
			const input = linkDocumentSchema.parse(request.body);
			const doc = await linkDocument(
				input,
				request.user!.id,
				request.user!.role,
			);
			return reply.status(201).send(doc);
		},
	);

	fastify.get(
		"/api/applications/:id/documents",
		{
			preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT"),
			schema: {
				summary: "List application documents",
				tags: ["Documents"],
				security: [{ cookieAuth: [] }],
				params: documentIdParamSchema,
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
											docType: { type: "string" },
											objectKey: { type: "string" },
										fileSizeKb: { type: ["integer", "null"] },
										uploadedAt: { type: "string", format: "date-time" },
										url: { type: "string", format: "uri" },
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
			const docs = await listDocuments(
				id,
				request.user!.id,
				request.user!.role,
			);
			return reply.send(docs);
		},
	);
}
