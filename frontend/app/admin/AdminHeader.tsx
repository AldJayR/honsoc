import { Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
	title: string;
	onBackClick?: () => void;
}

export function AdminHeader({ title, onBackClick }: AdminHeaderProps) {
	return (
		<header className="h-[64px] border-b border-border flex items-center justify-between px-6 bg-white shrink-0 select-none">
			<div className="flex items-center gap-3">
				{onBackClick ? (
					<Button
						variant="ghost"
						size="icon"
						className="w-8 h-8 rounded-lg"
						onClick={onBackClick}
					>
						<ArrowLeft className="w-4 h-4" />
					</Button>
				) : null}
				<h2 className="text-sm font-medium text-foreground tracking-wide">{title}</h2>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
				>
					<Bell className="w-4 h-4" />
				</Button>
			</div>
		</header>
	);
}
