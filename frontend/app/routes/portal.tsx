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
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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
	const roleLabel =
		user.role === "PRESIDENT"
			? "President"
			: user.role === "OFFICER"
				? "Officer"
				: "College representative";

	if (isAdminRole && !activeWorkspace) {
		return (
			<Dialog open>
				<DialogContent
					showCloseButton={false}
					className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[500px]"
				>
					<div className="h-1 bg-primary" />
					<div className="px-6 pt-6 pb-5 sm:px-7">
						<DialogHeader className="gap-3 pr-0">
							<div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
								<span>{roleLabel}</span>
								<span aria-hidden="true" className="size-0.5 rounded-full bg-muted-foreground/60" />
								<span>{user.name}</span>
							</div>
							<DialogTitle className="font-heading text-xl leading-tight">
								Select a workspace
							</DialogTitle>
							<DialogDescription className="text-sm leading-relaxed">
								Your account has access to both areas.
							</DialogDescription>
						</DialogHeader>
					</div>

					<div className="divide-y border-y">
						<Button
							variant="ghost"
							onClick={() => handleSelectWorkspace("student")}
							className="group h-auto w-full justify-start gap-4 rounded-none px-6 py-4 text-left hover:bg-muted/50 sm:px-7"
						>
							<span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground">01</span>
							<span className="min-w-0 flex-1">
								<span className="block text-sm font-semibold text-foreground">Application portal</span>
								<span className="mt-0.5 block text-xs font-normal text-muted-foreground">
									Apply and track your own submissions
								</span>
							</span>
							<ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
						</Button>

						<Button
							variant="ghost"
							onClick={() => {
								handleSelectWorkspace("admin");
								navigate("/dashboard");
							}}
							className="group h-auto w-full justify-start gap-4 rounded-none px-6 py-4 text-left hover:bg-muted/50 sm:px-7"
						>
							<span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground">02</span>
							<span className="min-w-0 flex-1">
								<span className="block text-sm font-semibold text-foreground">Review dashboard</span>
								<span className="mt-0.5 block text-xs font-normal text-muted-foreground">
									Audit applications and record decisions
								</span>
							</span>
							<ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
						</Button>
					</div>

					<p className="px-6 py-4 text-[11px] text-muted-foreground sm:px-7">
						You can switch workspaces later from the account menu.
					</p>
				</DialogContent>
			</Dialog>
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
