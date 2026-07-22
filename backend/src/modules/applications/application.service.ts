import { db } from "@/db";
import {
	applications,
	grades,
	terms,
	users,
} from "@/db/schema/index.ts";
import { eq, and, inArray } from "drizzle-orm";
import { UnprocessableError, NotFoundError, ConflictError } from "@/lib/errors.ts";
import type { CreateApplicationInput } from "@/modules/applications/application.schema.ts";
import type { GradeInput } from "@/modules/grades/grade.schema.ts";
import { computeGWA } from "@/modules/grades/gwa.service.ts";
import { checkDisqualifiers } from "@/modules/grades/grade.schema.ts";
import { logAction } from "@/modules/audit-log/audit-log.service.ts";

export async function updateApplicationStatus(
	applicationId: string,
	actorId: string,
	actorRole: string,
	newStatus: string,
	note?: string,
): Promise<{ id: string; status: string }> {
	const app = await db.query.applications.findFirst({
		where: eq(applications.id, applicationId),
		with: { grades: true, documents: true },
	});
	if (!app) throw new NotFoundError("Application not found");

	if (newStatus === "VERIFIED") {
		const requiredDocumentTypes = [
			"COR",
			"GMC",
			app.semester === "1ST" ? "COG_1ST" : "COG_2ND",
		];
		const uploadedDocumentTypes = new Set(app.documents.map((document) => document.docType));
		const missingDocuments = requiredDocumentTypes.filter(
			(documentType) => !uploadedDocumentTypes.has(documentType),
		);
		if (missingDocuments.length > 0) {
			throw new UnprocessableError(
				`Cannot verify: missing required documents (${missingDocuments.join(", ")})`,
			);
		}

		const term = await db.query.terms.findFirst({
			where: eq(terms.id, app.termId),
		});
		const gwa = await computeGWA(applicationId);
		const disq = checkDisqualifiers(
			app.grades.map((g) => ({ grade: g.grade, units: g.units })),
			gwa,
			Number(term?.gwaThreshold ?? 1.75),
		);
		if (disq.hasDisqualifier) {
			throw new UnprocessableError(
				`Cannot verify: ${disq.reasons.map((r) => r.message).join("; ")}`,
			);
		}
	}

	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(applications)
			.set({
				status: newStatus as "SUBMITTED" | "UNDER_REVIEW" | "FLAGGED" | "VERIFIED" | "REJECTED" | "ESCALATED",
				reviewedBy: newStatus === "VERIFIED" ? actorId : undefined,
			})
			.where(eq(applications.id, applicationId))
			.returning({ id: applications.id, status: applications.status });

		if (!updated) throw new NotFoundError("Application not found");

		const auditAction = newStatus === "VERIFIED" ? "VERIFIED"
			: newStatus === "FLAGGED" ? "FLAGGED"
			: newStatus === "REJECTED" ? "REJECTED"
			: newStatus === "ESCALATED" ? "ESCALATED"
			: "REVIEWED";
		await logAction(actorId, applicationId, auditAction, newStatus === "ESCALATED" ? note : null, tx);

		return updated;
	});
}

export async function getAllApplications(role: string) {
	const apps = await db.query.applications.findMany({
		with: {
			student: { columns: { id: true, name: true, student_number: true } },
			term: { columns: { id: true, schoolYear: true, semester: true } },
		},
		orderBy: (a, { desc }) => [desc(a.submittedAt)],
	});

	if (apps.length === 0) return [];

	const appIds = apps.map((a) => a.id);
	const allGrades = await db
		.select()
		.from(grades)
		.where(inArray(grades.applicationId, appIds));

	const gradesByApp = allGrades.reduce((acc, g) => {
		const appId = g.applicationId;
		if (!appId) return acc;
		let list = acc[appId];
		if (!list) {
			list = [];
			acc[appId] = list;
		}
		list.push(g);
		return acc;
	}, {} as Record<string, typeof allGrades>);

	return apps.map((app) => {
		const rows = gradesByApp[app.id] || [];
		const numericGrades = rows.filter((g) => /^[0-9.]+$/.test(g.grade));
		let gwa: number | null = null;
		if (numericGrades.length > 0) {
			const totalWeighted = numericGrades.reduce(
				(sum, g) => sum + Number.parseFloat(g.grade) * g.units,
				0,
			);
			const totalUnits = numericGrades.reduce((sum, g) => sum + g.units, 0);
			gwa = Math.round((totalWeighted / totalUnits) * 100) / 100;
		}
		return {
			...app,
			gwa,
		};
	});
}

function generateReferenceNo(
	schoolYear: string,
	semester: string,
	studentNumber: string,
): string {
	const parts = schoolYear.split("-");
	const yearStart = Number.parseInt(parts[0] ?? "0", 10);
	const yy = String(yearStart).slice(-2);
	const sem = semester === "1ST" ? "1" : "2";
	return `HS-${yy}${sem}-${studentNumber}`;
}

