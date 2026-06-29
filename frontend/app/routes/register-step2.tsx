import { Loader2 } from "lucide-react";
import { redirect } from "react-router";
import { Step2Page } from "~/registration/components/Step2Page";
import { STORAGE_KEYS } from "~/shared/lib/constants";
import type { Route } from "./+types/register-step2";

export function meta() {
	return [
		{ title: "Register - Account Details" },
		{
			name: "description",
			content: "Create your account - Account credentials",
		},
	];
}

export async function clientLoader() {
	try {
		const saved = sessionStorage.getItem(STORAGE_KEYS.REGISTRATION);
		if (!saved) throw redirect("/register");
		const parsed = JSON.parse(saved);
		if (!parsed.firstName || !parsed.lastName || !parsed.studentNumber) {
			throw redirect("/register");
		}
		return parsed;
	} catch {
		throw redirect("/register");
	}
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return (
		<div className="w-full max-w-[512px] mx-auto min-h-[300px] flex flex-col items-center justify-center gap-3 select-none" aria-live="polite">
			<Loader2 className="size-8 animate-spin text-brand-primary" />
			<p className="text-sm font-medium text-brand-muted">
				Verifying details...
			</p>
		</div>
	);
}

export default function RegisterStep2({ loaderData }: Route.ComponentProps) {
	return <Step2Page defaultValues={loaderData} />;
}
