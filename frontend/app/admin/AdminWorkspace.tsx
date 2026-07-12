import { LayoutDashboard, Users, BookOpen, Flag, History } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Dashboard } from "./Dashboard";
import { ApplicantQueue } from "./ApplicantQueue";
import { AuditWorkspace } from "./AuditWorkspace";
import { FlaggedCases } from "./FlaggedCases";
import { AuditLogs } from "./AuditLogs";
import { useAdminWorkspace } from "./useAdminWorkspace";
import type { UserProfile } from "@/shared/services/auth.api";

interface AdminWorkspaceProps {
	user: UserProfile;
	onSwitchToStudent?: () => void;
}

const menuItems = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "queue", label: "Applicant Queue", icon: Users },
	{ id: "audit", label: "Audit Workspace", icon: BookOpen },
	{ id: "flagged", label: "Flagged Cases", icon: Flag },
] as const;

const managementItems = [
	{ id: "logs", label: "Audit Logs", icon: History },
] as const;

export function AdminWorkspace({ user, onSwitchToStudent }: AdminWorkspaceProps) {
	const {
		activeTab,
		selectedAuditAppId,
		setSelectedAuditAppId,
		applications,
		auditLogs,
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
					<p className="text-sm font-semibold text-red-600">Failed to load system data.</p>
					<p className="text-xs mt-1 text-muted-foreground">Please verify your authorization or connection.</p>
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
				return <AuditLogs auditLogs={auditLogs} />;
			case "dashboard":
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

	const getPageHeaderTitle = () => {
		switch (activeTab) {
			case "queue":
				return "Applicant Queue";
			case "audit":
				return "Audit Workspace";
			case "flagged":
				return "Flagged Cases";
			case "logs":
				return "Audit Logs";
			case "dashboard":
			default:
				return "Dashboard";
		}
	};

	return (
		<div className="flex w-screen h-screen overflow-hidden bg-background">
			{/* Left navigation sidebar */}
			<AdminSidebar
				user={user}
				activeTab={activeTab}
				onTabChange={handleTabChange}
				onLogout={handleLogout}
				onSwitchToStudent={onSwitchToStudent}
				menuItems={menuItems}
				managementItems={managementItems}
			/>

			{/* Main layout contents area */}
			<div className="flex-1 flex flex-col overflow-hidden h-full">
				<AdminHeader title={getPageHeaderTitle()} />
				<main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
					<div className="max-w-[1025px] mx-auto w-full h-full">
						{renderContent()}
					</div>
				</main>
			</div>
		</div>
	);
}
