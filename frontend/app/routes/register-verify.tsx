import { redirect } from "react-router";
import { VerifyPage } from "~/register/components/VerifyPage";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import { readRegistration } from "~/shared/lib/storage";
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
	return <VerifyPage email={loaderData.email} />;
}
