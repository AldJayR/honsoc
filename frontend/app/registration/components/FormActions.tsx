import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

interface FormActionsProps {
	to?: string;
	label?: string;
}

export function FormActions({
	to = "/",
	label = "Already have an account?",
}: FormActionsProps) {
	return (
		<div role="group" aria-label="Form navigation" className="flex items-center justify-between py-2 w-full mt-4 select-none">
			<Link
				to={to}
				className="text-xs font-normal leading-4 text-foreground underline hover:text-brand-primary transition-colors whitespace-nowrap"
			>
				{label}
			</Link>

			<Button
				type="submit"
				className="bg-brand-primary-dark hover:bg-brand-primary-dark text-primary-foreground font-medium text-sm leading-5 tracking-normal h-8 w-[113px] rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
			>
				Continue
				<ArrowRight className="size-4 shrink-0" />
			</Button>
		</div>
	);
}
