import type { UserProfile } from "~/shared/services/api";

interface PortalHeaderProps {
	user: UserProfile;
}

export function PortalHeader({ user }: PortalHeaderProps) {
	// Extract initials for placeholder avatar
	const nameParts = user.name.split(" ");
	const initials = nameParts
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="flex items-center justify-between py-4 border-b border-brand-border w-full select-none">
			{/* Logo and Branding */}
			<div className="flex gap-2 items-center">
				<div className="size-9 shrink-0 relative">
					<img
						alt="NEUST Honor Society Logo"
						className="object-cover size-full"
						src="/images/honor-soc-new-logo.png"
					/>
				</div>
				<div className="flex flex-col">
					<span className="font-sans font-semibold text-brand-primary text-base leading-6">
						NEUST Honor Society
					</span>
				</div>
			</div>

			{/* User Profile */}
			<div className="flex gap-2 items-center">
				{/* Avatar */}
				<div className="relative rounded-full size-8 bg-brand-primary/10 border border-brand-primary flex items-center justify-center text-brand-primary font-semibold text-xs select-none">
					{initials || "S"}
				</div>
				{/* Info */}
				<div className="flex flex-col leading-tight">
					<span className="font-sans font-normal text-xs text-black">
						{user.name}
					</span>
					<span className="font-sans font-medium text-[10px] text-brand-muted">
						{user.student_number || "No student number"}
					</span>
				</div>
			</div>
		</div>
	);
}
