import { Step1Page } from "~/registration/components/Step1Page";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import { readRegistration } from "~/shared/lib/storage";
import type { Route } from "./+types/register-step1";

export function meta() {
	return [
		{ title: "Register - NEUST Honor Society" },
		{ name: "description", content: "Create your account - Personal details" },
	];
}

export async function clientLoader() {
	return readRegistration();
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Loading details..." />;
}

export default function RegisterStep1({ loaderData }: Route.ComponentProps) {
	return <Step1Page defaultValues={loaderData} />;
}
