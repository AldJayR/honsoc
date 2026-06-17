import type { FastifyInstance } from "fastify";
import { requireRole } from "@/auth/guards.ts";
import {
	presignDocumentSchema,
	linkDocumentSchema,
} from "@/modules/documents/document.schema.ts";
import {
	presignDocument,
	linkDocument,
	listDocuments,
} from "@/modules/documents/document.service.ts";

export async function documentRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/documents/presign",
		{ preHandler: requireRole("STUDENT") },
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
		{ preHandler: requireRole("STUDENT") },
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
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT") },
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
