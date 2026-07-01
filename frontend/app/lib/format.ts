/**
 * Extracts the initials from a user's full name (up to 2 characters).
 */
export function getInitials(name: string): string {
	const nameParts = name.trim().split(/\s+/);
	return nameParts
		.filter((part) => part.length > 0)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

/**
 * Formats a ISO date string into a user-friendly date format (e.g., "Jul 1, 2026").
 */
export function formatDate(dateString: string): string {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Formats a ISO date string into a user-friendly time format (e.g., "05:56 PM").
 */
export function formatTime(dateString: string): string {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Formats a raw school year range (e.g., "2025-2026") into an en-dash range (e.g., "2025–2026").
 */
export function formatSchoolYear(schoolYear: string): string {
	const startYear = schoolYear ? schoolYear.split("-")[0]?.trim() : "";
	const endYear = schoolYear ? schoolYear.split("-")[1]?.trim() : "";
	return startYear && endYear ? `${startYear}–${endYear}` : "2025–2026";
}

/**
 * Offsets a school year string range by a number of years (e.g., "2025-2026" with offset -1 becomes "2024 - 2025").
 */
export function computeSchoolYearOffset(schoolYear: string, offset = 0): string {
	if (!schoolYear) return offset === 0 ? "2026 - 2027" : "2025 - 2026";
	const parts = schoolYear.split("-").map((p) => Number.parseInt(p.trim(), 10));
	return `${parts[0] + offset} - ${parts[1] + offset}`;
}
