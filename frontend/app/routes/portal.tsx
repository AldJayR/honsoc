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
import { queryClient } from "~/lib/query";
import type { Route } from "./+types/portal";

export function meta() {
	return [
		{ title: "Application Portal - NEUST Honor Society" },
		{
			name: "description",
			content: "Apply for membership and track your application status at the NEUST Honor Society portal.",
		},
	];
}

export async function clientLoader() {
	try {
		const [user, activeTerm, applications, campuses, departments, majors] = await Promise.all([
			queryClient.fetchQuery({ queryKey: ["user"], queryFn: getMe }),
			queryClient.fetchQuery({ queryKey: ["activeTerm"], queryFn: getActiveTerm }),
			queryClient.fetchQuery({
				queryKey: ["applications"],
				queryFn: async () => {
					const res = await getMyApplications();
					return res.applications;
				},
			}),
			queryClient.fetchQuery({ queryKey: ["campuses"], queryFn: getCampuses, staleTime: Infinity }),
			queryClient.fetchQuery({ queryKey: ["departments"], queryFn: getDepartments, staleTime: Infinity }),
			queryClient.fetchQuery({ queryKey: ["majors"], queryFn: getMajors, staleTime: Infinity }),
		]);
		return {
			user,
			activeTerm,
			applications,
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
