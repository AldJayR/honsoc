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
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.message || errorData.error || defaultErrorMessage,
		);
	}

	const text = await response.text();
	if (!text) {
		return undefined as T;
	}

	try {
		return JSON.parse(text) as T;
	} catch (e) {
		return text as unknown as T;
	}
}
