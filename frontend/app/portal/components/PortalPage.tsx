import { useEffect, useRef, useState } from "react";
import { PortalDocumentsStep } from "~/portal/components/PortalDocumentsStep";
import { PortalGradesStep } from "~/portal/components/PortalGradesStep";
import { PortalHeader } from "~/portal/components/PortalHeader";
import { PortalProfileStep } from "~/portal/components/PortalProfileStep";
import { PortalSemestersStep } from "~/portal/components/PortalSemestersStep";
import { PortalStatusStep } from "~/portal/components/PortalStatusStep";
import { PortalStepsBar } from "~/portal/components/PortalStepsBar";
import { useApplicationDraft } from "~/portal/hooks/useApplicationDraft";
import { useApplicationSubmit } from "~/portal/hooks/useApplicationSubmit";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import type { ProfileFormValues } from "~/shared/lib/schemas/portal";
import type {
	ApplicationStatusItem,
	Campus,
	Department,
	GradeInput,
	Major,
	Term,
	UserProfile,
} from "~/shared/services/auth.api";

interface PortalPageProps {
	user: UserProfile;
	activeTerm: Term | null;
	applications: ApplicationStatusItem[];
	campuses: Campus[];
	departments: Department[];
	majors: Major[];
}

export function PortalPage({
	user,
	activeTerm,
	applications: initialApps,
	campuses,
	departments,
	majors,
}: PortalPageProps) {
	const schoolYear = activeTerm?.schoolYear || "2025 - 2026";
	const openSemester = activeTerm?.semester || "BOTH";
	const gwaThreshold = activeTerm
		? Number.parseFloat(activeTerm.gwaThreshold)
		: 1.75;

	const hasSubmitted = initialApps && initialApps.length > 0;

	const {
		draft,
		isSaving,
		lastSaved,
		saveDraft: saveDraftToServer,
		clearDraft,
	} = useApplicationDraft(!!hasSubmitted);

	const [applications, setApplications] =
		useState<ApplicationStatusItem[]>(initialApps);
	const [step, setStep] = useState(hasSubmitted ? 5 : 1);

	const [profile, setProfile] = useState<ProfileFormValues>({
		campusId: "",
		departmentId: "",
		academicYear: schoolYear,
		yearLevel: "2ND_YEAR",
		program: "BS in Information Technology",
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

	const draftRestoredRef = useRef(false);

	useEffect(() => {
		if (!draft || draftRestoredRef.current || hasSubmitted) return;
		draftRestoredRef.current = true;

		if (draft.currentStep) {
			setStep(draft.currentStep);
		}

		if (draft.profile) {
			setProfile({
				campusId: draft.profile.campusId
					? String(draft.profile.campusId)
					: "",
				departmentId: draft.profile.departmentId
					? String(draft.profile.departmentId)
					: "",
				academicYear: draft.profile.academicYear || schoolYear,
				yearLevel:
					(draft.profile.yearLevel as ProfileFormValues["yearLevel"]) ||
					"2ND_YEAR",
				program: draft.profile.program || "",
				majorId: draft.profile.majorId
					? String(draft.profile.majorId)
					: "",
			});
		}

		if (draft.semesters) {
			setSelectedSemesters(draft.semesters);
		}

		if (draft.grades1st) setGrades1st(draft.grades1st);
		if (draft.grades2nd) setGrades2nd(draft.grades2nd);
	}, [draft, hasSubmitted, schoolYear]);

	useEffect(() => {
		if (!draftRestoredRef.current || hasSubmitted) return;

		saveDraftToServer({
			profile: {
				campusId: profile.campusId ? Number(profile.campusId) : 0,
				departmentId: profile.departmentId
					? Number(profile.departmentId)
					: 0,
				academicYear: profile.academicYear,
				yearLevel: profile.yearLevel,
				program: profile.program,
				majorId: profile.majorId ? Number(profile.majorId) : null,
			},
			semesters: selectedSemesters,
			grades1st,
			grades2nd,
			currentStep: step,
		});
	}, [profile, selectedSemesters, grades1st, grades2nd, step, saveDraftToServer, hasSubmitted]);

	const { submit, isSubmitting, statusText } = useApplicationSubmit({
		profile,
		selectedSemesters,
		grades1st,
		grades2nd,
		files,
		onApplicationsChange: (apps) => {
			setApplications(apps);
			clearDraft();
		},
		onStepChange: setStep,
	});

	if (isSubmitting) {
		return <LoadingFallback label={statusText} />;
	}

	return (
		<div className="flex flex-col items-center min-h-screen p-6 bg-background">
			<div className="w-full max-w-[708px] flex flex-col gap-6 items-center">
				<PortalHeader user={user} />
				<PortalStepsBar currentStep={step} />

				{!hasSubmitted && draftRestoredRef.current && (
					<div className="w-full text-center text-xs text-muted-foreground">
						{isSaving
							? "Saving draft..."
							: lastSaved
								? `Draft saved at ${lastSaved.toLocaleTimeString()}`
								: ""}
					</div>
				)}

				<main className="w-full p-6 min-h-[300px] flex flex-col justify-start">
					{step === 1 ? (
						<PortalProfileStep
							defaultValues={profile}
							onSubmit={(data) => {
								setProfile(data);
								setStep(2);
							}}
							schoolYear={schoolYear}
							campuses={campuses}
							departments={departments}
							majors={majors}
						/>
					) : null}

					{step === 2 ? (
						<PortalSemestersStep
							selectedSemesters={selectedSemesters}
							onChange={setSelectedSemesters}
							onBack={() => setStep((prev) => Math.max(1, prev - 1))}
							onContinue={() => setStep(3)}
							schoolYear={schoolYear}
							openSemester={openSemester}
						/>
					) : null}

					{step === 3 ? (
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
					) : null}

					{step === 4 ? (
						<PortalDocumentsStep
							selectedSemesters={selectedSemesters}
							files={files}
							onChange={setFiles}
							onBack={() => setStep((prev) => Math.max(1, prev - 1))}
							onSubmit={submit}
							isPending={isSubmitting}
							schoolYear={schoolYear}
							fileMetadata={draft?.files ?? null}
						/>
					) : null}

					{step === 5 ? (
						<PortalStatusStep
							applications={applications}
							schoolYear={schoolYear}
						/>
					) : null}
				</main>
			</div>
		</div>
	);
}
