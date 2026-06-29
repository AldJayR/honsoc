import { useRef } from "react";
import { Upload, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface PortalDocumentsStepProps {
	selectedSemesters: {
		firstSem: boolean;
		secondSem: boolean;
	};
	files: {
		COR?: File;
		COG_1ST?: File;
		COG_2ND?: File;
		GMC?: File;
	};
	onChange: (files: {
		COR?: File;
		COG_1ST?: File;
		COG_2ND?: File;
		GMC?: File;
	}) => void;
	onBack: () => void;
	onSubmit: () => void;
	isPending: boolean;
	schoolYear: string;
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
	// Refs for file inputs
	const corInputRef = useRef<HTMLInputElement>(null);
	const cog1InputRef = useRef<HTMLInputElement>(null);
	const cog2InputRef = useRef<HTMLInputElement>(null);
	const gmcInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (
		type: "COR" | "COG_1ST" | "COG_2ND" | "GMC",
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Limit size to 5MB
		if (file.size > 5 * 1024 * 1024) {
			alert("File size exceeds 5MB limit.");
			return;
		}

		onChange({
			...files,
			[type]: file,
		});
	};

	const corYear = schoolYear || "2026 - 2027";
	// For grade documents, it is grades for previous semesters.
	// E.g. if applying for 2026-2027, the grades are from 2025-2026.
	const grades1stYear = schoolYear
		? `${Number.parseInt(schoolYear.split("-")[0]) - 1} - ${Number.parseInt(schoolYear.split("-")[1]) - 1}`
		: "2025 - 2026";
	const grades2ndYear = grades1stYear;

	const isSubmitDisabled =
		!files.COR ||
		!files.GMC ||
		(selectedSemesters.firstSem && !files.COG_1ST) ||
		(selectedSemesters.secondSem && !files.COG_2ND);

	return (
		<div className="flex flex-col gap-6 items-start w-full animate-fade-in">
			<p className="font-sans font-normal text-sm leading-5 text-brand-muted select-none">
				Upload sealed scans for each required document. All uploads must be clearly legible – blurry or cropped scans will be flagged during admin review.
			</p>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full select-none">
				{/* COR Card */}
				<div
					onClick={() => corInputRef.current?.click()}
					className={`border rounded-2xl p-4 flex flex-col items-start gap-2 cursor-pointer transition-all duration-200 ${
						files.COR
							? "bg-green-50/30 border-green-500 shadow-sm"
							: "bg-white border-brand-border border-dashed hover:border-brand-muted shadow-sm"
					}`}
				>
					<input
						type="file"
						ref={corInputRef}
						onChange={(e) => handleFileSelect("COR", e)}
						className="hidden"
						accept=".pdf,.png,.jpg,.jpeg"
					/>
					<div className="flex justify-between items-center w-full">
						<span className="font-sans font-semibold text-xs text-black">
							Certificate of Registration (COR) - A.Y. {corYear}
						</span>
						{files.COR && <FileText className="size-4 text-green-600" />}
					</div>
					<span className="font-sans font-normal text-xs text-brand-muted truncate max-w-full">
						{files.COR ? files.COR.name : "Drag & drop or click to browse"}
					</span>
					<span className="font-sans font-normal text-[10px] text-brand-muted">
						Max size: 5MB (PDF, PNG, JPG)
					</span>
				</div>

				{/* COG 1st Sem Card */}
				{selectedSemesters.firstSem && (
					<div
						onClick={() => {
							cog1InputRef.current?.click();
						}}
						className={`border rounded-2xl p-4 flex flex-col items-start gap-2 cursor-pointer transition-all duration-200 ${
							files.COG_1ST
								? "bg-green-50/30 border-green-500 shadow-sm"
								: "bg-white border-brand-border border-dashed hover:border-brand-muted shadow-sm"
						}`}
					>
						<input
							type="file"
							ref={cog1InputRef}
							onChange={(e) => handleFileSelect("COG_1ST", e)}
							className="hidden"
							accept=".pdf,.png,.jpg,.jpeg"
						/>
						<div className="flex justify-between items-center w-full">
							<span className="font-sans font-semibold text-xs text-black">
								Certificate of Grades - 1st Semester A.Y. {grades1stYear}
							</span>
							{files.COG_1ST && <FileText className="size-4 text-green-600" />}
						</div>
						<span className="font-sans font-normal text-xs text-brand-muted truncate max-w-full">
							{files.COG_1ST
								? files.COG_1ST.name
								: "Drag & drop or click to browse"}
						</span>
						<span className="font-sans font-normal text-[10px] text-brand-muted">
							Max size: 5MB (PDF, PNG, JPG)
						</span>
					</div>
				)}

				{/* COG 2nd Sem Card */}
				{selectedSemesters.secondSem && (
					<div
						onClick={() => {
							cog2InputRef.current?.click();
						}}
						className={`border rounded-2xl p-4 flex flex-col items-start gap-2 cursor-pointer transition-all duration-200 ${
							files.COG_2ND
								? "bg-green-50/30 border-green-500 shadow-sm"
								: "bg-white border-brand-border border-dashed hover:border-brand-muted shadow-sm"
						}`}
					>
						<input
							type="file"
							ref={cog2InputRef}
							onChange={(e) => handleFileSelect("COG_2ND", e)}
							className="hidden"
							accept=".pdf,.png,.jpg,.jpeg"
						/>
						<div className="flex justify-between items-center w-full">
							<span className="font-sans font-semibold text-xs text-black">
								Certificate of Grades - 2nd Semester A.Y. {grades2ndYear}
							</span>
							{files.COG_2ND && <FileText className="size-4 text-green-600" />}
						</div>
						<span className="font-sans font-normal text-xs text-brand-muted truncate max-w-full">
							{files.COG_2ND
								? files.COG_2ND.name
								: "Drag & drop or click to browse"}
						</span>
						<span className="font-sans font-normal text-[10px] text-brand-muted">
							Max size: 5MB (PDF, PNG, JPG)
						</span>
					</div>
				)}

				{/* GMC Card */}
				<div
					onClick={() => {
						gmcInputRef.current?.click();
					}}
					className={`border rounded-2xl p-4 flex flex-col items-start gap-2 cursor-pointer transition-all duration-200 ${
						files.GMC
							? "bg-green-50/30 border-green-500 shadow-sm"
							: "bg-white border-brand-border border-dashed hover:border-brand-muted shadow-sm"
					}`}
				>
					<input
						type="file"
						ref={gmcInputRef}
						onChange={(e) => handleFileSelect("GMC", e)}
						className="hidden"
						accept=".pdf,.png,.jpg,.jpeg"
					/>
					<div className="flex justify-between items-center w-full">
						<span className="font-sans font-semibold text-xs text-black">
							Certificate of Good Moral
						</span>
						{files.GMC && <FileText className="size-4 text-green-600" />}
					</div>
					<span className="font-sans font-normal text-xs text-brand-muted truncate max-w-full">
						{files.GMC ? files.GMC.name : "Drag & drop or click to browse"}
					</span>
					<span className="font-sans font-normal text-[10px] text-brand-muted">
						Max size: 5MB (PDF, PNG, JPG)
					</span>
				</div>
			</div>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-end gap-3 w-full mt-4 select-none">
				<Button
					type="button"
					onClick={onBack}
					disabled={isPending}
					className="bg-white border border-brand-primary text-brand-primary hover:bg-brand-primary-light/5 font-medium text-sm h-8 px-4 rounded-lg flex gap-1.5 items-center justify-center shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
				>
					<ArrowLeft className="size-4 shrink-0 text-brand-primary" />
					Back
				</Button>
				<Button
					type="button"
					onClick={onSubmit}
					disabled={isSubmitDisabled || isPending}
					className="bg-brand-primary-dark hover:bg-brand-primary text-primary-foreground font-medium text-sm h-8 px-4 rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPending ? "Submitting..." : "Submit Application"}
					<ArrowRight className="size-4 shrink-0" />
				</Button>
			</div>
		</div>
	);
}
