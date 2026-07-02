import { useCallback, useEffect, useState } from "react";
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
	DraftData,
	DraftFile,
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
	draft: DraftData | null;
}

export function PortalPage({
	user,
	activeTerm,
	applications: initialApps,
	campuses,
	departments,
	majors,
	draft: initialDraft,
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
	} = useApplicationDraft(initialDraft, !!hasSubmitted);

	const [applications, setApplications] =
		useState<ApplicationStatusItem[]>(initialApps);

	const [step, setStep] = useState<number>(() => {
		if (hasSubmitted) return 5;
		return draft?.currentStep || 1;
	});

	const [profile, setProfile] = useState<ProfileFormValues>(() => {
		if (!hasSubmitted && draft?.profile) {
			return {
				campusId: draft.profile.campusId ? String(draft.profile.campusId) : "",
				departmentId: draft.profile.departmentId ? String(draft.profile.departmentId) : "",
				academicYear: draft.profile.academicYear || schoolYear,
				yearLevel: (draft.profile.yearLevel as ProfileFormValues["yearLevel"]) || "2ND_YEAR",
				program: draft.profile.program || "BS in Information Technology",
				majorId: draft.profile.majorId ? String(draft.profile.majorId) : "",
			};
		}
		return {
			campusId: "",
			departmentId: "",
			academicYear: schoolYear,
			yearLevel: "2ND_YEAR",
			program: "BS in Information Technology",
			majorId: "",
		};
	});

	const [selectedSemesters, setSelectedSemesters] = useState(() => {
		if (!hasSubmitted && draft?.semesters) {
			return draft.semesters;
		}
		return {
			firstSem: openSemester === "1ST" || openSemester === "BOTH",
			secondSem: openSemester === "2ND",
		};
	});

	const [grades1st, setGrades1st] = useState<GradeInput[]>(() => {
		if (!hasSubmitted && draft?.grades1st) {
			return draft.grades1st;
		}
		return [];
	});

	const [grades2nd, setGrades2nd] = useState<GradeInput[]>(() => {
		if (!hasSubmitted && draft?.grades2nd) {
			return draft.grades2nd;
		}
		return [];
	});

	const [files, setFiles] = useState<{
		COR?: File;
		COG_1ST?: File;
		COG_2ND?: File;
		GMC?: File;
	}>({});

	const [fileMetadata, setFileMetadata] = useState<{
		COR: DraftFile | null;
		COG_1ST: DraftFile | null;
		COG_2ND: DraftFile | null;
		GMC: DraftFile | null;
	} | null>(() => {
		if (!hasSubmitted && draft?.files) {
			return {
				COR: draft.files.COR ?? null,
				COG_1ST: draft.files.COG_1ST ?? null,
				COG_2ND: draft.files.COG_2ND ?? null,
				GMC: draft.files.GMC ?? null,
			};
		}
		return null;
	});

	const handleFilesChange = useCallback((newFiles: typeof files) => {
		setFiles(newFiles);
		setFileMetadata((prev) => {
			return {
				COR: newFiles.COR ? { name: newFiles.COR.name, size: newFiles.COR.size, type: newFiles.COR.type } : (prev?.COR ?? null),
				COG_1ST: newFiles.COG_1ST ? { name: newFiles.COG_1ST.name, size: newFiles.COG_1ST.size, type: newFiles.COG_1ST.type } : (prev?.COG_1ST ?? null),
				COG_2ND: newFiles.COG_2ND ? { name: newFiles.COG_2ND.name, size: newFiles.COG_2ND.size, type: newFiles.COG_2ND.type } : (prev?.COG_2ND ?? null),
				GMC: newFiles.GMC ? { name: newFiles.GMC.name, size: newFiles.GMC.size, type: newFiles.GMC.type } : (prev?.GMC ?? null),
			};
		});
	}, []);

	useEffect(() => {
		if (hasSubmitted) return;

		saveDraftToServer({
			profile: {
				campusId: profile.campusId ? Number(profile.campusId) : undefined,
				departmentId: profile.departmentId ? Number(profile.departmentId) : undefined,
				academicYear: profile.academicYear,
				yearLevel: profile.yearLevel,
				program: profile.program,
				majorId: profile.majorId ? Number(profile.majorId) : null,
			},
			semesters: selectedSemesters,
			grades1st,
			grades2nd,
			files: fileMetadata ?? undefined,
			currentStep: step,
		});
	}, [profile, selectedSemesters, grades1st, grades2nd, fileMetadata, step, saveDraftToServer, hasSubmitted]);

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

				{!hasSubmitted && (
					<div className="w-full text-center text-xs text-muted-foreground select-none">
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
							onChange={handleFilesChange}
							onBack={() => setStep((prev) => Math.max(1, prev - 1))}
							onSubmit={submit}
							isPending={isSubmitting}
							schoolYear={schoolYear}
							fileMetadata={fileMetadata}
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
