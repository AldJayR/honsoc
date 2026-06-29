import { STORAGE_KEYS } from "~/shared/lib/constants";

export function readRegistration(): Record<string, string> {
	try {
		const saved = sessionStorage.getItem(STORAGE_KEYS.REGISTRATION);
		if (!saved) return {};
		return JSON.parse(saved);
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
