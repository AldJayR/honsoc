import type React from "react";
import { boss } from "@/lib/queue.ts";
import { resend } from "@/lib/resend.ts";
import { env } from "@/config/env.ts";
import { VerifyEmail } from "@/lib/emails/verify-email.tsx";
import { ResetPassword } from "@/lib/emails/reset-password.tsx";
import { InviteOfficer } from "@/lib/emails/invite-officer.tsx";
import type { EmailTemplate } from "@/lib/email.ts";

const templates: Record<EmailTemplate, (props: { userName: string; url: string }) => React.ReactNode> = {
	"verify-email": VerifyEmail,
	"reset-password": ResetPassword,
	"invite-officer": InviteOfficer,
};

export async function registerWorker() {
	await boss.work("emails", async ([job]) => {
		if (!job) {
			return;
		}
		const { to, template, props } = job.data as {
			to: string;
			template: EmailTemplate;
			props: { userName: string; url: string };
		};

		const reactTemplate = templates[template];
		if (!reactTemplate) {
			throw new Error(`Unknown email template: ${template}`);
		}

		const { error } = await resend.emails.send({
			from: env.RESEND_FROM,
			to: [to],
			subject: getSubject(template),
			react: reactTemplate(props),
		});

		if (error) {
			throw new Error(`Resend error: ${error.message}`);
		}
	});
}

function getSubject(template: EmailTemplate): string {
	switch (template) {
		case "verify-email":
			return "Verify your email address";
		case "reset-password":
			return "Reset your password";
		case "invite-officer":
			return "You've been invited to NHSVS";
	}
}
