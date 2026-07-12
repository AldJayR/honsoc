import { Check } from "lucide-react";
import { StepNavigation } from "@/portal/StepNavigation";
import { formatSchoolYear } from "@/lib/format";

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
	const semesterOptions = [
		{ key: "firstSem" as const, label: "1st Semester", year: firstSemYear, enabled: canSelectFirst },
		{ key: "secondSem" as const, label: "2nd Semester", year: secondSemYear, enabled: canSelectSecond },
	];

	return (
		<div className="flex w-full flex-col items-start gap-6">
			<p className="select-none type-body-small text-muted-foreground">
				Select the semester(s) for which you are applying. Your GWA will be
				computed from the grades you enter for each selected semester.
			</p>

			<div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
				{semesterOptions.map((semester) => {
					if (!semester.enabled) return null;
					const isSelected = selectedSemesters[semester.key];

					return (
						<button
							key={semester.key}
							type="button"
							onClick={() => handleCardClick(semester.key)}
							className={`flex flex-1 items-start gap-3 rounded-lg border bg-card p-3 text-left ${
								isSelected
									? "border-amber-500 bg-amber-500/5"
									: "border-border hover:border-muted-foreground/40"
							}`}
						>
							<div
								className={`flex size-4 items-center justify-center rounded border ${
									isSelected
										? "border-amber-500 bg-amber-500 text-white"
										: "border-border bg-card text-transparent"
								}`}
							>
								<Check className="size-3 stroke-[3]" />
							</div>
							<div className="flex flex-col gap-1 leading-tight">
								<span className="type-label">{semester.label}</span>
								<span className="type-caption text-muted-foreground">{semester.year}</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Navigation Buttons */}
			<StepNavigation onBack={onBack} onContinue={onContinue} />
		</div>
	);
}


