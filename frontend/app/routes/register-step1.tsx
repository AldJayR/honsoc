import { Loader2 } from "lucide-react";
import { Step1Page } from "~/registration/components/Step1Page";
import { STORAGE_KEYS } from "~/shared/lib/constants";
import type { Route } from "./+types/register-step1";

export function meta() {
	return [
		{ title: "Register - NEUST Honor Society" },
		{ name: "description", content: "Create your account - Personal details" },
	];
}

export async function clientLoader() {
	try {
		const saved = sessionStorage.getItem(STORAGE_KEYS.REGISTRATION);
		return saved ? JSON.parse(saved) : {};
	} catch {
		return {};
	}
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return (
		<div className="w-full max-w-[512px] mx-auto min-h-[300px] flex flex-col items-center justify-center gap-3 select-none" aria-live="polite">
			<Loader2 className="size-8 animate-spin text-brand-primary" />
			<p className="text-sm font-medium text-brand-muted">Loading details...</p>
		</div>
	);
}

export default function RegisterStep1({ loaderData }: Route.ComponentProps) {
	return <Step1Page defaultValues={loaderData} />;
}
