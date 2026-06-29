import { useState } from "react";
import { redirect, useNavigate } from "react-router";
import { toast } from "sonner";
import { PortalHeader } from "~/registration/components/PortalHeader";
import { PortalStepsBar } from "~/registration/components/PortalStepsBar";
import { PortalProfileStep } from "~/registration/components/PortalProfileStep";
import type { ProfileFormValues } from "~/registration/components/PortalProfileStep";
import { PortalSemestersStep } from "~/registration/components/PortalSemestersStep";
import { PortalGradesStep } from "~/registration/components/PortalGradesStep";
import { PortalDocumentsStep } from "~/registration/components/PortalDocumentsStep";
import { PortalStatusStep } from "~/registration/components/PortalStatusStep";
import { LoadingFallback } from "~/shared/components/LoadingFallback";
import {
	getMe,
	getActiveTerm,
	getMyApplications,
	submitApplication,
	presignDocument,
	uploadToR2,
	linkDocument,
} from "~/shared/services/api";
import type { ApplicationStatusItem, GradeInput } from "~/shared/services/api";
import type { Route } from "./+types/portal";

export async function clientLoader() {
	try {
		const user = await getMe();
		const activeTerm = await getActiveTerm();
		const appsRes = await getMyApplications();
		return {
			user,
			activeTerm,
			applications: appsRes.applications,
		};
	} catch (e) {
		throw redirect("/");
	}
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Loading your portal..." />;
}

