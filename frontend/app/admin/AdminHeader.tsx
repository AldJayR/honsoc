import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AdminHeaderProps {
	onBackClick?: () => void;
}

export function AdminHeader({ onBackClick }: AdminHeaderProps) {
	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
			<div className="flex items-center gap-2">
				<SidebarTrigger aria-label="Toggle admin navigation" />
				{onBackClick ? (
					<Button
						variant="ghost"
						size="icon"
						className="rounded-lg"
						onClick={onBackClick}
						aria-label="Go back"
					>
						<ArrowLeft />
					</Button>
				) : null}
			</div>

			<Button
				variant="ghost"
				size="icon"
				className="rounded-lg text-muted-foreground hover:text-foreground"
				aria-label="Notifications"
			>
				<Bell />
			</Button>
		</header>
	);
}
