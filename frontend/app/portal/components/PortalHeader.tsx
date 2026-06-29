import type { UserProfile } from "~/shared/services/auth.api";

interface PortalHeaderProps {
	user: UserProfile;
}

export function PortalHeader({ user }: PortalHeaderProps) {
	// Extract initials for placeholder avatar
	const nameParts = user.name.trim().split(/\s+/);
	const initials = nameParts
		.filter((part) => part.length > 0)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="flex items-center justify-between w-full py-4 border-b select-none border-border">
			{/* Logo and Branding */}
			<div className="flex items-center gap-2">
				<div className="relative size-9 shrink-0">
					<img
						alt="NEUST Honor Society Logo"
						className="object-cover size-full"
						src="/images/honor-soc-new-logo.png"
					/>
				</div>
				<span className="text-base font-semibold leading-6 text-primary">
					NEUST Honor Society
				</span>
			</div>

			{/* User Profile */}
			<div className="flex items-center gap-2">
				{/* Avatar */}
				<div className="relative flex items-center justify-center text-xs font-semibold border rounded-full select-none size-8 bg-primary/10 border-primary text-primary">
					{initials || "S"}
				</div>
				{/* Info */}
				<div className="flex flex-col leading-tight">
					<span className="type-caption text-foreground">
						{user.name}
					</span>
					<span className="font-sans font-medium text-[10px] text-muted-foreground">
						{user.student_number || "No student number"}
					</span>
				</div>
			</div>
		</div>
	);
}
