interface PortalStepsBarProps {
	currentStep: number;
}

export function PortalStepsBar({ currentStep }: PortalStepsBarProps) {
	const steps = [
		{ number: 1, label: "Profile" },
		{ number: 2, label: "Semesters" },
		{ number: 3, label: "Grades" },
		{ number: 4, label: "Documents" },
		{ number: 5, label: "Status" },
	];

	return (
		<div className="flex gap-2 items-center justify-between px-4 py-2 border border-brand-border rounded-xl bg-card shadow-sm w-full select-none">
			{steps.map((step, idx) => {
				const isActive = currentStep === step.number;
				const isCompleted = currentStep > step.number;

				return (
					<div key={step.number} className="flex flex-1 items-center">
						<div className="flex gap-2 items-center shrink-0">
							{/* Step Number Circle */}
							<div
								className={`rounded-full size-[26px] flex items-center justify-center text-xs font-semibold select-none transition-all duration-300 ${
									isActive
										? "bg-brand-primary text-white shadow-sm ring-2 ring-brand-primary-light/50 scale-105"
										: isCompleted
											? "bg-brand-primary-dark text-white"
											: "bg-brand-muted/20 text-brand-muted"
								}`}
							>
								{step.number}
							</div>
							{/* Step Label */}
							<span
								className={`font-sans text-xs tracking-wider transition-colors duration-300 ${
									isActive
										? "font-semibold text-black"
										: isCompleted
											? "font-medium text-brand-primary-dark"
											: "font-normal text-brand-muted"
								}`}
							>
								{step.label}
							</span>
						</div>

						{/* Divider Line (except last step) */}
						{idx < steps.length - 1 && (
							<div className="flex-1 mx-3 h-[1px] bg-brand-border min-w-[20px]" />
						)}
					</div>
				);
			})}
		</div>
	);
}
