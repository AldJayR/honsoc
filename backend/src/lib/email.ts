import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { users } from "@/db/schema/index.ts";
import { boss } from "@/lib/queue.ts";

export type EmailTemplate = "verify-email" | "reset-password" | "invite-officer";

interface SendEmailJob {
	to: string;
	template: EmailTemplate;
	props: {
		userName: string;
		url: string;
	};
}

export async function sendEmail(
	to: string,
	template: EmailTemplate,
	url: string,
): Promise<void> {
	const user = await db.query.users.findFirst({
		where: eq(users.email, to),
		columns: { name: true },
	});

	const userName = user?.name ?? "User";

	await boss.send("emails", {
		to,
		template,
		props: { userName, url },
	} satisfies SendEmailJob);
}
