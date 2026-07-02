import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { auth } from "@/auth/index.ts";

async function authPlugin(fastify: FastifyInstance) {
	fastify.all("/api/auth/*", async (request, reply) => {
		try {
			const url = `${request.protocol}://${request.hostname}${request.url}`;

			const headers = new Headers();
			for (const [key, value] of Object.entries(request.headers)) {
				if (value) {
					headers.set(key, Array.isArray(value) ? value.join(", ") : value);
				}
			}

			let body: BodyInit | null = null;
			if (request.body && !["GET", "HEAD"].includes(request.method)) {
				body = JSON.stringify(request.body);
				headers.set("content-type", "application/json");
			}

			const webResponse = await auth.handler(
				new Request(url, {
					method: request.method,
					headers,
					body,
				}),
			);

			console.log("BETTER-AUTH RESPONSE STATUS:", webResponse.status);
			console.log("BETTER-AUTH RESPONSE TEXT:", await webResponse.clone().text());

			reply.status(webResponse.status);
			webResponse.headers.forEach((value, key) => reply.header(key, value));
			return reply.send(await webResponse.text());
		} catch (error) {
			console.error("AUTH PLUGIN HANDLER ERROR:", error);
			throw error;
		}
	});
}

export default fp(authPlugin, { name: "auth" });
