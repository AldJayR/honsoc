import { useNavigate, redirect } from "react-router";
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
		<div className="w-full max-w-[521px] mx-auto flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div
				className="bg-success border border-success-foreground text-success-foreground flex items-center justify-center rounded-[32.5px] size-[65px] transition-transform duration-300 hover:scale-105 shadow-sm"
				aria-hidden="true"
			>
				<Mail className="size-7 shrink-0" />
			</div>

			<div className="flex flex-col items-center w-full gap-4 text-center">
				<h2 className="type-h4 select-none">
					Check your email
				</h2>

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
