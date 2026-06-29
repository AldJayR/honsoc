import { useState } from "react";
import { PortalDocumentsStep } from "~/portal/components/PortalDocumentsStep";
import { PortalGradesStep } from "~/portal/components/PortalGradesStep";
import { PortalHeader } from "~/portal/components/PortalHeader";
import { PortalProfileStep } from "~/portal/components/PortalProfileStep";
import { PortalSemestersStep } from "~/portal/components/PortalSemestersStep";
import { PortalStatusStep } from "~/portal/components/PortalStatusStep";
import { PortalStepsBar } from "~/portal/components/PortalStepsBar";
import { useApplicationSubmit } from "~/portal/hooks/useApplicationSubmit";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import type { ProfileFormValues } from "~/shared/lib/schemas/portal";
import type {
	ApplicationStatusItem,
	GradeInput,
	Term,
	UserProfile,
} from "~/shared/services/auth.api";

interface PortalPageProps {
	user: UserProfile;
	activeTerm: Term | null;
	applications: ApplicationStatusItem[];
}

export function PortalPage({
	user,
	activeTerm,
	applications: initialApps,
}: PortalPageProps) {
	const schoolYear = activeTerm?.schoolYear || "2025 - 2026";
	const openSemester = activeTerm?.semester || "BOTH";
	const gwaThreshold = activeTerm
		? Number.parseFloat(activeTerm.gwaThreshold)
		: 1.75;

	const [applications, setApplications] =
		useState<ApplicationStatusItem[]>(initialApps);
	const [step, setStep] = useState(
		initialApps && initialApps.length > 0 ? 5 : 1,
	);

	const [profile, setProfile] = useState<ProfileFormValues>({
		campusId: "",
		departmentId: "",
		academicYear: schoolYear,
		yearLevel: "2ND_YEAR",
		program: "Bachelor of Science in Information Technology",
		majorId: "",
	});

	const [selectedSemesters, setSelectedSemesters] = useState({
		firstSem: openSemester === "1ST" || openSemester === "BOTH",
		secondSem: openSemester === "2ND",
	});

	const [grades1st, setGrades1st] = useState<GradeInput[]>([]);
	const [grades2nd, setGrades2nd] = useState<GradeInput[]>([]);

	const [files, setFiles] = useState<{
		COR?: File;
		COG_1ST?: File;
		COG_2ND?: File;
		GMC?: File;
	}>({});

	const { submit, isSubmitting, statusText } = useApplicationSubmit({
		profile,
		selectedSemesters,
		grades1st,
		grades2nd,
		files,
		onApplicationsChange: setApplications,
		onStepChange: setStep,
	});

	if (isSubmitting) {
		return <LoadingFallback label={statusText} />;
	}

	return (
		<div className="min-h-screen bg-brand-background flex flex-col items-center p-6">
			<div className="w-full max-w-[708px] flex flex-col gap-6 items-center">
				<PortalHeader user={user} />
				<PortalStepsBar currentStep={step} />

				<main className="w-full bg-card border border-brand-border rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col justify-start">
					{step === 1 && (
						<PortalProfileStep
							defaultValues={profile}
							onSubmit={(data) => {
								setProfile(data);
								setStep(2);
							}}
							schoolYear={schoolYear}
						/>
					)}

					{step === 2 && (
						<PortalSemestersStep
							selectedSemesters={selectedSemesters}
							onChange={setSelectedSemesters}
							onBack={() => setStep((prev) => Math.max(1, prev - 1))}
							onContinue={() => setStep(3)}
							schoolYear={schoolYear}
							openSemester={openSemester}
						/>
					)}

					{step === 3 && (
						<PortalGradesStep
							selectedSemesters={selectedSemesters}
							grades1st={grades1st}
							onChange1st={setGrades1st}
							grades2nd={grades2nd}
							onChange2nd={setGrades2nd}
							onBack={() => setStep((prev) => Math.max(1, prev - 1))}
							onContinue={() => setStep(4)}
							gwaThreshold={gwaThreshold}
						/>
					)}

					{step === 4 && (
						<PortalDocumentsStep
							selectedSemesters={selectedSemesters}
							files={files}
							onChange={setFiles}
							onBack={() => setStep((prev) => Math.max(1, prev - 1))}
							onSubmit={submit}
							isPending={isSubmitting}
							schoolYear={schoolYear}
						/>
					)}

					{step === 5 && (
						<PortalStatusStep
							applications={applications}
							schoolYear={schoolYear}
						/>
					)}
				</main>
			</div>
		</div>
	);
}
