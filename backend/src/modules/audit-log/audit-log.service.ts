import { db } from "@/db";
import { auditLog } from "@/db/schema/index.ts";
import { and, desc, eq, gte, lte } from "drizzle-orm";

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function logAction(
	actorId: string,
	applicationId: string,
	action: string,
	note?: string | null,
	tx?: TransactionClient,
) {
	const client = tx || db;
	await client.insert(auditLog).values({ actorId, applicationId, action, note });
}

export async function getAuditLog(filters: {
	action?: string;
	from?: string;
	to?: string;
	timezoneOffset?: number;
} = {}) {
	const conditions = [];
	const timezoneOffset = filters.timezoneOffset ?? 0;
	const dateAtLocalBoundary = (date: string, endOfDay = false) => {
		const boundary = new Date(
			`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
		);
		boundary.setUTCMinutes(boundary.getUTCMinutes() + timezoneOffset);
		return boundary;
	};

	if (filters.action) conditions.push(eq(auditLog.action, filters.action));
	if (filters.from) conditions.push(gte(auditLog.createdAt, dateAtLocalBoundary(filters.from)));
	if (filters.to) conditions.push(lte(auditLog.createdAt, dateAtLocalBoundary(filters.to, true)));
	return db.query.auditLog.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined,
		orderBy: [desc(auditLog.createdAt)],
		with: {
			actor: { columns: { id: true, name: true, role: true } },
			application: {
				columns: { id: true, referenceNo: true, semester: true, program: true, yearLevel: true },
				with: {
					student: { columns: { name: true, student_number: true } },
				},
			},
		},
	});
}
