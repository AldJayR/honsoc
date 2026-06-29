import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

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
			className="flex items-center justify-between w-full py-2 mt-4 select-none"
		>
			<Link
				to={to}
				className="underline transition-colors type-caption text-foreground hover:text-primary whitespace-nowrap"
			>
				{label}
			</Link>

			<Button type="submit" disabled={isPending} aria-busy={isPending}>
				{isPending ? (
					<>
						<span className="border-2 border-current rounded-full size-4 border-t-transparent animate-spin" />
						Submitting
					</>
				) : (
					<>
						Continue
						<ArrowRight />
					</>
				)}
			</Button>
		</div>
	);
}
