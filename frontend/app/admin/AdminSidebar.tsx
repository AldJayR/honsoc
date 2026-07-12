import { ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { UserProfile } from "@/shared/services/auth.api";

export interface AdminSidebarMenuItem {
	id: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}

interface AdminSidebarProps {
	user: UserProfile;
	activeTab: string;
	onTabChange: (tab: any) => void;
	onLogout: () => void;
	onSwitchToStudent?: () => void;
	menuItems: readonly AdminSidebarMenuItem[] | AdminSidebarMenuItem[];
	managementItems?: readonly AdminSidebarMenuItem[] | AdminSidebarMenuItem[];
}

const getInitials = (name: string) => {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
};

const getRoleLabel = (role: string) => {
	switch (role) {
		case "COLLEGE_ADMIN":
			return "College Representative";
		case "OFFICER":
			return "Honor Society Officer";
		case "PRESIDENT":
			return "Honor Society President";
		default:
			return role;
	}
};

export function AdminSidebar({
	user,
	activeTab,
	onTabChange,
	onLogout,
	onSwitchToStudent,
	menuItems,
	managementItems = [],
}: AdminSidebarProps) {
	return (
		<aside className="w-[255px] bg-sidebar border-r border-sidebar-border h-screen flex flex-col justify-between select-none shrink-0">
			<div className="flex flex-col flex-1 py-4">
				{/* Header Branding */}
				<div className="px-6 py-2 flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
						NHS
					</div>
					<div>
						<h1 className="font-semibold text-sm leading-tight text-sidebar-foreground">NEUST</h1>
						<p className="text-xs text-muted-foreground leading-tight">Honor Society</p>
					</div>
				</div>

				{/* Main Menu Navigation */}
				<div className="mt-6 px-3 flex flex-col gap-1">
					<p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
						Main Menu
					</p>
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isActive = activeTab === item.id;
						return (
							<Button
								key={item.id}
								variant={isActive ? "secondary" : "ghost"}
								className={`w-full justify-start gap-3 h-9 px-3 text-xs font-normal ${
									isActive
										? "bg-muted text-sidebar-foreground font-medium"
										: "text-muted-foreground hover:text-sidebar-foreground"
								}`}
								onClick={() => onTabChange(item.id)}
							>
								<Icon className="w-4 h-4" />
								{item.label}
							</Button>
						);
					})}
				</div>

				{/* Management Menu */}
				{managementItems.length > 0 && (
					<div className="mt-4 px-3 flex flex-col gap-1">
						<p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
							Management
						</p>
						{managementItems.map((item) => {
							const Icon = item.icon;
							const isActive = activeTab === item.id;
							return (
								<Button
									key={item.id}
									variant={isActive ? "secondary" : "ghost"}
									className={`w-full justify-start gap-3 h-9 px-3 text-xs font-normal ${
										isActive
											? "bg-muted text-sidebar-foreground font-medium"
											: "text-muted-foreground hover:text-sidebar-foreground"
									}`}
									onClick={() => onTabChange(item.id)}
								>
									<Icon className="w-4 h-4" />
									{item.label}
								</Button>
							);
						})}
					</div>
				)}
			</div>

			{/* User Profile Footer */}
			<div className="p-4 border-t border-sidebar-border">
				<DropdownMenu>
					<DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left outline-none cursor-pointer">
						<div className="flex items-center gap-3">
							<Avatar className="w-8 h-8 rounded-lg">
								<AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs font-semibold">
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col min-w-0">
								<span className="text-xs font-semibold text-sidebar-foreground truncate block">
									{user.name}
								</span>
								<span className="text-[10px] text-muted-foreground truncate block">
									{getRoleLabel(user.role)}
								</span>
							</div>
						</div>
						<ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[223px]">
						{onSwitchToStudent && (
							<DropdownMenuItem onClick={onSwitchToStudent} className="cursor-pointer gap-2">
								<User className="w-4 h-4" />
								Switch to Student Portal
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer gap-2">
							<LogOut className="w-4 h-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</aside>
	);
}
