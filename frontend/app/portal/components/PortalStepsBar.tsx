import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperList,
	StepperSeparator,
	StepperTitle,
	StepperTrigger,
} from "~/components/ui/stepper";

const STEP_VALUES = ["profile", "semesters", "grades", "documents", "status"];

interface PortalStepsBarProps {
	currentStep: number;
}

export function PortalStepsBar({ currentStep }: PortalStepsBarProps) {
	return (
		<div className="flex gap-2 items-center justify-between px-4 py-2 border border-brand-border rounded-xl bg-card shadow-sm w-full select-none">
			<Stepper
				value={STEP_VALUES[currentStep - 1]}
				nonInteractive
				className="w-full"
			>
				<StepperList className="flex flex-row items-center gap-0 w-full">
					{STEP_VALUES.map((value, idx) => (
						<StepperItem
							key={value}
							value={value}
							completed={currentStep > idx + 1}
							className="flex flex-1 items-center gap-2 not-last:flex-1"
						>
							<StepperTrigger className="gap-2">
								<StepperIndicator className="size-[26px] text-xs border-0 bg-brand-muted/20 text-brand-muted data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-brand-primary-light/50 data-[state=active]:scale-105 data-[state=completed]:bg-brand-primary-dark data-[state=completed]:text-white" />
								<StepperTitle className="text-xs tracking-wider font-normal text-brand-muted data-[state=active]:font-semibold data-[state=active]:text-black data-[state=completed]:font-medium data-[state=completed]:text-brand-primary-dark" />
							</StepperTrigger>
							<StepperSeparator className="h-[px] flex-1 mx-3 bg-brand-border min-w-[20px]" />
						</StepperItem>
					))}
				</StepperList>
			</Stepper>
		</div>
	);
}