function getGradesForSemester(
	input: CreateApplicationInput,
	sem: "1ST" | "2ND",
): GradeInput[] {
	if (input.semester === "BOTH") {
		return sem === "1ST" ? input.grades_1st : input.grades_2nd;
	}
	return input.grades;
}

export async function createApplication(
	studentId: string,
	input: CreateApplicationInput,
) {
	const term = await db.query.terms.findFirst({
		where: eq(terms.isActive, true),
	});
	if (!term) {
		throw new UnprocessableError("No active term");
	}

	if (input.semester === "BOTH" && term.semester !== "BOTH") {
		throw new UnprocessableError(
			"Active term does not accept Both Semesters applications",
		);
	}

	const student = await db.query.users.findFirst({
		where: eq(users.id, studentId),
		columns: { student_number: true },
	});
	if (!student?.student_number) {
		throw new UnprocessableError("Student number not found");
	}

	const semesters =
		input.semester === "BOTH" ? (["1ST", "2ND"] as const) : [input.semester];

	for (const sem of semesters) {
		const existing = await db.query.applications.findFirst({
			where: and(
				eq(applications.studentId, studentId),
				eq(applications.termId, term.id),
				eq(applications.semester, sem),
			),
			columns: { id: true },
		});
		if (existing) {
			throw new ConflictError(
				`Application for ${sem} semester already exists in this term`,
			);
		}
	}

	const results = await db.transaction(async (tx) => {
		const created: Array<{
			id: string;
			referenceNo: string;
			semester: string;
		}> = [];

		for (const sem of semesters) {
			const gradeRows = getGradesForSemester(input, sem);

			const referenceNo = generateReferenceNo(
				term.schoolYear,
				sem,
				student.student_number!,
			);

			const [app] = await tx
				.insert(applications)
				.values({
					studentId,
					termId: term.id,
					semester: sem,
					yearLevel: input.yearLevel,
					program: input.program,
					majorId: input.majorId,
					referenceNo,
				})
				.returning({ id: applications.id, referenceNo: applications.referenceNo });

			if (!app) {
				throw new Error("Failed to create application");
			}

			await tx.insert(grades).values(
				gradeRows.map((g) => ({
					applicationId: app.id,
					subjectCode: g.subjectCode,
					subjectName: g.subjectName,
					units: g.units,
					grade: g.grade,
				})),
			);

			created.push({
				id: app.id,
				referenceNo: app.referenceNo,
				semester: sem,
			});
		}

		return created;
	});

	return results;
}

export async function getStudentApplications(studentId: string) {
	const apps = await db.query.applications.findMany({
		where: eq(applications.studentId, studentId),
		orderBy: (a, { desc }) => [desc(a.submittedAt)],
	});

	if (apps.length === 0) return [];

	const appIds = apps.map((a) => a.id);
	const allGrades = await db
		.select()
		.from(grades)
		.where(inArray(grades.applicationId, appIds));

	const gradesByApp = allGrades.reduce((acc, g) => {
		const appId = g.applicationId;
		if (!appId) return acc;
		let list = acc[appId];
		if (!list) {
			list = [];
			acc[appId] = list;
		}
		list.push(g);
		return acc;
	}, {} as Record<string, typeof allGrades>);

	return apps.map((app) => {
		const rows = gradesByApp[app.id] || [];
		const numericGrades = rows.filter((g) => /^[0-9.]+$/.test(g.grade));
		let gwa: number | null = null;
		if (numericGrades.length > 0) {
			const totalWeighted = numericGrades.reduce(
				(sum, g) => sum + Number.parseFloat(g.grade) * g.units,
				0,
			);
			const totalUnits = numericGrades.reduce((sum, g) => sum + g.units, 0);
			gwa = Math.round((totalWeighted / totalUnits) * 100) / 100;
		}
		return {
			id: app.id,
			semester: app.semester,
			yearLevel: app.yearLevel,
			program: app.program,
			majorId: app.majorId,
			status: app.status,
			referenceNo: app.referenceNo,
			gwa,
			submittedAt: app.submittedAt,
		};
	});
}

export async function getApplicationById(
	applicationId: string,
	userId: string,
	role: string,
) {
	const app = await db.query.applications.findFirst({
		where: eq(applications.id, applicationId),
		with: { student: true },
	});

	if (!app) {
		throw new NotFoundError("Application not found");
	}

	if (role === "STUDENT" && app.studentId !== userId) {
		throw new NotFoundError("Application not found");
	}

	const gwa = await computeGWA(app.id);
	const termData = await db.query.terms.findFirst({
		where: eq(terms.id, app.termId),
	});

		return {
			id: app.id,
			semester: app.semester,
			yearLevel: app.yearLevel,
			program: app.program,
			student: app.student,
			majorId: app.majorId,
			status: app.status,
			referenceNo: app.referenceNo,
			gwa,
			submittedAt: app.submittedAt,
			term: termData,
		};
}
