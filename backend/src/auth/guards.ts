import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { auth } from "@/auth/index.ts";

declare module "fastify" {
	interface FastifyRequest {
		user: {
			id: string;
			name: string;
			email: string;
			first_name: string;
			middle_name: string | null;
			middle_initial: string | null;
			last_name: string;
			extension: string | null;
			student_number: string | null;
			role: string;
			campus_id: number | null;
			department_id: number | null;
			status: string;
		} | null;
	}
}

async function sessionHook(fastify: FastifyInstance) {
	fastify.decorateRequest("user", null);

	fastify.addHook("onRequest", async (request) => {
		if (request.url.startsWith("/api/auth")) {
			return;
		}

		const session = await auth.api.getSession({
			headers: request.headers as Record<string, string>,
		});

		request.user = (session?.user ?? null) as FastifyRequest["user"];
	});
}

export function requireRole(...roles: string[]) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		if (!request.user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}
		if (!roles.includes(request.user.role)) {
			return reply
				.status(403)
				.send({ error: "Forbidden", message: `Requires ${roles.join(" or ")}` });
		}
	};
}

export default fp(sessionHook, { name: "session" });
