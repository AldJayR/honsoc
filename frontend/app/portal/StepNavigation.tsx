import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
		<div className="mt-6 flex w-full items-center justify-end gap-3">
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

