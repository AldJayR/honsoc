import { apiClientRaw } from "./client";

export interface Campus {
	id: number;
	name: string;
}

export interface Department {
	id: number;
	code: string;
	name: string;
}

export interface Major {
	id: number;
	name: string;
}

export interface Term {
	id: number;
	schoolYear: string;
	semester: "1ST" | "2ND" | "BOTH";
	gwaThreshold: string;
	isActive: boolean;
}

export interface UserProfile {
	id: string;
	name: string;
	email: string;
	role: "STUDENT" | "COLLEGE_ADMIN" | "OFFICER" | "PRESIDENT";
	student_number: string | null;
}

export interface GradeInput {
	subjectCode: string;
	subjectName: string;
	units: number;
	grade: string;
}

export interface ApplicationPayload {
	semester: "1ST" | "2ND" | "BOTH";
	yearLevel: "1ST_YEAR" | "2ND_YEAR" | "3RD_YEAR" | "4TH_YEAR" | "5TH_YEAR";
	program: string;
	majorId: number | null;
	grades?: GradeInput[];
	grades_1st?: GradeInput[];
	grades_2nd?: GradeInput[];
}

export interface ApplicationResponseItem {
	id: string;
	referenceNo: string;
	semester: "1ST" | "2ND";
	yearLevel: string;
	program: string;
	majorId: number | null;
}

export interface ApplicationStatusItem {
	id: string;
	semester: "1ST" | "2ND";
	yearLevel: string;
	program: string;
	majorId: number | null;
	status: "SUBMITTED" | "UNDER_REVIEW" | "FLAGGED" | "VERIFIED" | "REJECTED";
	referenceNo: string;
	gwa: number | null;
	submittedAt: string;
}

export async function getMe(): Promise<UserProfile> {
	const response = await apiClientRaw("/me");
	if (!response.ok) {
		throw new Error("Unauthorized");
	}
	return response.json();
}

export async function getCampuses(): Promise<Campus[]> {
	const response = await apiClientRaw("/campus");
	if (!response.ok) throw new Error("Failed to fetch campuses");
	return response.json();
}

export async function getDepartments(): Promise<Department[]> {
	const response = await apiClientRaw("/departments");
	if (!response.ok) throw new Error("Failed to fetch departments");
	return response.json();
}

export async function getMajors(): Promise<Major[]> {
	const response = await apiClientRaw("/majors");
	if (!response.ok) throw new Error("Failed to fetch majors");
	return response.json();
}

export async function getActiveTerm(): Promise<Term | null> {
	const response = await apiClientRaw("/terms/active");
	if (response.status === 404) {
		return null;
	}
	if (!response.ok) throw new Error("Failed to fetch active term");
	return response.json();
}

export async function submitApplication(
	payload: ApplicationPayload,
): Promise<ApplicationResponseItem[]> {
	const response = await apiClientRaw("/applications", {
		method: "POST",
		body: payload,
	});
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error || "Failed to submit application");
	}
	return response.json();
}

export async function getMyApplications(): Promise<{ applications: ApplicationStatusItem[] }> {
	const response = await apiClientRaw("/applications/mine");
	if (!response.ok) throw new Error("Failed to fetch applications");
	return response.json();
}

export async function presignDocument(payload: {
	applicationId: string;
	docType: "COR" | "COG_1ST" | "COG_2ND" | "GMC";
	fileName: string;
}): Promise<{ url: string; objectKey: string }> {
	const response = await apiClientRaw("/documents/presign", {
		method: "POST",
		body: payload,
	});
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error || "Failed to get upload URL");
	}
	return response.json();
}

export async function linkDocument(payload: {
	applicationId: string;
	docType: "COR" | "COG_1ST" | "COG_2ND" | "GMC";
	objectKey: string;
	fileSizeKb?: number;
}): Promise<{ id: number; docType: string; objectKey: string }> {
	const response = await apiClientRaw("/documents/link", {
		method: "POST",
		body: payload,
	});
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error || "Failed to link document");
	}
	return response.json();
}

export async function uploadToR2(url: string, file: File): Promise<void> {
	const response = await fetch(url, {
		method: "PUT",
		headers: {
			"Content-Type": "application/octet-stream",
		},
		body: file,
	});
	if (!response.ok) {
		throw new Error(`R2 upload failed: ${response.statusText}`);
	}
}
