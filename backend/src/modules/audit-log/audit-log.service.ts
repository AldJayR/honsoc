import { db } from "@/db";
import { auditLog } from "@/db/schema/index.ts";
import { desc } from "drizzle-orm";

export async function logAction(
	actorId: string,
	applicationId: string,
	action: string,
	note?: string,
) {
	await db.insert(auditLog).values({ actorId, applicationId, action, note });
}

export async function getAuditLog(_filters?: {
	termId?: number;
	semester?: string;
	action?: string;
}) {
	return db.query.auditLog.findMany({
		orderBy: [desc(auditLog.createdAt)],
		with: {
			actor: { columns: { id: true, name: true, role: true } },
			application: { columns: { id: true, referenceNo: true, semester: true } },
		},
	});
}
