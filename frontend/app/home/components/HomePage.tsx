import { LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export function HomePage() {
	return (
		<div className="flex flex-col gap-2.5 items-center mx-auto w-[215px] animate-in fade-in slide-in-from-bottom-4 duration-500">
			<Button render={<Link to="/register" />} nativeButton={false} className="w-full">
				<UserPlus />
				Apply for membership
			</Button>

			<div className="flex items-center justify-center w-full gap-5 select-none">
				<div className="flex-1 h-px bg-border" />
				<span className="type-caption text-muted-foreground">
					or
				</span>
				<div className="flex-1 h-px bg-border" />
			</div>

			<Button
				variant="outline"
				render={<Link to="/login" />}
				nativeButton={false}
				className="w-full"
			>
				<LogIn />
				Login to existing account
			</Button>
		</div>
	);
}
