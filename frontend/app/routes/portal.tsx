import { useState } from "react";
import { redirect, useNavigate } from "react-router";
import { PortalPage } from "@/portal/PortalPage";
import { LoadingFallback } from "@/shared/components/LoadingFallback";
import {
	getActiveTerm,
	getCampuses,
	getDepartments,
	getDraft,
	getMajors,
	getMe,
	getMyApplications,
} from "@/shared/services/auth.api";
import { queryClient } from "@/lib/query";
import type { Route } from "./+types/portal";
import { AdminWorkspace } from "@/admin/AdminWorkspace";
import { Shield, User } from "lucide-react";

export function meta() {
	return [
		{ title: "Application Portal - NEUST Honor Society" },
		{
			name: "description",
			content:
				"Apply for membership and track your application status at the NEUST Honor Society portal.",
		},
	];
}

export async function clientLoader() {
	try {
		const user = await queryClient.fetchQuery({
			queryKey: ["user"],
			queryFn: getMe,
		});

		const [activeTerm, applications, campuses, departments, majors, draftRes] =
			await Promise.all([
				queryClient.fetchQuery({
					queryKey: ["activeTerm"],
					queryFn: getActiveTerm,
				}),
				queryClient.fetchQuery({
					queryKey: ["applications"],
					queryFn: async () => {
						const res = await getMyApplications();
						return res.applications;
					},
				}),
				queryClient.fetchQuery({
					queryKey: ["campuses"],
					queryFn: getCampuses,
					staleTime: Infinity,
				}),
				queryClient.fetchQuery({
					queryKey: ["departments"],
					queryFn: getDepartments,
					staleTime: Infinity,
				}),
				queryClient.fetchQuery({
					queryKey: ["majors"],
					queryFn: getMajors,
					staleTime: Infinity,
				}),
				queryClient.fetchQuery({ queryKey: ["draft"], queryFn: getDraft }),
			]);
		return {
			user,
			activeTerm,
			applications,
			campuses,
			departments,
			majors,
			draft: draftRes?.data || null,
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
	const {
		user,
		activeTerm,
		applications,
		campuses,
		departments,
		majors,
		draft,
	} = loaderData;
	const navigate = useNavigate();

	const [activeWorkspace, setActiveWorkspace] = useState<
		"student" | "admin" | null
	>(() => {
		if (typeof window !== "undefined") {
			return sessionStorage.getItem("activeWorkspace") as
				| "student"
				| "admin"
				| null;
		}
		return null;
	});

	const handleSelectWorkspace = (mode: "student" | "admin") => {
		setActiveWorkspace(mode);
		sessionStorage.setItem("activeWorkspace", mode);
	};

	const isAdminRole =
		user.role === "COLLEGE_ADMIN" ||
		user.role === "OFFICER" ||
		user.role === "PRESIDENT";

	if (isAdminRole && !activeWorkspace) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4">
				<div className="flex w-[440px] max-w-full flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-lg">
					<div className="text-center flex flex-col gap-2">
						<h2 className="text-lg font-semibold text-foreground leading-tight">
							Welcome, {user.name}
						</h2>
						<p className="text-xs text-muted-foreground leading-relaxed">
							You have administrative privileges. Choose a workspace below to
							get started:
						</p>
					</div>

					<div className="flex flex-col gap-3">
						<button
							onClick={() => handleSelectWorkspace("student")}
							className="group flex w-full cursor-pointer items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-muted/50 hover:border-emerald-500/30"
						>
							<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20">
								<User className="w-5 h-5" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-xs text-foreground group-hover:text-emerald-600 transition-colors">
									Student Application Portal
								</h3>
								<p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
									Apply for membership, upload transcripts, and track your
									active application.
								</p>
							</div>
						</button>

						<button
							onClick={() => {
								handleSelectWorkspace("admin");
								navigate("/dashboard");
							}}
							className="group flex w-full cursor-pointer items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-muted/50 hover:border-primary/30"
						>
							<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20">
								<Shield className="w-5 h-5" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
									Administrative Dashboard
								</h3>
								<p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
									Audit student applications, check grades, issue flags, and
									review audit logs.
								</p>
							</div>
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (isAdminRole && activeWorkspace === "admin") {
		return (
			<AdminWorkspace
				user={user}
				onSwitchToStudent={() => handleSelectWorkspace("student")}
			/>
		);
	}

	return (
		<PortalPage
			user={user}
			activeTerm={activeTerm}
			applications={applications}
			campuses={campuses}
			departments={departments}
			majors={majors}
			draft={draft}
			onSwitchToAdmin={
				isAdminRole
					? () => {
							handleSelectWorkspace("admin");
							navigate("/dashboard");
						}
					: undefined
			}
		/>
	);
}
