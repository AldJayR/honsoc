import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Link } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UserProfile } from "@/shared/services/auth.api";

export interface AdminSidebarMenuItem<Tab extends string = string> {
	id: Tab;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	to?: string;
}

interface AdminSidebarProps<Tab extends string> {
	user: UserProfile;
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
	onLogout: () => void;
	onSwitchToStudent?: () => void;
	menuItems: readonly AdminSidebarMenuItem<Tab>[];
	managementItems?: readonly AdminSidebarMenuItem<Tab>[];
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

function AdminNavGroup<Tab extends string>({
	label,
	items,
	activeTab,
	onTabChange,
}: {
	label: string;
	items: readonly AdminSidebarMenuItem<Tab>[];
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}) {
	return (
		<SidebarGroup className="px-3 py-3">
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const Icon = item.icon;
						return (
							<SidebarMenuItem key={item.id}>
								<SidebarMenuButton
									isActive={activeTab === item.id}
									tooltip={item.label}
									render={item.to ? <Link to={item.to} /> : undefined}
									onClick={item.to ? undefined : () => onTabChange(item.id)}
								>
									<Icon />
									<span>{item.label}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

export function AdminSidebar<Tab extends string>({
	user,
	activeTab,
	onTabChange,
	onLogout,
	onSwitchToStudent,
	menuItems,
	managementItems = [],
}: AdminSidebarProps<Tab>) {
	return (
		<Sidebar collapsible="icon" className="border-sidebar-border">
			<SidebarHeader className="p-3 group-data-[collapsible=icon]:p-1">
				<div className="flex items-center gap-3 rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
					<img
						alt="NEUST Honor Society"
						className="size-8 shrink-0 object-contain group-data-[collapsible=icon]:size-10"
						src="/images/honor-soc-new-logo.png"
					/>
					<div className="min-w-0 group-data-[collapsible=icon]:hidden">
						<p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
							NEUST
						</p>
						<p className="truncate text-xs leading-tight text-muted-foreground">
							Honor Society
						</p>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<AdminNavGroup
					label="Workspace"
					items={menuItems}
					activeTab={activeTab}
					onTabChange={onTabChange}
				/>
				{managementItems.length > 0 && (
					<AdminNavGroup
						label="Management"
						items={managementItems}
						activeTab={activeTab}
						onTabChange={onTabChange}
					/>
				)}
			</SidebarContent>

			<SidebarFooter className="p-3">
				<DropdownMenu>
					<DropdownMenuTrigger
						className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
						aria-label={`Open account menu for ${user.name}`}
					>
						<Avatar className="size-8 shrink-0 rounded-lg">
							<AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
								{getInitials(user.name)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
							<p className="truncate text-xs font-semibold text-sidebar-foreground">
								{user.name}
							</p>
							<p className="truncate text-[10px] text-muted-foreground">
								{getRoleLabel(user.role)}
							</p>
						</div>
						<ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
					</DropdownMenuTrigger>
					<DropdownMenuContent side="right" align="end" className="w-56">
						{onSwitchToStudent && (
							<DropdownMenuItem onClick={onSwitchToStudent}>
								<UserRound />
								Switch to Student Portal
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={onLogout} variant="destructive">
							<LogOut />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
