import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AdminHeaderProps {
	onBackClick?: () => void;
}

export function AdminHeader({ onBackClick }: AdminHeaderProps) {
	return (
		<header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4 sm:px-6">
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

		</header>
	);
}
