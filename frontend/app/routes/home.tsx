import { UserPlus } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";

export function meta() {
	return [
		{ title: "NEUST Honor Society System" },
		{
			name: "description",
			content: "Welcome to the NEUST Honor Society System",
		},
	];
}

export default function Home() {
	const handleLoginClick = () => {
		toast.info("Login portal is currently under development.", {
			description:
				"Please proceed with 'Apply for membership' to see the registration steps.",
			duration: 5000,
		});
	};

	return (
		<div className="flex flex-col gap-[10px] items-center mx-auto w-[215px] animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Primary Action Button */}
			<Link
				to="/register"
				className={buttonVariants({
					className:
						"bg-brand-primary-dark hover:bg-[#4d3200] text-primary-foreground font-medium text-[14px] leading-5 tracking-normal h-[32px] px-3 rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer w-full transition-all duration-200 active:scale-[0.98]",
				})}
			>
				<UserPlus className="size-4 shrink-0" />
				Apply for membership
			</Link>

			{/* Separator */}
			<div className="flex gap-[20px] items-center justify-center w-full select-none">
				<div className="h-[1px] bg-brand-border flex-1" />
				<span className="font-sans font-normal leading-4 text-brand-muted text-[12px] whitespace-nowrap">
					or
				</span>
				<div className="h-[1px] bg-brand-border flex-1" />
			</div>

			{/* Secondary Action Button */}
			<Button
				onClick={handleLoginClick}
				className="bg-white hover:bg-zinc-50 border-[0.5px] border-brand-primary text-brand-primary-light font-medium text-[14px] leading-5 tracking-normal h-[32px] px-3 rounded-lg flex gap-1.5 items-center justify-center shadow-sm cursor-pointer w-full transition-all duration-200 active:scale-[0.98]"
			>
				<UserPlus className="size-4 shrink-0 text-brand-primary" />
				Login to existing account
			</Button>
		</div>
	);
}
