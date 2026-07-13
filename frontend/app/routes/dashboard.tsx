import { useNavigate, redirect } from "react-router";
import { AdminWorkspace } from "@/admin/AdminWorkspace";
import { LoadingFallback } from "@/shared/components/LoadingFallback";
import { getMe } from "@/shared/services/auth.api";
import { queryClient } from "@/lib/query";
import type { Route } from "./+types/dashboard";

export function meta() {
	return [
		{ title: "Dashboard - NEUST Honor Society" },
		{
			name: "description",
			content: "Administrative dashboard for the NEUST Honor Society.",
		},
	];
}

export async function clientLoader() {
	try {
		const user = await queryClient.fetchQuery({
			queryKey: ["user"],
			queryFn: getMe,
		});

		if (user.role === "STUDENT") {
			throw redirect("/portal");
		}

		return { user };
	} catch (error) {
		if (error instanceof Response) throw error;
		throw redirect("/");
	}
}

clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Loading dashboard..." />;
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();

	return (
		<AdminWorkspace
			user={loaderData.user}
			onSwitchToStudent={() => {
				sessionStorage.setItem("activeWorkspace", "student");
				navigate("/portal");
			}}
		/>
	);
}
