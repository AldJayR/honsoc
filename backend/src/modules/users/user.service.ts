import { db } from "@/db";
import { accounts, users } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";
import { ConflictError, NotFoundError, UnprocessableError } from "@/lib/errors.ts";
import type { ProvisionAdminInput } from "@/modules/users/user.schema.ts";

export async function provisionAdmin(input: ProvisionAdminInput) {
	const existing = await db.query.users.findFirst({
		where: eq(users.email, input.email),
		columns: { id: true },
	});
	if (existing) {
		throw new ConflictError("A user with this email already exists");
	}

	return db.transaction(async (tx) => {
		const created = await tx
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

		await tx.insert(accounts).values({
			userId: userRecord.id,
			accountId: userRecord.id,
			providerId: "credential",
		});

		return userRecord;
	});
}

export async function editOfficer(
	officerId: string,
	input: { role?: string; campus_id?: number; department_id?: number },
) {
	const [updated] = await db
		.update(users)
		.set(input)
		.where(eq(users.id, officerId))
		.returning({ id: users.id, email: users.email, role: users.role });
	if (!updated) throw new NotFoundError("Officer not found");
	return updated;
}

export async function deactivateOfficer(officerId: string) {
	const [updated] = await db
		.update(users)
		.set({ status: "INACTIVE" })
		.where(eq(users.id, officerId))
		.returning({ id: users.id, email: users.email });
	if (!updated) throw new NotFoundError("Officer not found");
	return updated;
}

export async function resendInvite(officerId: string, redirectTo: string) {
	const officer = await db.query.users.findFirst({
		where: eq(users.id, officerId),
		columns: { id: true, email: true, status: true },
	});
	if (!officer) throw new NotFoundError("Officer not found");
	if (officer.status !== "INVITE_PENDING") {
		throw new UnprocessableError("Account is not in INVITE_PENDING status");
	}
	await import("@/auth/index.ts").then(({ auth }) =>
		auth.api.requestPasswordReset({
			body: { email: officer.email, redirectTo },
		})
	);
	return { email: officer.email };
}
