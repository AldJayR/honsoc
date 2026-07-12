import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { queryClient } from "@/lib/query";
import type { ProfileFormValues } from "@/shared/lib/schemas/portal";
import type {
	ApplicationResponseItem,
	ApplicationStatusItem,
	GradeInput,
} from "@/shared/services/auth.api";
import {
	getMyApplications,
	linkDocument,
	presignDocument,
	submitApplication,
	uploadToR2,
} from "@/shared/services/auth.api";

type DocType = "COR" | "COG_1ST" | "COG_2ND" | "GMC";

interface UseApplicationSubmitArgs {
	profile: ProfileFormValues;
	selectedSemesters: { firstSem: boolean; secondSem: boolean };
	grades1st: GradeInput[];
	grades2nd: GradeInput[];
	files: { COR?: File; COG_1ST?: File; COG_2ND?: File; GMC?: File };
	onApplicationsChange: (apps: ApplicationStatusItem[]) => void;
	onStepChange: (step: number) => void;
}

function deriveSemester(selectedSemesters: {
	firstSem: boolean;
	secondSem: boolean;
}): "1ST" | "2ND" | "BOTH" {
	if (selectedSemesters.firstSem && !selectedSemesters.secondSem) return "1ST";
	if (!selectedSemesters.firstSem && selectedSemesters.secondSem) return "2ND";
	return "BOTH";
}

async function uploadDocument(
	docType: DocType,
	file: File,
	appId: string,
	secondaryAppId?: string,
) {
	const sizeKb = Math.round(file.size / 1024);
	const presign = await presignDocument({
		applicationId: appId,
		docType,
		fileName: file.name,
	});
	await uploadToR2(presign.url, file);
	await linkDocument({
		applicationId: appId,
		docType,
		objectKey: presign.objectKey,
		fileSizeKb: sizeKb,
	});
	if (secondaryAppId) {
		await linkDocument({
			applicationId: secondaryAppId,
			docType,
			objectKey: presign.objectKey,
			fileSizeKb: sizeKb,
		});
	}
}

export function useApplicationSubmit({
	profile,
	selectedSemesters,
	grades1st,
	grades2nd,
	files,
	onApplicationsChange,
	onStepChange,
}: UseApplicationSubmitArgs) {
	const [isPending, startTransition] = useTransition();
	const [statusText, setStatusText] = useState("");

	const submit = useCallback(() => {
		if (
			!files.COR ||
			!files.GMC ||
			(selectedSemesters.firstSem && !files.COG_1ST) ||
			(selectedSemesters.secondSem && !files.COG_2ND)
		) {
			toast.error("Please select all required documents first.");
			return;
		}

		startTransition(async () => {
			setStatusText("Creating application records...");

			try {
				const semester = deriveSemester(selectedSemesters);
				const payload = {
					semester,
					yearLevel: profile.yearLevel,
					program: profile.program,
					majorId: profile.majorId ? Number.parseInt(profile.majorId, 10) : null,
					...(semester === "1ST" && { grades: grades1st }),
					...(semester === "2ND" && { grades: grades2nd }),
					...(semester === "BOTH" && {
						grades_1st: grades1st,
						grades_2nd: grades2nd,
					}),
				};

				const createdApps = await submitApplication(payload);
				if (!createdApps || createdApps.length === 0) {
					throw new Error(
						"Failed to create application records in the database.",
					);
				}

				const app1st = createdApps.find(
					(a: ApplicationResponseItem) => a.semester === "1ST",
				);
				const app2nd = createdApps.find(
					(a: ApplicationResponseItem) => a.semester === "2ND",
				);
				const primaryAppId = app1st?.id || app2nd?.id;
				if (!primaryAppId) {
					throw new Error("Application record mapping failed.");
				}

				const secondaryAppId =
					semester === "BOTH" && app2nd ? app2nd.id : undefined;

				setStatusText("Uploading Certificate of Registration (COR)...");
				await uploadDocument("COR", files.COR!, primaryAppId, secondaryAppId);

				setStatusText("Uploading Good Moral Certificate (GMC)...");
				await uploadDocument("GMC", files.GMC!, primaryAppId, secondaryAppId);

				if (selectedSemesters.firstSem && app1st && files.COG_1ST) {
					setStatusText("Uploading 1st Semester Certificate of Grades...");
					await uploadDocument("COG_1ST", files.COG_1ST, app1st.id);
				}

				if (selectedSemesters.secondSem && app2nd && files.COG_2ND) {
					setStatusText("Uploading 2nd Semester Certificate of Grades...");
					await uploadDocument("COG_2ND", files.COG_2ND, app2nd.id);
				}

				toast.success("Application submitted successfully!");
				await queryClient.invalidateQueries({ queryKey: ["applications"] });
				const refresh = await queryClient.fetchQuery({
					queryKey: ["applications"],
					queryFn: async () => {
						const res = await getMyApplications();
						return res.applications;
					},
				});
				onApplicationsChange(refresh);
				onStepChange(5);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to submit application.";
				toast.error(message);
			}
		});
	}, [
		profile,
		selectedSemesters,
		grades1st,
		grades2nd,
		files,
		onApplicationsChange,
		onStepChange,
	]);

	return { submit, isSubmitting: isPending, statusText };
}

