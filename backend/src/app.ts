import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { ZodError } from "zod";
import { env } from "@/config/env.ts";
import authPlugin from "@/auth/plugin.ts";
import sessionHook from "@/auth/guards.ts";
import { userRoutes } from "@/modules/users/user.routes.ts";
import { departmentRoutes } from "@/modules/departments.ts";
import { campusRoutes } from "@/modules/campus.ts";
import { AppError } from "@/lib/errors.ts";

export async function buildApp() {
	const app = Fastify({
		logger: env.NODE_ENV !== "test",
	});

	app.setErrorHandler((error, _request, reply) => {
		if (error instanceof ZodError) {
			return reply.status(422).send({
				error: "Validation Error",
				details: error.issues,
			});
		}
		if (error instanceof AppError) {
			return reply.status(error.statusCode).send({ error: error.message });
		}
		reply.status(500).send({ error: "Internal Server Error" });
	});

	await app.register(cors, {
		origin: env.CORS_ORIGIN,
		credentials: true,
	});

	await app.register(cookie);

	await app.register(authPlugin);
	await app.register(sessionHook);

	await app.register(userRoutes);
	await app.register(departmentRoutes);
	await app.register(campusRoutes);

	return app;
}
