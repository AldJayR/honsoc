import { Check } from "lucide-react";
import { StepNavigation } from "~/portal/components/StepNavigation";
import { formatSchoolYear } from "~/lib/format";

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
	const formattedYear = formatSchoolYear(schoolYear);
	const firstSemYear = `AY ${formattedYear}`;
	const secondSemYear = `AY ${formattedYear}`;

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
		<div className="flex flex-col items-start w-full gap-6 animate-fade-in">
			<p className="select-none type-body-small text-muted-foreground">
				Select the semester(s) for which you are applying. Your GWA will be
				computed from the grades you enter for each selected semester.
			</p>

			<div className="flex items-start w-full gap-4">
				{/* 1st Semester Card */}
				{canSelectFirst ? (
					<button
						type="button"
						onClick={() => handleCardClick("firstSem")}
						className={`flex-1 text-left flex gap-3 items-start p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none bg-card ${
							selectedSemesters.firstSem
								? "border-amber-500 ring-1 ring-amber-500/20 shadow-sm"
								: "border-border hover:border-muted-foreground/40 shadow-sm"
						}`}
					>
						{/* Checkbox box */}
						<div
							className={`rounded-md size-4 flex items-center justify-center border transition-all ${
								selectedSemesters.firstSem
									? "bg-amber-500 border-amber-500 text-white"
									: "bg-card border-border text-transparent"
							}`}
						>
							<Check className="size-3 stroke-[3]" />
						</div>
						<div className="flex flex-col gap-1 leading-tight">
							<span className="type-label">
								1st Semester
							</span>
							<span className="type-caption text-muted-foreground">
								{firstSemYear}
							</span>
						</div>
					</button>
				) : null}

				{/* 2nd Semester Card */}
				{canSelectSecond ? (
					<button
						type="button"
						onClick={() => handleCardClick("secondSem")}
						className={`flex-1 text-left flex gap-3 items-start p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none bg-card ${
							selectedSemesters.secondSem
								? "border-amber-500 ring-1 ring-amber-500/20 shadow-sm"
								: "border-border hover:border-muted-foreground/40 shadow-sm"
						}`}
					>
						{/* Checkbox box */}
						<div
							className={`rounded-md size-4 flex items-center justify-center border transition-all ${
								selectedSemesters.secondSem
									? "bg-amber-500 border-amber-500 text-white"
									: "bg-card border-border text-transparent"
							}`}
						>
							<Check className="size-3 stroke-[3]" />
						</div>
						<div className="flex flex-col gap-1 leading-tight">
							<span className="type-label">
								2nd Semester
							</span>
							<span className="type-caption text-muted-foreground">
								{secondSemYear}
							</span>
						</div>
					</button>
				) : null}
			</div>

			{/* Navigation Buttons */}
			<StepNavigation onBack={onBack} onContinue={onContinue} />
		</div>
	);
}
