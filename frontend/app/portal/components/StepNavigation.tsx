import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface StepNavigationProps {
	onBack: () => void;
	onContinue: () => void;
	continueLabel?: string;
	disabled?: boolean;
	isPending?: boolean;
}

export function StepNavigation({
	onBack,
	onContinue,
	continueLabel = "Continue",
	disabled,
	isPending,
}: StepNavigationProps) {
	return (
		<div className="flex items-center justify-end w-full gap-3 mt-4 select-none">
			<Button
				type="button"
				variant="outline"
				onClick={onBack}
				disabled={isPending}
			>
				<ArrowLeft />
				Back
			</Button>
			<Button
				type="button"
				onClick={onContinue}
				disabled={disabled || isPending}
			>
				{continueLabel}
				<ArrowRight />
			</Button>
		</div>
	);
}
