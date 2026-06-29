import { apiClientRaw } from "~/shared/services/client";

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

interface SignUpResult {
	success: boolean;
	error?: string;
}

export async function signUpEmail(
	payload: SignUpPayload,
): Promise<SignUpResult> {
	try {
		const response = await apiClientRaw("/auth/sign-up/email", {
			method: "POST",
			body: payload,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const message =
				errorData.message || errorData.error || "Failed to create account";
			return { success: false, error: message };
		}

		return { success: true };
	} catch {
		return {
			success: false,
			error:
				"Unable to connect to the authentication server. Please verify the backend is running.",
		};
	}
}

interface SignInPayload {
	email: string;
	password: string;
}

interface SignInResult {
	success: boolean;
	error?: string;
	user?: {
		id: string;
		email: string;
		name: string;
		role: string;
	};
}

export async function signInEmail(
	payload: SignInPayload,
): Promise<SignInResult> {
	try {
		const response = await apiClientRaw("/auth/sign-in/email", {
			method: "POST",
			body: payload,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const message =
				errorData.message || errorData.error || "Invalid email or password";
			return { success: false, error: message };
		}

		const data = await response.json();
		return { success: true, user: data.user };
	} catch {
		return {
			success: false,
			error:
				"Unable to connect to the authentication server. Please verify the backend is running.",
		};
	}
}

