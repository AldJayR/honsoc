import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperList,
	StepperTitle,
	StepperTrigger,
} from "@/components/ui/stepper";

const STEP_VALUES = ["profile", "semesters", "grades", "documents", "status"];
const STEP_LABELS = ["Profile", "Semesters", "Grades", "Documents", "Status"];

interface PortalStepsBarProps {
	currentStep: number;
}

export function PortalStepsBar({ currentStep }: PortalStepsBarProps) {
	return (
		<Stepper
			key={currentStep}
			value={STEP_VALUES[currentStep - 1]}
			nonInteractive
			className="flex w-full items-center justify-between gap-2 px-1 py-2 sm:px-4"
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
												? "bg-primary text-white"
												: "bg-muted-foreground/20 text-muted-foreground"
									}`}
								>
									{isCompleted ? "✓" : stepNum}
								</StepperIndicator>
								<StepperTitle
									className={`text-xs tracking-wider ${
										isActive
											? "font-semibold text-foreground"
											: isCompleted
												? "font-medium text-primary"
												: "font-medium text-muted-foreground"
									}`}
								>
									{STEP_LABELS[idx]}
								</StepperTitle>
							</StepperTrigger>
							{idx < STEP_VALUES.length - 1 && (
								<div
									role="separator"
									aria-hidden="true"
									className={`h-px flex-1 mx-3 min-w-[20px] transition-colors ${
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

