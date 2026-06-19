import { db } from "@/db";
import {
	applications,
	grades,
	terms,
	users,
} from "@/db/schema/index.ts";
import { eq, and } from "drizzle-orm";
import { UnprocessableError, NotFoundError, ConflictError } from "@/lib/errors.ts";
import type { CreateApplicationInput } from "@/modules/applications/application.schema.ts";
import type { GradeInput } from "@/modules/grades/grade.schema.ts";
import { computeGWA } from "@/modules/grades/gwa.service.ts";

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

	if (input.semester !== "BOTH" && term.semester === "BOTH") {
		throw new UnprocessableError(
			"Active term requires Both Semesters applications",
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
					major: input.major,
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

		const results = await Promise.all(
		apps.map(async (app) => {
			const gwa = await computeGWA(app.id);
			return {
				id: app.id,
				semester: app.semester,
				yearLevel: app.yearLevel,
				program: app.program,
				major: app.major,
				status: app.status,
				referenceNo: app.referenceNo,
				gwa,
				submittedAt: app.submittedAt,
			};
		}),
	);

	return results;
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
			major: app.major,
			status: app.status,
			referenceNo: app.referenceNo,
			gwa,
			submittedAt: app.submittedAt,
			term: termData,
		};
}
