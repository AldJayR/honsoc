import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	FileUpload,
	FileUploadItem,
	FileUploadItemMetadata,
	FileUploadList,
	FileUploadTrigger,
} from "~/components/ui/file-upload";

interface DocType {
	COR?: File;
	COG_1ST?: File;
	COG_2ND?: File;
	GMC?: File;
}

interface PortalDocumentsStepProps {
	selectedSemesters: { firstSem: boolean; secondSem: boolean };
	files: DocType;
	onChange: (files: DocType) => void;
	onBack: () => void;
	onSubmit: () => void;
	isPending: boolean;
	schoolYear: string;
}

function computeYear(schoolYear: string, offset = 0) {
	if (!schoolYear) return offset === 0 ? "2026 - 2027" : "2025 - 2026";
	const parts = schoolYear.split("-").map((p) => Number.parseInt(p.trim(), 10));
	return `${parts[0] + offset} - ${parts[1] + offset}`;
}

export function PortalDocumentsStep({
	selectedSemesters,
	files,
	onChange,
	onBack,
	onSubmit,
	isPending,
	schoolYear,
}: PortalDocumentsStepProps) {
	const hasFile = (type: keyof DocType) => !!files[type];

	const handleSelect = (type: keyof DocType) => (accepted: File[]) => {
		if (accepted[0]) onChange({ ...files, [type]: accepted[0] });
	};

	const isSubmitDisabled =
		!files.COR ||
		!files.GMC ||
		(selectedSemesters.firstSem && !files.COG_1ST) ||
		(selectedSemesters.secondSem && !files.COG_2ND);

	const cardClass = (has: boolean) =>
		`rounded-2xl p-4 flex flex-col items-start gap-2 w-full text-left transition-all duration-200 ${
			has
				? "bg-green-500/10 border border-green-500 shadow-sm"
				: "border-2 border-dashed border-border hover:border-muted-foreground"
		}`;

	const placeholderClass =
		"type-caption text-muted-foreground select-none pointer-events-none";

	return (
		<div className="flex flex-col items-start w-full gap-6 animate-fade-in">
			<p className="select-none type-body-small text-muted-foreground">
				Upload sealed scans for each required document. All uploads must be
				clearly legible – blurry or cropped scans will be flagged during admin
				review.
			</p>

			<div className="grid w-full grid-cols-1 gap-4 select-none md:grid-cols-2">
				{/* COR */}
				<FileUpload
					value={files.COR ? [files.COR] : []}
					onValueChange={(f) => onChange({ ...files, COR: f[0] })}
					accept=".pdf,.png,.jpg,.jpeg"
					maxFiles={1}
					maxSize={5 * 1024 * 1024}
					className="w-full"
				>
					<FileUploadTrigger className={cardClass(hasFile("COR"))}>
						{hasFile("COR") ? (
							<FileUploadList orientation="horizontal">
								<FileUploadItem
									value={files.COR!}
									className="p-0 bg-transparent border-0"
								>
									<FileUploadItemMetadata />
								</FileUploadItem>
							</FileUploadList>
						) : (
							<span className={placeholderClass}>
								Certificate of Registration (COR) – click to browse
							</span>
						)}
					</FileUploadTrigger>
				</FileUpload>

				{/* COG 1st */}
				{selectedSemesters.firstSem ? (
					<FileUpload
						value={files.COG_1ST ? [files.COG_1ST] : []}
						onValueChange={(f) => onChange({ ...files, COG_1ST: f[0] })}
						accept=".pdf,.png,.jpg,.jpeg"
						maxFiles={1}
						maxSize={5 * 1024 * 1024}
						className="w-full"
					>
						<FileUploadTrigger className={cardClass(hasFile("COG_1ST"))}>
							{hasFile("COG_1ST") ? (
								<FileUploadList orientation="horizontal">
									<FileUploadItem
										value={files.COG_1ST!}
										className="p-0 bg-transparent border-0"
									>
										<FileUploadItemMetadata />
									</FileUploadItem>
								</FileUploadList>
							) : (
								<span className={placeholderClass}>
									Certificate of Grades – 1st Sem A.Y.{" "}
									{computeYear(schoolYear, -1)}
								</span>
							)}
						</FileUploadTrigger>
					</FileUpload>
				) : null}

				{/* COG 2nd */}
				{selectedSemesters.secondSem ? (
					<FileUpload
						value={files.COG_2ND ? [files.COG_2ND] : []}
						onValueChange={(f) => onChange({ ...files, COG_2ND: f[0] })}
						accept=".pdf,.png,.jpg,.jpeg"
						maxFiles={1}
						maxSize={5 * 1024 * 1024}
						className="w-full"
					>
						<FileUploadTrigger className={cardClass(hasFile("COG_2ND"))}>
							{hasFile("COG_2ND") ? (
								<FileUploadList orientation="horizontal">
									<FileUploadItem
										value={files.COG_2ND!}
										className="p-0 bg-transparent border-0"
									>
										<FileUploadItemMetadata />
									</FileUploadItem>
								</FileUploadList>
							) : (
								<span className={placeholderClass}>
									Certificate of Grades – 2nd Sem A.Y.{" "}
									{computeYear(schoolYear, -1)}
								</span>
							)}
						</FileUploadTrigger>
					</FileUpload>
				) : null}

				{/* GMC */}
				<FileUpload
					value={files.GMC ? [files.GMC] : []}
					onValueChange={(f) => onChange({ ...files, GMC: f[0] })}
					accept=".pdf,.png,.jpg,.jpeg"
					maxFiles={1}
					maxSize={5 * 1024 * 1024}
					className="w-full"
				>
					<FileUploadTrigger className={cardClass(hasFile("GMC"))}>
						{hasFile("GMC") ? (
							<FileUploadList orientation="horizontal">
								<FileUploadItem
									value={files.GMC!}
									className="p-0 bg-transparent border-0"
								>
									<FileUploadItemMetadata />
								</FileUploadItem>
							</FileUploadList>
						) : (
							<span className={placeholderClass}>
								Certificate of Good Moral – click to browse
							</span>
						)}
					</FileUploadTrigger>
				</FileUpload>
			</div>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-end w-full gap-3 mt-4 select-none">
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					disabled={isPending}
				>
					<ArrowLeft />
					Back
				</Button>
				<Button
					type="button"
					onClick={onSubmit}
					disabled={isSubmitDisabled || isPending}
				>
					{isPending ? "Submitting..." : "Submit Application"}
					<ArrowRight />
				</Button>
			</div>
		</div>
	);
}
