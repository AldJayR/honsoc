import { db } from "@/db";
import { applicationDrafts } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";
import type { DraftData } from "@/modules/applications/draft.schema.ts";

export async function getDraft(userId: string): Promise<{
	id: string;
	data: DraftData;
	createdAt: Date;
	updatedAt: Date;
} | null> {
	const draft = await db.query.applicationDrafts.findFirst({
		where: eq(applicationDrafts.userId, userId),
		columns: {
			id: true,
			data: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!draft) {
		return null;
	}

	return {
		...draft,
		data: draft.data as DraftData,
	};
}

export async function saveDraft(
	userId: string,
	data: DraftData,
): Promise<{ id: string; updatedAt: Date }> {
	const existing = await db.query.applicationDrafts.findFirst({
		where: eq(applicationDrafts.userId, userId),
		columns: { id: true },
	});

	if (existing) {
		const [updated] = await db
			.update(applicationDrafts)
			.set({ data, updatedAt: new Date() })
			.where(eq(applicationDrafts.userId, userId))
			.returning({
				id: applicationDrafts.id,
				updatedAt: applicationDrafts.updatedAt,
			});
		return { id: updated!.id, updatedAt: updated!.updatedAt };
	}

	const [created] = await db
		.insert(applicationDrafts)
		.values({ userId, data })
		.returning({
			id: applicationDrafts.id,
			updatedAt: applicationDrafts.updatedAt,
		});
	return { id: created!.id, updatedAt: created!.updatedAt };
}

export async function deleteDraft(userId: string): Promise<void> {
	await db
		.delete(applicationDrafts)
		.where(eq(applicationDrafts.userId, userId));
}
