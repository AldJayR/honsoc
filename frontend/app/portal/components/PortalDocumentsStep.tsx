import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	FileUpload,
	FileUploadItem,
	FileUploadItemMetadata,
	FileUploadList,
	FileUploadTrigger,
} from "~/components/ui/file-upload";
import { computeSchoolYearOffset } from "~/lib/format";

interface DocType {
	COR?: File;
	COG_1ST?: File;
	COG_2ND?: File;
	GMC?: File;
}

interface FileMeta {
	name: string;
	size: number;
	type: string;
}

interface PortalDocumentsStepProps {
	selectedSemesters: { firstSem: boolean; secondSem: boolean };
	files: DocType;
	onChange: (files: DocType) => void;
	onBack: () => void;
	onSubmit: () => void;
	isPending: boolean;
	schoolYear: string;
	fileMetadata?: {
		COR?: FileMeta | null;
		COG_1ST?: FileMeta | null;
		COG_2ND?: FileMeta | null;
		GMC?: FileMeta | null;
	} | null;
}

// computeSchoolYearOffset imported from ~/lib/format

export function PortalDocumentsStep({
	selectedSemesters,
	files,
	onChange,
	onBack,
	onSubmit,
	isPending,
	schoolYear,
	fileMetadata,
}: PortalDocumentsStepProps) {
	const hasFile = (type: keyof DocType) => !!files[type];

	const hasMeta = (type: keyof DocType) =>
		!!fileMetadata?.[type] && !files[type];

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

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
							<FileUploadList orientation="horizontal" className="w-full min-w-0">
								<FileUploadItem
									value={files.COR!}
									className="p-0 bg-transparent border-0 w-full min-w-0"
								>
									<FileUploadItemMetadata />
								</FileUploadItem>
							</FileUploadList>
						) : hasMeta("COR") ? (
							<div className="flex flex-col gap-1 w-full text-left">
								<span className="text-sm font-semibold text-foreground">
									Certificate of Registration (COR) - AY {computeSchoolYearOffset(schoolYear).replace(/\s*-\s*/, "–")}
								</span>
								<span className="text-xs text-muted-foreground">
									Previous file: {fileMetadata?.COR?.name} ({formatSize(fileMetadata?.COR?.size ?? 0)})
								</span>
								<span className="text-xs text-muted-foreground">
									Click or drag to re-upload
								</span>
							</div>
						) : (
							<div className="flex flex-col gap-1 w-full text-left">
								<span className="text-sm font-semibold text-foreground">
									Certificate of Registration (COR) - AY {computeSchoolYearOffset(schoolYear).replace(/\s*-\s*/, "–")}
								</span>
								<span className="text-xs text-muted-foreground">
									Drag & drop or click to browse
								</span>
								<span className="text-[10px] text-muted-foreground/80">
									Max size: 5MB (PDF, PNG, JPG)
								</span>
							</div>
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
								<FileUploadList orientation="horizontal" className="w-full min-w-0">
									<FileUploadItem
										value={files.COG_1ST!}
										className="p-0 bg-transparent border-0 w-full min-w-0"
									>
										<FileUploadItemMetadata />
									</FileUploadItem>
								</FileUploadList>
							) : hasMeta("COG_1ST") ? (
								<div className="flex flex-col gap-1 w-full text-left">
									<span className="text-sm font-semibold text-foreground">
										Certificate of Grades - 1st Sem AY {computeSchoolYearOffset(schoolYear, -1).replace(/\s*-\s*/, "–")}
									</span>
									<span className="text-xs text-muted-foreground">
										Previous file: {fileMetadata?.COG_1ST?.name} ({formatSize(fileMetadata?.COG_1ST?.size ?? 0)})
									</span>
									<span className="text-xs text-muted-foreground">
										Click or drag to re-upload
									</span>
								</div>
							) : (
								<div className="flex flex-col gap-1 w-full text-left">
									<span className="text-sm font-semibold text-foreground">
										Certificate of Grades - 1st Sem AY {computeSchoolYearOffset(schoolYear, -1).replace(/\s*-\s*/, "–")}
									</span>
									<span className="text-xs text-muted-foreground">
										Drag & drop or click to browse
									</span>
									<span className="text-[10px] text-muted-foreground/80">
										Max size: 5MB (PDF, PNG, JPG)
									</span>
								</div>
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
								<FileUploadList orientation="horizontal" className="w-full min-w-0">
									<FileUploadItem
										value={files.COG_2ND!}
										className="p-0 bg-transparent border-0 w-full min-w-0"
									>
										<FileUploadItemMetadata />
									</FileUploadItem>
								</FileUploadList>
							) : hasMeta("COG_2ND") ? (
								<div className="flex flex-col gap-1 w-full text-left">
									<span className="text-sm font-semibold text-foreground">
										Certificate of Grades - 2nd Sem AY {computeSchoolYearOffset(schoolYear, -1).replace(/\s*-\s*/, "–")}
									</span>
									<span className="text-xs text-muted-foreground">
										Previous file: {fileMetadata?.COG_2ND?.name} ({formatSize(fileMetadata?.COG_2ND?.size ?? 0)})
									</span>
									<span className="text-xs text-muted-foreground">
										Click or drag to re-upload
									</span>
								</div>
							) : (
								<div className="flex flex-col gap-1 w-full text-left">
									<span className="text-sm font-semibold text-foreground">
										Certificate of Grades - 2nd Sem AY {computeSchoolYearOffset(schoolYear, -1).replace(/\s*-\s*/, "–")}
									</span>
									<span className="text-xs text-muted-foreground">
										Drag & drop or click to browse
									</span>
									<span className="text-[10px] text-muted-foreground/80">
										Max size: 5MB (PDF, PNG, JPG)
									</span>
								</div>
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
							<FileUploadList orientation="horizontal" className="w-full min-w-0">
								<FileUploadItem
									value={files.GMC!}
									className="p-0 bg-transparent border-0 w-full min-w-0"
								>
									<FileUploadItemMetadata />
								</FileUploadItem>
							</FileUploadList>
						) : hasMeta("GMC") ? (
							<div className="flex flex-col gap-1 w-full text-left">
								<span className="text-sm font-semibold text-foreground">
									Certificate of Good Moral
								</span>
								<span className="text-xs text-muted-foreground">
									Previous file: {fileMetadata?.GMC?.name} ({formatSize(fileMetadata?.GMC?.size ?? 0)})
								</span>
								<span className="text-xs text-muted-foreground">
									Click or drag to re-upload
								</span>
							</div>
						) : (
							<div className="flex flex-col gap-1 w-full text-left">
								<span className="text-sm font-semibold text-foreground">
									Certificate of Good Moral
								</span>
								<span className="text-xs text-muted-foreground">
									Drag & drop or click to browse
								</span>
								<span className="text-[10px] text-muted-foreground/80">
									Max size: 5MB (PDF, PNG, JPG)
								</span>
							</div>
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
