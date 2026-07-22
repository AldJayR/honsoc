import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllApplications,
	getApplicationById,
	getApplicationGrades,
	getApplicationDocuments,
	getApplicationFlags,
	getApplicationGwa,
	updateApplicationStatus,
	flagApplication,
	getAuditLogs,
	type AuditLogFilters,
} from "@/shared/services/representative.api";

export const repKeys = {
	all: ["representative"] as const,
	applications: () => [...repKeys.all, "applications"] as const,
	application: (id: string) => [...repKeys.applications(), id] as const,
	grades: (id: string) => [...repKeys.all, "grades", id] as const,
	documents: (id: string) => [...repKeys.all, "documents", id] as const,
	flags: (id: string) => [...repKeys.all, "flags", id] as const,
	gwa: (id: string) => [...repKeys.all, "gwa", id] as const,
	auditLogs: (filters: AuditLogFilters = {}) => [...repKeys.all, "audit-logs", filters] as const,
};

export function useAllApplications() {
	return useQuery({
		queryKey: repKeys.applications(),
		queryFn: getAllApplications,
	});
}

export function useApplicationById(id: string) {
	return useQuery({
		queryKey: repKeys.application(id),
		queryFn: () => getApplicationById(id),
		enabled: !!id,
	});
}

export function useApplicationGrades(id: string) {
	return useQuery({
		queryKey: repKeys.grades(id),
		queryFn: () => getApplicationGrades(id),
		enabled: !!id,
	});
}

export function useApplicationDocuments(id: string) {
	return useQuery({
		queryKey: repKeys.documents(id),
		queryFn: () => getApplicationDocuments(id),
		enabled: !!id,
	});
}

export function useApplicationFlags(id: string) {
	return useQuery({
		queryKey: repKeys.flags(id),
		queryFn: () => getApplicationFlags(id),
		enabled: !!id,
	});
}

export function useApplicationGwa(id: string) {
	return useQuery({
		queryKey: repKeys.gwa(id),
		queryFn: () => getApplicationGwa(id),
		enabled: !!id,
	});
}

export function useUpdateApplicationStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
			updateApplicationStatus(id, status, note),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: repKeys.applications() });
			queryClient.invalidateQueries({ queryKey: repKeys.application(id) });
			queryClient.invalidateQueries({ queryKey: [...repKeys.all, "audit-logs"] });
		},
	});
}

export function useFlagApplication() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			reasonCode,
			note,
		}: { id: string; reasonCode: string; note: string }) =>
			flagApplication(id, reasonCode, note),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: repKeys.applications() });
			queryClient.invalidateQueries({ queryKey: repKeys.application(id) });
			queryClient.invalidateQueries({ queryKey: repKeys.flags(id) });
			queryClient.invalidateQueries({ queryKey: [...repKeys.all, "audit-logs"] });
		},
	});
}

export function useAuditLogs(filters: AuditLogFilters) {
	return useQuery({
		queryKey: repKeys.auditLogs(filters),
		queryFn: () => getAuditLogs(filters),
	});
}
