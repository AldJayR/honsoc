import { API_BASE_URL } from "@/shared/lib/constants";

interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
}

export async function apiClientRaw(
	path: string,
	options: RequestOptions = {},
): Promise<Response> {
	const { method = "GET", body, headers = {} } = options;

	const requestHeaders: Record<string, string> = { ...headers };
	if (body !== undefined) {
		requestHeaders["Content-Type"] = "application/json";
	}

	return fetch(`${API_BASE_URL}${path}`, {
		method,
		headers: requestHeaders,
		body: body !== undefined ? JSON.stringify(body) : undefined,
		credentials: "include",
	});
}

export async function apiClient<T>(
	path: string,
	options: RequestOptions = {},
	defaultErrorMessage = "An unexpected error occurred",
): Promise<T> {
	const response = await apiClientRaw(path, options);

	if (!response.ok) {
		const errorData: unknown = await response.json().catch(() => null);
		const errorMessage = getErrorMessage(errorData);
		throw new Error(errorMessage ?? defaultErrorMessage);
	}

	const text = await response.text();
	if (!text) {
		return undefined as T;
	}

	try {
		const parsed: unknown = JSON.parse(text);
		return parsed as T;
	} catch {
		return text as unknown as T;
	}
}

function getErrorMessage(data: unknown): string | undefined {
	if (typeof data !== "object" || data === null) return undefined;
	if ("message" in data && typeof data.message === "string") {
		return data.message;
	}
	if ("error" in data && typeof data.error === "string") {
		return data.error;
	}
	return undefined;
}
