import { redirect } from "react-router";
import { Step2Page } from "~/register/components/Step2Page";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import { readRegistration } from "~/shared/lib/storage";
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
	const parsed = readRegistration();
	if (!parsed.firstName || !parsed.lastName || !parsed.studentNumber) {
		throw redirect("/register");
	}
	return parsed;
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Verifying details..." />;
}

export default function RegisterStep2({ loaderData }: Route.ComponentProps) {
	return <Step2Page defaultValues={loaderData} />;
}
