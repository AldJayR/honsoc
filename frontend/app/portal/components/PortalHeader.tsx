import type { UserProfile } from "~/shared/services/auth.api";
import { getInitials } from "~/lib/format";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { signOut } from "~/shared/services/auth.api";

interface PortalHeaderProps {
	user: UserProfile;
}

export function PortalHeader({ user }: PortalHeaderProps) {
	const initials = getInitials(user.name);

	const handleLogout = async () => {
		try {
			await signOut();
			window.location.href = "/";
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

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

			{/* User Profile Dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger className="flex items-center gap-2 text-left p-1 -m-1 rounded-lg hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 outline-none">
					{/* Avatar */}
					<div className="relative flex items-center justify-center text-xs font-semibold border rounded-full select-none size-8 bg-primary/10 border-primary text-primary shrink-0">
						{initials || "S"}
					</div>
					{/* Info */}
					<div className="flex flex-col leading-tight pr-1">
						<span className="type-caption text-foreground font-medium">
							{user.name}
						</span>
						<span className="font-sans font-medium text-[10px] text-muted-foreground">
							{user.student_number || "No student number"}
						</span>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[180px]">
					<DropdownMenuGroup>
						<DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
							Student Account
						</DropdownMenuLabel>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={handleLogout}
						className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
					>
						<LogOut className="size-4 mr-2" />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
