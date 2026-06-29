import { Loader2 } from "lucide-react";
import { redirect } from "react-router";
import { VerifyPage } from "~/registration/components/VerifyPage";
import { STORAGE_KEYS } from "~/shared/lib/constants";
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
	try {
		const saved = sessionStorage.getItem(STORAGE_KEYS.REGISTRATION);
		if (!saved) throw redirect("/register");
		const parsed = JSON.parse(saved);
		if (!parsed.email) throw redirect("/register");
		return { email: parsed.email };
	} catch (e) {
		if (e instanceof Response) throw e;
		throw redirect("/register");
	}
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return (
		<div className="w-full max-w-[521px] mx-auto min-h-[300px] flex flex-col items-center justify-center gap-3 select-none" aria-live="polite">
			<Loader2 className="size-8 animate-spin text-brand-primary" />
			<p className="text-sm font-medium text-brand-muted">
				Loading verification details...
			</p>
		</div>
	);
}

export default function RegisterVerify({ loaderData }: Route.ComponentProps) {
	return <VerifyPage email={loaderData.email} />;
}
