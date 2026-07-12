import { apiClient } from "@/shared/services/client";
import type { Term, GradeInput } from "@/shared/services/auth.api";

export interface RepresentativeApplication {
	id: string;
	semester: "1ST" | "2ND";
	yearLevel: string;
	program: string;
	gwa: number | null;
	status: "SUBMITTED" | "UNDER_REVIEW" | "FLAGGED" | "VERIFIED" | "REJECTED";
	referenceNo: string;
	submittedAt: string;
	student: {
		id: string;
		name: string;
		student_number: string | null;
	};
	term: Term;
}

export interface ApplicationDocument {
	id: number;
	docType: "COR" | "COG_1ST" | "COG_2ND" | "GMC";
	objectKey: string;
	fileSizeKb: number | null;
	uploadedAt: string;
	url: string;
}

export interface ApplicationFlag {
	id: number;
	applicationId: string;
	reasonCode: string;
	note: string;
	flaggedBy: string;
	flaggedAt: string;
	resolvedAt: string | null;
}

export interface ApplicationGwaResponse {
	gwa: number | null;
	disqualifiers: Array<{ code: string; message: string }>;
}

export interface AuditLogEntry {
	id: number;
	action: string;
	note: string | null;
	createdAt: string;
	actor: {
		id: string;
		name: string;
		role: string;
	};
	application: {
		id: string;
		referenceNo: string;
		semester: string;
		program: string;
		yearLevel: string;
		student: {
			name: string;
			student_number: string | null;
		};
	};
}

export async function getAllApplications(): Promise<RepresentativeApplication[]> {
	return apiClient<RepresentativeApplication[]>("/applications", {}, "Failed to fetch applications");
}

export async function getApplicationById(id: string): Promise<RepresentativeApplication> {
	return apiClient<RepresentativeApplication>(`/applications/${id}`, {}, "Failed to fetch application");
}

export async function getApplicationGrades(id: string): Promise<GradeInput[]> {
	return apiClient<GradeInput[]>(`/applications/${id}/grades`, {}, "Failed to fetch grades");
}

export async function getApplicationDocuments(id: string): Promise<ApplicationDocument[]> {
	return apiClient<ApplicationDocument[]>(`/applications/${id}/documents`, {}, "Failed to fetch documents");
}

export async function getApplicationFlags(id: string): Promise<ApplicationFlag[]> {
	return apiClient<ApplicationFlag[]>(`/applications/${id}/flags`, {}, "Failed to fetch flags");
}

export async function getApplicationGwa(id: string): Promise<ApplicationGwaResponse> {
	return apiClient<ApplicationGwaResponse>(`/applications/${id}/gwa`, {}, "Failed to fetch GWA details");
}

export async function updateApplicationStatus(
	id: string,
	status: string,
): Promise<{ id: string; status: string }> {
	return apiClient<{ id: string; status: string }>(
		`/applications/${id}/status`,
		{
			method: "PATCH",
			body: { status },
		},
		"Failed to update status",
	);
}

export async function flagApplication(
	id: string,
	reasonCode: string,
	note: string,
): Promise<ApplicationFlag> {
	return apiClient<ApplicationFlag>(
		`/applications/${id}/flags`,
		{
			method: "POST",
			body: { reasonCode, note },
		},
		"Failed to flag application",
	);
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
	return apiClient<AuditLogEntry[]>("/audit-log", {}, "Failed to fetch audit logs");
}
