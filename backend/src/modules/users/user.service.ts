import { db } from "@/db";
import { accounts, users } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";
import { ConflictError } from "@/lib/errors.ts";
import type { ProvisionAdminInput } from "@/modules/users/user.schema.ts";

export async function provisionAdmin(input: ProvisionAdminInput) {
	const existing = await db.query.users.findFirst({
		where: eq(users.email, input.email),
		columns: { id: true },
	});
	if (existing) {
		throw new ConflictError("A user with this email already exists");
	}

	const created = await db
		.insert(users)
		.values({
			email: input.email,
			name: input.name,
			first_name: input.first_name,
			last_name: input.last_name,
			role: input.role,
			campus_id: input.campus_id,
			department_id: input.department_id,
			status: "INVITE_PENDING",
		})
		.returning({
			id: users.id,
			email: users.email,
		});

	const userRecord = created[0];
	if (!userRecord) {
		throw new Error("Failed to create user");
	}

	await db.insert(accounts).values({
		userId: userRecord.id,
		accountId: userRecord.id,
		providerId: "credential",
	});

	return userRecord;
}
