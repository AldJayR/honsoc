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
