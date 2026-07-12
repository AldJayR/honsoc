import type { ClientLoaderFunctionArgs } from "react-router";
import { Outlet, redirect } from "react-router";
import { RegistrationLayout } from "@/components/RegistrationLayout";
import { getMe } from "@/shared/services/auth.api";

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
	const url = new URL(request.url);
	const pathname = url.pathname;

	// Normalize trailing slashes
	const normalizedPath = pathname.replace(/\/$/, "");

	const isAuthRoute =
		normalizedPath === "" ||
		normalizedPath === "/login" ||
		normalizedPath === "/register" ||
		normalizedPath === "/register/step2" ||
		normalizedPath === "/register/verify";

	if (isAuthRoute) {
		try {
			await getMe();
			throw redirect("/portal");
		} catch (e) {
			if (e instanceof Response) {
				throw e;
			}
		}
	}
	return null;
}
clientLoader.hydrate = true;

export default function RegistrationLayoutRoute() {
	return (
		<RegistrationLayout>
			<Outlet />
		</RegistrationLayout>
	);
}

