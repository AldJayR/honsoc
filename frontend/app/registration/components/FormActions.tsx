import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { PRIMARY_BUTTON_CLASS } from "~/shared/lib/constants";

interface FormActionsProps {
	to?: string;
	label?: string;
	isPending?: boolean;
}

export function FormActions({
	to = "/",
	label = "Already have an account?",
	isPending = false,
}: FormActionsProps) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: <fieldset> requires <legend> and is for form controls, not navigation
		<div
			role="group"
			aria-label="Form navigation"
			className="flex items-center justify-between py-2 w-full mt-4 select-none"
		>
			<Link
				to={to}
				className="text-xs font-normal leading-4 text-foreground underline hover:text-brand-primary transition-colors whitespace-nowrap"
			>
				{label}
			</Link>

			<Button
				type="submit"
				disabled={isPending}
				aria-busy={isPending}
				className={`${PRIMARY_BUTTON_CLASS} w-[113px] disabled:opacity-50 disabled:cursor-not-allowed`}
			>
				{isPending ? (
					<>
						<span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						Submitting
					</>
				) : (
					<>
						Continue
						<ArrowRight className="size-4 shrink-0" />
					</>
				)}
			</Button>
		</div>
	);
}
