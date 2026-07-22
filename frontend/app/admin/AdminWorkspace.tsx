import { BookOpen, Flag, History, LayoutDashboard, Users } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { UserProfile } from "@/shared/services/auth.api";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { ApplicantQueue } from "./ApplicantQueue";
import { AuditLogs } from "./AuditLogs";
import { AuditWorkspace } from "./AuditWorkspace";
import { Dashboard } from "./Dashboard";
import { FlaggedCases } from "./FlaggedCases";
import { useAdminWorkspace } from "./useAdminWorkspace";

interface AdminWorkspaceProps {
	user: UserProfile;
	onSwitchToStudent?: () => void;
}

const menuItems = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
	{ id: "queue", label: "Applicant Queue", icon: Users },
	{ id: "audit", label: "Audit Workspace", icon: BookOpen },
	{ id: "flagged", label: "Flagged Cases", icon: Flag },
] as const;

const managementItems = [
	{ id: "logs", label: "Audit Logs", icon: History },
] as const;

export function AdminWorkspace({
	user,
	onSwitchToStudent,
}: AdminWorkspaceProps) {
	const {
		activeTab,
		selectedAuditAppId,
		setSelectedAuditAppId,
		applications,
		auditLogs,
		auditLogFilters,
		setAuditLogFilters,
		selectedApp,
		isAppLoading,
		grades,
		documents,
		gwaData,
		isAppsLoading,
		isLogsLoading,
		appsError,
		logsError,
		isVerifying,
		isFlagging,
		isEscalating,
		handleLogout,
		handleTabChange,
		handleAuditApplicant,
		handleVerify,
		handleFlag,
		handleEscalate,
	} = useAdminWorkspace({ user, onSwitchToStudent });

	const renderContent = () => {
		if (isAppsLoading || isLogsLoading) {
			return (
				<div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground select-none">
					<div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
					<p className="text-sm font-semibold">Loading data...</p>
				</div>
			);
		}

		if (appsError || logsError) {
			return (
				<div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground select-none">
					<p className="text-sm font-semibold text-red-600">
						Failed to load system data.
					</p>
					<p className="text-xs mt-1 text-muted-foreground">
						Please verify your authorization or connection.
					</p>
				</div>
			);
		}

		switch (activeTab) {
			case "queue":
				return (
					<ApplicantQueue
						applications={applications}
						onAuditClick={handleAuditApplicant}
					/>
				);
			case "audit":
				return (
					<AuditWorkspace
						applications={applications}
						selectedAppId={selectedAuditAppId}
						onSelectApp={setSelectedAuditAppId}
						selectedApp={selectedApp}
						isAppLoading={isAppLoading}
						grades={grades}
						documents={documents}
						gwaData={gwaData}
						onVerify={handleVerify}
						onFlag={handleFlag}
						onEscalate={handleEscalate}
						isVerifying={isVerifying}
						isFlagging={isFlagging}
						isEscalating={isEscalating}
					/>
				);
			case "flagged":
				return (
					<FlaggedCases
						applications={applications}
						onAuditClick={handleAuditApplicant}
					/>
				);
			case "logs":
				return (
					<AuditLogs
						auditLogs={auditLogs}
						filters={auditLogFilters}
						onFiltersChange={setAuditLogFilters}
					/>
				);
			default:
				return (
					<Dashboard
						applications={applications}
						auditLogs={auditLogs}
						onViewApplication={handleAuditApplicant}
					/>
				);
		}
	};

	const isAuditWorkspace = activeTab === "audit";

	return (
		<SidebarProvider className="min-h-svh bg-background">
			<AdminSidebar
				user={user}
				activeTab={activeTab}
				onTabChange={handleTabChange}
				onLogout={handleLogout}
				onSwitchToStudent={onSwitchToStudent}
				menuItems={menuItems}
				managementItems={managementItems}
			/>

			<SidebarInset className="min-w-0">
				<AdminHeader />
				<main
					className={
						isAuditWorkspace
							? "min-h-0 flex-1 overflow-hidden bg-background"
							: "flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6"
					}
				>
					<div
						className={
							isAuditWorkspace
								? "flex h-full min-h-0 w-full flex-col"
								: "mx-auto flex min-h-full w-full max-w-7xl flex-col"
						}
					>
						{renderContent()}
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
