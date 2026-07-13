import { STORAGE_KEYS } from "@/shared/lib/constants";

export function readRegistration(): Record<string, string> {
	try {
		const saved = sessionStorage.getItem(STORAGE_KEYS.REGISTRATION);
		if (!saved) return {};

		const parsed: unknown = JSON.parse(saved);
		if (typeof parsed !== "object" || parsed === null) return {};

		return Object.fromEntries(
			Object.entries(parsed).filter(
				(entry): entry is [string, string] => typeof entry[1] === "string",
			),
		);
	} catch {
		return {};
	}
}

export function writeRegistration(data: Record<string, unknown>): void {
	try {
		const existing = readRegistration();
		sessionStorage.setItem(
			STORAGE_KEYS.REGISTRATION,
			JSON.stringify({ ...existing, ...data }),
		);
	} catch {
		// sessionStorage unavailable or corrupted — silently fail
	}
}
