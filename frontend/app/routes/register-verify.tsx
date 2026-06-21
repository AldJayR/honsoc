import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
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

// Client Loader: runs in the browser before hydration to load cached email
export async function clientLoader() {
	try {
		const saved = sessionStorage.getItem("honsoc_registration");
		const parsed = saved ? JSON.parse(saved) : {};
		return { email: parsed.email || "email@gmail.com" };
	} catch (e) {
		console.error("Error reading verification data", e);
		return { email: "email@gmail.com" };
	}
}
clientLoader.hydrate = true;

// Hydrate fallback
export function HydrateFallback() {
	return (
		<div className="w-full max-w-[521px] mx-auto min-h-[300px] flex flex-col items-center justify-center gap-3 select-none">
			<Loader2 className="size-8 animate-spin text-brand-primary" />
			<p className="text-[14px] font-medium text-brand-muted">
				Loading verification details...
			</p>
		</div>
	);
}

export default function RegisterVerify({ loaderData }: Route.ComponentProps) {
	const { email } = loaderData;

	const handleResend = () => {
		toast.success("Verification email resent!", {
			description: `A new activation link has been sent to ${email}.`,
			duration: 5000,
		});
	};

	return (
		<div className="w-full max-w-[521px] mx-auto flex flex-col items-center gap-[32px] animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Verification Icon */}
			<div className="flex items-center justify-center w-full select-none">
				<div className="bg-brand-success-bg border border-brand-success-border text-brand-success-border flex items-center justify-center rounded-[32.5px] size-[65px] transition-transform duration-300 hover:scale-105 shadow-sm">
					<Mail className="size-[28px] shrink-0" />
				</div>
			</div>

			{/* Messaging & Action */}
			<div className="flex flex-col gap-[16px] items-center text-center w-full">
				<h2 className="font-sans font-semibold text-[18px] leading-7 text-black dark:text-white select-none">
					Check your email
				</h2>

				<p className="font-sans font-normal text-[12px] leading-5 text-black dark:text-zinc-200 select-none">
					We sent a verification link to{" "}
					<span className="font-bold">{email}</span>. Click the
					<br className="hidden sm:inline" /> link to activate your account
				</p>

				<div className="flex items-start justify-center mt-2 w-full">
					<Button
						type="button"
						onClick={handleResend}
						className="bg-brand-primary-dark hover:bg-[#4d3200] text-primary-foreground font-medium text-[14px] leading-5 tracking-normal h-[32px] w-[217px] rounded-lg flex items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
					>
						Resend Verification Email
					</Button>
				</div>
			</div>
		</div>
	);
}
