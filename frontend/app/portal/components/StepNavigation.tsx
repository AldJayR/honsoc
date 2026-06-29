import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { BACK_BUTTON_CLASS, CONTINUE_BUTTON_CLASS } from "~/shared/lib/constants";

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
		<div className="flex items-center justify-end gap-3 w-full mt-4 select-none">
			<Button
				type="button"
				onClick={onBack}
				disabled={isPending}
				className={BACK_BUTTON_CLASS}
			>
				<ArrowLeft className="size-4 shrink-0 text-brand-primary" />
				Back
			</Button>
			<Button
				type="button"
				onClick={onContinue}
				disabled={disabled || isPending}
				className={CONTINUE_BUTTON_CLASS}
			>
				{continueLabel}
				<ArrowRight className="size-4 shrink-0" />
			</Button>
		</div>
	);
}
