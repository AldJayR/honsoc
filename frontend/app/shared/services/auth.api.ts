import { apiClientRaw } from "~/shared/services/client";

// ─── Types ───────────────────────────────────────────────────────────────────

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
	_key?: string;
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

// ─── Auth Functions ──────────────────────────────────────────────────────────

interface SignUpPayload {
	email: string;
	password: string;
	name: string;
	first_name: string;
	middle_name: string;
	middle_initial: string;
	last_name: string;
	student_number: string;
}

export async function signUpEmail(payload: SignUpPayload): Promise<void> {
	const response = await apiClientRaw("/auth/sign-up/email", {
		method: "POST",
		body: payload,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.message || errorData.error || "Failed to create account",
		);
	}
}

interface SignInPayload {
	email: string;
	password: string;
}

export async function signInEmail(
	payload: SignInPayload,
): Promise<{ id: string; email: string; name: string; role: string }> {
	const response = await apiClientRaw("/auth/sign-in/email", {
		method: "POST",
		body: payload,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.message || errorData.error || "Invalid email or password",
		);
	}

	const data = await response.json();
	return data.user;
}

// ─── Portal Functions ────────────────────────────────────────────────────────

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

export async function getMyApplications(): Promise<{
	applications: ApplicationStatusItem[];
}> {
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

// ─── Draft Functions ────────────────────────────────────────────────────────

export interface DraftFile {
	name: string;
	size: number;
	type: string;
}

export interface DraftData {
	profile?: {
		campusId?: number;
		departmentId?: number;
		academicYear?: string;
		yearLevel?: string;
		program?: string;
		majorId?: number | null;
	};
	semesters?: {
		firstSem: boolean;
		secondSem: boolean;
	};
	grades1st?: GradeInput[];
	grades2nd?: GradeInput[];
	files?: {
		COR: DraftFile | null;
		COG_1ST: DraftFile | null;
		COG_2ND: DraftFile | null;
		GMC: DraftFile | null;
	};
	currentStep?: number;
}

export interface DraftResponse {
	id: string;
	data: DraftData;
	createdAt: string;
	updatedAt: string;
}

export async function getDraft(): Promise<DraftResponse | null> {
	const response = await apiClientRaw("/applications/draft");
	if (response.status === 404) return null;
	if (!response.ok) throw new Error("Failed to fetch draft");
	return response.json();
}

export async function saveDraft(
	data: DraftData,
): Promise<{ id: string; updatedAt: string }> {
	const response = await apiClientRaw("/applications/draft", {
		method: "PUT",
		body: data,
	});
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error || "Failed to save draft");
	}
	return response.json();
}

export async function deleteDraft(): Promise<void> {
	const response = await apiClientRaw("/applications/draft", {
		method: "DELETE",
	});
	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error || "Failed to delete draft");
	}
}