export default function PortalRoute({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();
	const { user, activeTerm, applications: initialApps } = loaderData;

	// Term configs
	const schoolYear = activeTerm?.schoolYear || "2025 - 2026";
	const openSemester = activeTerm?.semester || "BOTH";
	const gwaThreshold = activeTerm ? Number.parseFloat(activeTerm.gwaThreshold) : 1.75;

	// State management for wizard
	const [applications, setApplications] = useState<ApplicationStatusItem[]>(initialApps || []);
	const [step, setStep] = useState(initialApps && initialApps.length > 0 ? 5 : 1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionStatusText, setSubmissionStatusText] = useState("");

	// Wizard Form values
	const [profile, setProfile] = useState<ProfileFormValues>({
		campusId: "",
		departmentId: "",
		academicYear: schoolYear,
		yearLevel: "2ND_YEAR",
		program: "Bachelor of Science in Information Technology",
		majorId: "",
	});

	const [selectedSemesters, setSelectedSemesters] = useState({
		// Default selections depending on what term is open
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

	// Handlers for steps navigation
	const handleProfileSubmit = (data: ProfileFormValues) => {
		setProfile(data);
		setStep(2);
	};

	const handleSemestersContinue = () => {
		setStep(3);
	};

	const handleGradesContinue = () => {
		setStep(4);
	};

	const handleBack = () => {
		setStep((prev) => Math.max(1, prev - 1));
	};

	// Final Submit Flow
	const handleApplicationSubmit = async () => {
		if (
			!files.COR ||
			!files.GMC ||
			(selectedSemesters.firstSem && !files.COG_1ST) ||
			(selectedSemesters.secondSem && !files.COG_2ND)
		) {
			toast.error("Please select all required documents first.");
			return;
		}

		setIsSubmitting(true);
		setSubmissionStatusText("Creating application records...");

		try {
			// 1. Submit application to get DB records
			let semesterPayload: "1ST" | "2ND" | "BOTH" = "BOTH";
			if (selectedSemesters.firstSem && !selectedSemesters.secondSem) {
				semesterPayload = "1ST";
			} else if (!selectedSemesters.firstSem && selectedSemesters.secondSem) {
				semesterPayload = "2ND";
			}

			const payload = {
				semester: semesterPayload,
				yearLevel: profile.yearLevel,
				program: profile.program,
				majorId: profile.majorId ? Number.parseInt(profile.majorId) : null,
				...(semesterPayload === "1ST" && { grades: grades1st }),
				...(semesterPayload === "2ND" && { grades: grades2nd }),
				...(semesterPayload === "BOTH" && {
					grades_1st: grades1st,
					grades_2nd: grades2nd,
				}),
			};

			const createdApps = await submitApplication(payload);
			if (!createdApps || createdApps.length === 0) {
				throw new Error("Failed to create application records in the database.");
			}

			// Map application IDs by semester
			const app1st = createdApps.find((a) => a.semester === "1ST");
			const app2nd = createdApps.find((a) => a.semester === "2ND");
			const primaryAppId = app1st?.id || app2nd?.id;

			if (!primaryAppId) {
				throw new Error("Application record mapping failed.");
			}

			// 2. Upload COR
			setSubmissionStatusText("Uploading Certificate of Registration (COR)...");
			const corSize = Math.round(files.COR.size / 1024);
			const corPresign = await presignDocument({
				applicationId: primaryAppId,
				docType: "COR",
				fileName: files.COR.name,
			});
			await uploadToR2(corPresign.url, files.COR);
			await linkDocument({
				applicationId: primaryAppId,
				docType: "COR",
				objectKey: corPresign.objectKey,
				fileSizeKb: corSize,
			});
			if (semesterPayload === "BOTH" && app2nd) {
				// Link COR to 2nd semester app record too
				await linkDocument({
					applicationId: app2nd.id,
					docType: "COR",
					objectKey: corPresign.objectKey,
					fileSizeKb: corSize,
				});
			}

			// 3. Upload GMC
			setSubmissionStatusText("Uploading Good Moral Certificate (GMC)...");
			const gmcSize = Math.round(files.GMC.size / 1024);
			const gmcPresign = await presignDocument({
				applicationId: primaryAppId,
				docType: "GMC",
				fileName: files.GMC.name,
			});
			await uploadToR2(gmcPresign.url, files.GMC);
			await linkDocument({
				applicationId: primaryAppId,
				docType: "GMC",
				objectKey: gmcPresign.objectKey,
				fileSizeKb: gmcSize,
			});
			if (semesterPayload === "BOTH" && app2nd) {
				// Link GMC to 2nd semester app record too
				await linkDocument({
					applicationId: app2nd.id,
					docType: "GMC",
					objectKey: gmcPresign.objectKey,
					fileSizeKb: gmcSize,
				});
			}

			// 4. Upload COG 1st
			if (selectedSemesters.firstSem && app1st && files.COG_1ST) {
				setSubmissionStatusText("Uploading 1st Semester Certificate of Grades...");
				const cog1Size = Math.round(files.COG_1ST.size / 1024);
				const cog1Presign = await presignDocument({
					applicationId: app1st.id,
					docType: "COG_1ST",
					fileName: files.COG_1ST.name,
				});
				await uploadToR2(cog1Presign.url, files.COG_1ST);
				await linkDocument({
					applicationId: app1st.id,
					docType: "COG_1ST",
					objectKey: cog1Presign.objectKey,
					fileSizeKb: cog1Size,
				});
			}

			// 5. Upload COG 2nd
			if (selectedSemesters.secondSem && app2nd && files.COG_2ND) {
				setSubmissionStatusText("Uploading 2nd Semester Certificate of Grades...");
				const cog2Size = Math.round(files.COG_2ND.size / 1024);
				const cog2Presign = await presignDocument({
					applicationId: app2nd.id,
					docType: "COG_2ND",
					fileName: files.COG_2ND.name,
				});
				await uploadToR2(cog2Presign.url, files.COG_2ND);
				await linkDocument({
					applicationId: app2nd.id,
					docType: "COG_2ND",
					objectKey: cog2Presign.objectKey,
					fileSizeKb: cog2Size,
				});
			}

			toast.success("Application submitted successfully!");
			
			// Refresh applications list
			const refreshRes = await getMyApplications();
			setApplications(refreshRes.applications);
			setStep(5);
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Failed to submit application.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitting) {
		return <LoadingFallback label={submissionStatusText} />;
	}

	return (
		<div className="min-h-screen bg-brand-background flex flex-col items-center p-6">
			<div className="w-full max-w-[708px] flex flex-col gap-6 items-center">
				{/* Top Header Branding & User details */}
				<PortalHeader user={user} />

				{/* Step Progress indicators */}
				<PortalStepsBar currentStep={step} />

				{/* Active Step Content */}
				<main className="w-full bg-white border border-brand-border rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col justify-start">
					{step === 1 && (
						<PortalProfileStep
							defaultValues={profile}
							onSubmit={handleProfileSubmit}
							schoolYear={schoolYear}
						/>
					)}

					{step === 2 && (
						<PortalSemestersStep
							selectedSemesters={selectedSemesters}
							onChange={setSelectedSemesters}
							onBack={handleBack}
							onContinue={handleSemestersContinue}
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
							onBack={handleBack}
							onContinue={handleGradesContinue}
							gwaThreshold={gwaThreshold}
						/>
					)}

					{step === 4 && (
						<PortalDocumentsStep
							selectedSemesters={selectedSemesters}
							files={files}
							onChange={setFiles}
							onBack={handleBack}
							onSubmit={handleApplicationSubmit}
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
