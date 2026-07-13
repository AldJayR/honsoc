import { redirect } from "react-router";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingFallback } from "@/shared/components/LoadingFallback";
import { readRegistration } from "@/shared/lib/storage";
import type { Route } from "./+types/register-verify";

export function meta() {
	return [
		{ title: "Verify Your Email - NEUST Honor Society" },
		{
			name: "description",
			content: "Please verify your email address to activate your account",
		},
	];
}

export async function clientLoader() {
	const parsed = readRegistration();
	if (!parsed.email) throw redirect("/register");
	return { email: parsed.email };
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Loading verification details..." />;
}

export default function RegisterVerify({ loaderData }: Route.ComponentProps) {
	const email = loaderData.email;

	const handleResend = () => {
		toast.success("Verification email resent!", {
			description: `A new activation link has been sent to ${email}.`,
			duration: 5000,
		});
	};

	return (
		<div className="mx-auto flex w-full max-w-[521px] flex-col items-center gap-8">
			<div
				className="flex size-16 items-center justify-center rounded-full border border-success-foreground bg-success text-success-foreground"
				aria-hidden="true"
			>
				<Mail className="size-7 shrink-0" />
			</div>

			<div className="flex flex-col items-center w-full gap-4 text-center">
				<h2 className="type-h4 select-none">Check your email</h2>

				<p className="type-caption">
					We sent a verification link to{" "}
					<span className="font-bold">{email}</span>. Click the
					<br className="hidden sm:inline" /> link to activate your account
				</p>

				<Button type="button" onClick={handleResend}>
					Resend Verification Email
				</Button>
			</div>
		</div>
	);
}
