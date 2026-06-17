import { db } from "@/db";
import { terms } from "@/db/schema/index.ts";
import { eq, asc } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors.ts";
import type { CreateTermInput, UpdateTermInput } from "@/modules/terms/term.schema.ts";

export async function createTerm(input: CreateTermInput) {
	const created = await db.insert(terms).values(input).returning();
	return created[0];
}

export async function listTerms() {
	return db.select().from(terms).orderBy(asc(terms.id));
}

export async function getActiveTerm() {
	return db.query.terms.findFirst({
		where: eq(terms.isActive, true),
	});
}

export async function updateTerm(id: number, input: UpdateTermInput) {
	const existing = await db.query.terms.findFirst({
		where: eq(terms.id, id),
		columns: { id: true },
	});
	if (!existing) {
		throw new NotFoundError("Term not found");
	}

	const updated = await db
		.update(terms)
		.set(input)
		.where(eq(terms.id, id))
		.returning();
	return updated[0];
}
