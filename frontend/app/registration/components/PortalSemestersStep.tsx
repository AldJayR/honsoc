import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface PortalSemestersStepProps {
	selectedSemesters: {
		firstSem: boolean;
		secondSem: boolean;
	};
	onChange: (semesters: { firstSem: boolean; secondSem: boolean }) => void;
	onBack: () => void;
	onContinue: () => void;
	schoolYear: string;
	openSemester: "1ST" | "2ND" | "BOTH";
}

export function PortalSemestersStep({
	selectedSemesters,
	onChange,
	onBack,
	onContinue,
	schoolYear,
	openSemester,
}: PortalSemestersStepProps) {
	// Parse school years
	// e.g. "2025-2026"
	const firstSemYear = `AY ${schoolYear ? schoolYear.split("-")[0] : "2024"}-${schoolYear ? schoolYear.split("-")[0] : "2025"}`; // Wait, 1st sem year is the first year
	const secondSemYear = `AY ${schoolYear ? schoolYear.split("-")[0] : "2025"}-${schoolYear ? schoolYear.split("-")[1] : "2026"}`;

	const handleCardClick = (sem: "firstSem" | "secondSem") => {
		// If the admin only opened one semester, lock it
		if (openSemester === "1ST" && sem === "secondSem") return;
		if (openSemester === "2ND" && sem === "firstSem") return;

		const nextState = {
			...selectedSemesters,
			[sem]: !selectedSemesters[sem],
		};

		// Prevent selecting none
		if (!nextState.firstSem && !nextState.secondSem) {
			return;
		}

		onChange(nextState);
	};

	const canSelectFirst = openSemester === "1ST" || openSemester === "BOTH";
	const canSelectSecond = openSemester === "2ND" || openSemester === "BOTH";

	return (
		<div className="flex flex-col gap-6 items-start w-full animate-fade-in">
			<p className="font-sans font-normal text-sm leading-5 text-brand-muted select-none">
				Select the semester(s) for which you are applying. Your GWA will be computed from the grades you enter for each selected semester.
			</p>

			<div className="flex gap-4 items-start w-full">
				{/* 1st Semester Card */}
				{canSelectFirst && (
					<button
						type="button"
						onClick={() => handleCardClick("firstSem")}
						className={`flex-1 text-left flex gap-3 items-start p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none bg-card ${
							selectedSemesters.firstSem
								? "border-amber-500 ring-1 ring-amber-500/20 shadow-sm"
								: "border-brand-border hover:border-brand-muted/40 shadow-sm"
						}`}
					>
						{/* Checkbox box */}
						<div
							className={`rounded-md size-4 flex items-center justify-center border transition-all ${
								selectedSemesters.firstSem
									? "bg-amber-500 border-amber-500 text-white"
									: "bg-white border-brand-border text-transparent"
							}`}
						>
							<Check className="size-3 stroke-[3]" />
						</div>
						<div className="flex flex-col gap-1 leading-tight">
							<span className="font-sans font-medium text-sm text-foreground">
								1st Semester
							</span>
							<span className="font-sans font-normal text-xs text-brand-muted">
								{firstSemYear}
							</span>
						</div>
					</button>
				)}

				{/* 2nd Semester Card */}
				{canSelectSecond && (
					<button
						type="button"
						onClick={() => handleCardClick("secondSem")}
						className={`flex-1 text-left flex gap-3 items-start p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none bg-card ${
							selectedSemesters.secondSem
								? "border-amber-500 ring-1 ring-amber-500/20 shadow-sm"
								: "border-brand-border hover:border-brand-muted/40 shadow-sm"
						}`}
					>
						{/* Checkbox box */}
						<div
							className={`rounded-md size-4 flex items-center justify-center border transition-all ${
								selectedSemesters.secondSem
									? "bg-amber-500 border-amber-500 text-white"
									: "bg-white border-brand-border text-transparent"
							}`}
						>
							<Check className="size-3 stroke-[3]" />
						</div>
						<div className="flex flex-col gap-1 leading-tight">
							<span className="font-sans font-medium text-sm text-foreground">
								2nd Semester
							</span>
							<span className="font-sans font-normal text-xs text-brand-muted">
								{secondSemYear}
							</span>
						</div>
					</button>
				)}
			</div>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-end gap-3 w-full mt-4 select-none">
				<Button
					type="button"
					onClick={onBack}
					className="bg-white border border-brand-primary text-brand-primary hover:bg-brand-primary-light/5 font-medium text-sm h-8 px-4 rounded-lg flex gap-1.5 items-center justify-center shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
				>
					<ArrowLeft className="size-4 shrink-0 text-brand-primary" />
					Back
				</Button>
				<Button
					type="button"
					onClick={onContinue}
					className="bg-brand-primary-dark hover:bg-brand-primary text-primary-foreground font-medium text-sm h-8 px-4 rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
				>
					Continue
					<ArrowRight className="size-4 shrink-0" />
				</Button>
			</div>
		</div>
	);
}
