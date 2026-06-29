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
		<Stepper
			value={STEP_VALUES[currentStep - 1]}
			nonInteractive
			className="w-full flex items-center justify-between gap-2 px-4 py-2 border shadow-sm select-none border-border rounded-xl bg-card"
		>
			<StepperList className="flex flex-row items-center w-full gap-0">
				{STEP_VALUES.map((value, idx) => (
					<StepperItem
						key={value}
						value={value}
						completed={currentStep > idx + 1}
						className="flex items-center flex-1 gap-2 not-last:flex-1"
					>
						<StepperTrigger className="gap-2">
							<StepperIndicator className="size-[26px] text-xs border-0 bg-muted-foreground/20 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/50 data-[state=active]:scale-105 data-[state=completed]:bg-primary data-[state=completed]:text-white" />
							<StepperTitle className="text-xs tracking-wider font-normal text-muted-foreground data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=completed]:font-medium data-[state=completed]:text-primary-foreground" />
						</StepperTrigger>
						<StepperSeparator className="h-[px] flex-1 mx-3 bg-border min-w-[20px]" />
					</StepperItem>
				))}
			</StepperList>
		</Stepper>
	);
}
