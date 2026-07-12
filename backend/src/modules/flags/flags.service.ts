import { db } from "@/db";
import { flags, applications, auditLog } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors.ts";

async function verifyApplicationAccess(
	applicationId: string,
	userId: string,
	role: string,
) {
	const app = await db.query.applications.findFirst({
		where: eq(applications.id, applicationId),
	});
	if (!app) throw new NotFoundError("Application not found");
	if (role === "STUDENT" && app.studentId !== userId)
		throw new NotFoundError("Application not found");
	return app;
}

export async function createFlag(
	applicationId: string,
	flaggedBy: string,
	input: { reasonCode: string; note: string },
) {
	await verifyApplicationAccess(applicationId, flaggedBy, "COLLEGE_ADMIN");

	const [flag] = await db
		.insert(flags)
		.values({
			applicationId,
			reasonCode: input.reasonCode,
			note: input.note,
			flaggedBy,
		})
		.returning();

	await db
		.update(applications)
		.set({ status: "FLAGGED" })
		.where(eq(applications.id, applicationId));

	await db.insert(auditLog).values({
		actorId: flaggedBy,
		applicationId,
		action: "FLAGGED",
		note: `${input.reasonCode}: ${input.note}`,
	});

	return flag;
}

export async function getFlags(
	applicationId: string,
	userId: string,
	role: string,
) {
	await verifyApplicationAccess(applicationId, userId, role);
	return db.query.flags.findMany({
		where: eq(flags.applicationId, applicationId),
	});
}
