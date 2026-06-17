import { db } from "@/db";
import { applications, grades, terms } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";
import { NotFoundError, UnprocessableError } from "@/lib/errors.ts";
import { checkDisqualifiers } from "@/modules/grades/grade.schema.ts";
import { computeGWA } from "@/modules/grades/gwa.service.ts";

async function verifyApplicationAccess(
	applicationId: string,
	userId: string,
	role: string,
) {
	const app = await db.query.applications.findFirst({
		where: eq(applications.id, applicationId),
	});
	if (!app) {
		throw new NotFoundError("Application not found");
	}
	if (role === "STUDENT" && app.studentId !== userId) {
		throw new NotFoundError("Application not found");
	}
	return app;
}

export async function submitGrades(
	applicationId: string,
	userId: string,
	gradesInput: Array<{
		subjectCode: string;
		subjectName: string;
		units: number;
		grade: string;
	}>,
) {
	const app = await verifyApplicationAccess(applicationId, userId, "STUDENT");

	if (app.status !== "SUBMITTED" && app.status !== "FLAGGED") {
		throw new UnprocessableError(
			"Cannot modify grades for this application",
		);
	}

	const gwa = await computeGWA(applicationId);

	const term = await db.query.terms.findFirst({
		where: eq(terms.id, app.termId),
	});

	const disq = checkDisqualifiers(
		gradesInput.map((g) => ({ grade: g.grade, units: g.units })),
		gwa,
		Number(term?.gwaThreshold ?? 1.75),
	);

	await db.transaction(async (tx) => {
		await tx.delete(grades).where(eq(grades.applicationId, applicationId));
		await tx.insert(grades).values(
			gradesInput.map((g) => ({
				applicationId,
				subjectCode: g.subjectCode,
				subjectName: g.subjectName,
				units: g.units,
				grade: g.grade,
			})),
		);
	});

	return { applicationId, gwa, disqualifiers: disq.reasons };
}

export async function getGrades(
	applicationId: string,
	userId: string,
	role: string,
) {
	await verifyApplicationAccess(applicationId, userId, role);

	return db.query.grades.findMany({
		where: eq(grades.applicationId, applicationId),
	});
}

export async function getGwaWithDisqualifiers(
	applicationId: string,
	userId: string,
	role: string,
) {
	const app = await verifyApplicationAccess(applicationId, userId, role);

	const gwa = await computeGWA(applicationId);

	const term = await db.query.terms.findFirst({
		where: eq(terms.id, app.termId),
	});

	const gradeRows = await db.query.grades.findMany({
		where: eq(grades.applicationId, applicationId),
	});

	const disq = checkDisqualifiers(
		gradeRows.map((g) => ({ grade: g.grade, units: g.units })),
		gwa,
		Number(term?.gwaThreshold ?? 1.75),
	);

	return { gwa, disqualifiers: disq.reasons };
}
