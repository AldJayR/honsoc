import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
	useAllApplications,
	useAuditLogs,
	useApplicationById,
	useApplicationGrades,
	useApplicationDocuments,
	useApplicationGwa,
	useUpdateApplicationStatus,
	useFlagApplication,
} from "@/shared/services/queries/representative";
import { signOut } from "@/shared/services/auth.api";
import type { UserProfile } from "@/shared/services/auth.api";
import type { AuditLogFilters } from "@/shared/services/representative.api";

export type TabType = "dashboard" | "queue" | "audit" | "flagged" | "logs";

interface UseAdminWorkspaceProps {
	user: UserProfile;
	onSwitchToStudent?: () => void;
}

export function useAdminWorkspace({ user, onSwitchToStudent }: UseAdminWorkspaceProps) {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<TabType>("dashboard");
	const [selectedAuditAppId, setSelectedAuditAppId] = useState<string | null>(null);
	const [auditLogFilters, setAuditLogFilters] = useState<AuditLogFilters>({});

	// Load global applications list and audit logs
	const { data: applications = [], isLoading: isAppsLoading, error: appsError } = useAllApplications();
	const { data: auditLogs = [], isLoading: isLogsLoading, error: logsError } = useAuditLogs(auditLogFilters);

	// Load audited applicant subqueries
	const { data: selectedApp, isLoading: isAppLoading } = useApplicationById(selectedAuditAppId || "");
	const { data: grades = [] } = useApplicationGrades(selectedAuditAppId || "");
	const { data: documents = [] } = useApplicationDocuments(selectedAuditAppId || "");
	const { data: gwaData } = useApplicationGwa(selectedAuditAppId || "");

	// Mutations
	const updateStatusMutation = useUpdateApplicationStatus();
	const flagApplicationMutation = useFlagApplication();

	const handleLogout = async () => {
		try {
			await signOut();
			queryClient.clear();
			window.location.href = "/";
		} catch (err: unknown) {
			toast.error("Failed to sign out. Please try again.");
		}
	};

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
	};

	const handleAuditApplicant = (id: string) => {
		setSelectedAuditAppId(id);
		setActiveTab("audit");
	};

	const handleVerify = async () => {
		if (!selectedAuditAppId) return;
		try {
			await updateStatusMutation.mutateAsync({
				id: selectedAuditAppId,
				status: "VERIFIED",
			});
			toast.success("Application successfully verified!");
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : "Verification failed";
			toast.error(msg);
			throw error;
		}
	};

	const handleFlag = async (reasonCode: string, note: string) => {
		if (!selectedAuditAppId) return;
		try {
			await flagApplicationMutation.mutateAsync({
				id: selectedAuditAppId,
				reasonCode,
				note,
			});
			toast.success("Application successfully flagged.");
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : "Flagging failed";
			toast.error(msg);
			throw error;
		}
	};

	const handleEscalate = async (note: string) => {
		if (!selectedAuditAppId) return;
		try {
			await updateStatusMutation.mutateAsync({
				id: selectedAuditAppId,
				status: "ESCALATED",
				note,
			});
			toast.success("Application escalated to the president.");
		} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : "Escalation failed";
				toast.error(msg);
				throw error;
		}
	};

	return {
		// States
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
		isVerifying: updateStatusMutation.isPending,
		isFlagging: flagApplicationMutation.isPending,
		isEscalating: updateStatusMutation.isPending,

		// Handlers
		handleLogout,
		handleTabChange,
		handleAuditApplicant,
		handleVerify,
		handleFlag,
		handleEscalate,
	};
}
