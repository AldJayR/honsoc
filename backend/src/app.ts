import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import {
	fastifyZodOpenApiPlugin,
	fastifyZodOpenApiTransformers,
	serializerCompiler,
	validatorCompiler,
} from "fastify-zod-openapi";
import { ZodError } from "zod";
import { env } from "@/config/env.ts";
import authPlugin from "@/auth/plugin.ts";
import sessionHook from "@/auth/guards.ts";
import { userRoutes } from "@/modules/users/user.routes.ts";
import { departmentRoutes } from "@/modules/departments.ts";
import { campusRoutes } from "@/modules/campus.ts";
import { termRoutes } from "@/modules/terms/term.routes.ts";
import { applicationRoutes } from "@/modules/applications/application.routes.ts";
import { documentRoutes } from "@/modules/documents/document.routes.ts";
import { gradeRoutes } from "@/modules/grades/grade.routes.ts";
import { AppError } from "@/lib/errors.ts";

export async function buildApp() {
	const app = Fastify({
		logger: env.NODE_ENV !== "test",
	});

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

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

	await app.register(fastifyZodOpenApiPlugin);

	await app.register(fastifySwagger, {
		openapi: {
			info: {
				title: "NEUST Honor Society Verification System",
				description: "Backend API for NHSVS — student application submission, grade verification, and Honor Roll generation",
				version: "1.0.0",
			},
			servers: [
				{ url: "http://localhost:3000", description: "Development" },
			],
			components: {
				securitySchemes: {
					cookieAuth: {
						type: "apiKey",
						in: "cookie",
						name: "better-auth.session_token",
					},
				},
			},
		},
		...fastifyZodOpenApiTransformers,
	});

	await app.register(fastifySwaggerUI, {
		routePrefix: "/documentation",
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
	await app.register(termRoutes);
	await app.register(applicationRoutes);
	await app.register(documentRoutes);
	await app.register(gradeRoutes);

	return app;
}
