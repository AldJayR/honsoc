import { UserPlus } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";
import { PRIMARY_BUTTON_CLASS } from "~/shared/lib/constants";

const handleLoginClick = () => {
	toast.info("Login portal is currently under development.", {
		description:
			"Please proceed with 'Apply for membership' to see the registration steps.",
		duration: 5000,
	});
};

export function HomePage() {
	return (
		<div className="flex flex-col gap-2.5 items-center mx-auto w-[215px] animate-in fade-in slide-in-from-bottom-4 duration-500">
			<Link
				to="/register"
				className={buttonVariants({
					className: `${PRIMARY_BUTTON_CLASS} w-full`,
				})}
			>
				<UserPlus className="size-4 shrink-0" />
				Apply for membership
			</Link>

			<div className="flex gap-5 items-center justify-center w-full select-none">
				<div className="h-px bg-brand-border flex-1" />
				<span className="font-sans font-normal leading-4 text-brand-muted text-xs whitespace-nowrap">
					or
				</span>
				<div className="h-px bg-brand-border flex-1" />
			</div>

			<Button
				onClick={handleLoginClick}
				className="bg-background hover:bg-muted border-[0.5px] border-brand-primary text-brand-primary-light font-medium text-sm leading-5 tracking-normal h-8 px-3 rounded-lg flex gap-1.5 items-center justify-center shadow-sm cursor-pointer w-full transition-all duration-200 active:scale-[0.98]"
			>
				<UserPlus className="size-4 shrink-0 text-brand-primary" />
				Login to existing account
			</Button>
		</div>
	);
}
