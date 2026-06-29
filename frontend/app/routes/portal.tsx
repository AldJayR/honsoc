import { redirect } from "react-router";
import { PortalPage } from "~/portal/components/PortalPage";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import {
	getActiveTerm,
	getMe,
	getMyApplications,
} from "~/shared/services/auth.api";
import type { Route } from "./+types/portal";

export async function clientLoader() {
	try {
		const user = await getMe();
		const activeTerm = await getActiveTerm();
		const appsRes = await getMyApplications();
		return {
			user,
			activeTerm,
			applications: appsRes.applications,
		};
	} catch (_e) {
		throw redirect("/");
	}
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Loading your portal..." />;
}

export default function PortalRoute({ loaderData }: Route.ComponentProps) {
	const { user, activeTerm, applications } = loaderData;
	return (
		<PortalPage
			user={user}
			activeTerm={activeTerm}
			applications={applications}
		/>
	);
}
