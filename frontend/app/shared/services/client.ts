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

	return fetch(`${API_BASE_URL}${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
	});
}
