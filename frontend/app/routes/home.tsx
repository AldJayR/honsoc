import { LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function meta() {
	return [
		{ title: "Home - NEUST Honor Society" },
		{
			name: "description",
			content: "Apply or login to the NEUST Honor Society portal",
		},
	];
}

export default function HomeRoute() {
	return (
		<div className="mx-auto flex w-[215px] flex-col items-center gap-2.5">
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
