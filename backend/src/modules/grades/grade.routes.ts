import type { FastifyInstance } from "fastify";
import { requireRole } from "@/auth/guards.ts";
import { z } from "zod";
import { db } from "@/db";
import {
	applications,
	grades,
	terms,
} from "@/db/schema/index.ts";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ForbiddenError, UnprocessableError } from "@/lib/errors.ts";
import { gradeSchema } from "@/modules/grades/grade.schema.ts";
import { computeGWA } from "@/modules/grades/gwa.service.ts";
import { checkDisqualifiers } from "@/modules/grades/grade.schema.ts";

const addGradesSchema = z.object({
	grades: z.array(gradeSchema).min(1),
});

export async function gradeRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/api/applications/:id/grades",
		{ preHandler: requireRole("STUDENT") },
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const { grades: gradeRows } = addGradesSchema.parse(request.body);

			const app = await db.query.applications.findFirst({
				where: eq(applications.id, id),
			});
			if (!app) {
				throw new NotFoundError("Application not found");
			}
			if (app.studentId !== request.user!.id) {
				throw new NotFoundError("Application not found");
			}
			if (app.status !== "SUBMITTED" && app.status !== "FLAGGED") {
				throw new UnprocessableError(
					"Cannot modify grades for this application",
				);
			}

			const term = await db.query.terms.findFirst({
				where: eq(terms.id, app.termId),
			});

			const disq = checkDisqualifiers(
				gradeRows.map((g) => ({ grade: g.grade, units: g.units })),
				term?.minUnits ?? 18,
			);

			await db.transaction(async (tx) => {
				await tx.delete(grades).where(eq(grades.applicationId, id));
				await tx.insert(grades).values(
					gradeRows.map((g) => ({
						applicationId: id,
						subjectName: g.subjectName,
						units: g.units,
						grade: g.grade,
					})),
				);
			});

			const gwa = await computeGWA(id);

			return reply.send({
				applicationId: id,
				gwa,
				disqualifiers: disq.reasons,
			});
		},
	);

	fastify.get(
		"/api/applications/:id/grades",
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT") },
		async (request, reply) => {
			const { id } = request.params as { id: string };

			const app = await db.query.applications.findFirst({
				where: eq(applications.id, id),
			});
			if (!app) {
				throw new NotFoundError("Application not found");
			}
			if (
				request.user!.role === "STUDENT" &&
				app.studentId !== request.user!.id
			) {
				throw new NotFoundError("Application not found");
			}

			const gradeRows = await db.query.grades.findMany({
				where: eq(grades.applicationId, id),
			});

			return reply.send(gradeRows);
		},
	);

	fastify.get(
		"/api/applications/:id/gwa",
		{ preHandler: requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT") },
		async (request, reply) => {
			const { id } = request.params as { id: string };

			const app = await db.query.applications.findFirst({
				where: eq(applications.id, id),
			});
			if (!app) {
				throw new NotFoundError("Application not found");
			}
			if (
				request.user!.role === "STUDENT" &&
				app.studentId !== request.user!.id
			) {
				throw new NotFoundError("Application not found");
			}

			const gwa = await computeGWA(id);

			const term = await db.query.terms.findFirst({
				where: eq(terms.id, app.termId),
			});

			const gradeRows = await db.query.grades.findMany({
				where: eq(grades.applicationId, id),
			});

			const disq = checkDisqualifiers(
				gradeRows.map((g) => ({ grade: g.grade, units: g.units })),
				term?.minUnits ?? 18,
			);

			return reply.send({ gwa, disqualifiers: disq.reasons });
		},
	);
}
