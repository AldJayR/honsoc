import { API_BASE_URL } from "~/shared/lib/constants";

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
