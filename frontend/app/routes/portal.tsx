import { redirect } from "react-router";
import { PortalPage } from "~/portal/components/PortalPage";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import {
	getActiveTerm,
	getCampuses,
	getDepartments,
	getMajors,
	getMe,
	getMyApplications,
} from "~/shared/services/auth.api";
import type { Route } from "./+types/portal";

export async function clientLoader() {
	try {
		const [user, activeTerm, appsRes, campuses, departments, majors] = await Promise.all([
			getMe(),
			getActiveTerm(),
			getMyApplications(),
			getCampuses(),
			getDepartments(),
			getMajors(),
		]);
		return {
			user,
			activeTerm,
			applications: appsRes.applications,
			campuses,
			departments,
			majors,
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
	const { user, activeTerm, applications, campuses, departments, majors } = loaderData;
	return (
		<PortalPage
			user={user}
			activeTerm={activeTerm}
			applications={applications}
			campuses={campuses}
			departments={departments}
			majors={majors}
		/>
	);
}
