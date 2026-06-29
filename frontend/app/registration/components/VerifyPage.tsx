import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { PRIMARY_BUTTON_CLASS } from "~/shared/lib/constants";

interface VerifyPageProps {
	email: string;
}

export function VerifyPage({ email }: VerifyPageProps) {
	const handleResend = () => {
		toast.success("Verification email resent!", {
			description: `A new activation link has been sent to ${email}.`,
			duration: 5000,
		});
	};

	return (
		<div className="w-full max-w-[521px] mx-auto flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex items-center justify-center w-full select-none">
				<div
					className="bg-brand-success-bg border border-brand-success-border text-brand-success-border flex items-center justify-center rounded-[32.5px] size-[65px] transition-transform duration-300 hover:scale-105 shadow-sm"
					aria-hidden="true"
				>
					<Mail className="size-7 shrink-0" />
				</div>
			</div>

			<div className="flex flex-col gap-4 items-center text-center w-full">
				<h2 className="font-sans font-semibold text-lg leading-7 text-foreground select-none">
					Check your email
				</h2>

				<p className="font-sans font-normal text-xs leading-5 text-foreground select-none">
					We sent a verification link to{" "}
					<span className="font-bold">{email}</span>. Click the
					<br className="hidden sm:inline" /> link to activate your account
				</p>

				<div className="flex items-start justify-center mt-2 w-full">
					<Button
						type="button"
						onClick={handleResend}
						className={`${PRIMARY_BUTTON_CLASS} w-[217px]`}
					>
						Resend Verification Email
					</Button>
				</div>
			</div>
		</div>
	);
}
