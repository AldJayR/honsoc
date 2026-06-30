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
const STEP_LABELS = ["Profile", "Semesters", "Grades", "Documents", "Status"];

interface PortalStepsBarProps {
	currentStep: number;
}

export function PortalStepsBar({ currentStep }: PortalStepsBarProps) {
	return (
		<Stepper
			value={STEP_VALUES[currentStep - 1]}
			nonInteractive
			className="w-full flex items-center justify-between gap-2 px-4 py-2 select-none"
		>
			<StepperList className="flex flex-row items-center w-full gap-0">
				{STEP_VALUES.map((value, idx) => {
					const stepNum = idx + 1;
					const isCompleted = currentStep > stepNum;
					const isActive = currentStep === stepNum;

					return (
						<StepperItem
							key={value}
							value={value}
							completed={isCompleted}
							className="flex items-center flex-1 gap-2 not-last:flex-1"
						>
							<StepperTrigger className="gap-2">
								<StepperIndicator
									className={`size-[26px] text-xs border-0 ${
										isCompleted
											? "bg-primary text-white"
											: isActive
												? "bg-primary text-white shadow-sm ring-2 ring-primary/50 scale-105"
												: "bg-muted-foreground/20 text-muted-foreground"
									}`}
								>
									{isCompleted ? "✓" : stepNum}
								</StepperIndicator>
								<StepperTitle
									className={`text-xs tracking-wider ${
										isCompleted
											? "font-medium text-primary-foreground"
											: "font-semibold text-foreground"
									}`}
								>
									{STEP_LABELS[idx]}
								</StepperTitle>
							</StepperTrigger>
							{idx < STEP_VALUES.length - 1 && (
								<StepperSeparator
									className={`h-px flex-1 mx-3 min-w-[20px] ${
										isCompleted ? "bg-primary" : "bg-border"
									}`}
								/>
							)}
						</StepperItem>
					);
				})}
			</StepperList>
		</Stepper>
	);
}
