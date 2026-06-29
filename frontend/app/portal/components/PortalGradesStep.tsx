import {
	AlertTriangle,
	Plus,
	Trash2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { INPUT_CLASS } from "~/shared/lib/constants";
import type { GradeInput } from "~/shared/services/auth.api";
import { StepNavigation } from "~/portal/components/StepNavigation";

interface PortalGradesStepProps {
	selectedSemesters: {
		firstSem: boolean;
		secondSem: boolean;
	};
	grades1st: GradeInput[];
	onChange1st: (grades: GradeInput[]) => void;
	grades2nd: GradeInput[];
	onChange2nd: (grades: GradeInput[]) => void;
	onBack: () => void;
	onContinue: () => void;
	gwaThreshold: number;
}

const validGrades = ["1.0", "1.25", "1.50", "1.75", "2.00", "5.0", "INC"];

export function PortalGradesStep({
	selectedSemesters,
	grades1st,
	onChange1st,
	grades2nd,
	onChange2nd,
	onBack,
	onContinue,
	gwaThreshold = 1.75,
}: PortalGradesStepProps) {
	const gradeKeyCounter = useRef(0);
	const nextGradeKey = () => `grade_${gradeKeyCounter.current++}`;
	// Set initial active tab
	const initialTab = selectedSemesters.firstSem ? "1st" : "2nd";
	const [activeTab, setActiveTab] = useState<"1st" | "2nd">(initialTab);

	// Form input states
	const [subjectCode, setSubjectCode] = useState("");
	const [subjectName, setSubjectName] = useState("");
	const [units, setUnits] = useState("");
	const [grade, setGrade] = useState("1.0");

	const activeGrades = activeTab === "1st" ? grades1st : grades2nd;
	const setActiveGrades = activeTab === "1st" ? onChange1st : onChange2nd;

	// Calculate per-semester GWA
	const calculateGWA = (grades: GradeInput[]) => {
		let totalPoints = 0;
		let totalUnits = 0;

		for (const g of grades) {
			const gradeNum = Number.parseFloat(g.grade);
			// Exclude non-numeric grades from average calculation
			if (!Number.isNaN(gradeNum) && g.grade !== "INC" && g.grade !== "5.0") {
				totalPoints += gradeNum * g.units;
				totalUnits += g.units;
			}
		}

		if (totalUnits === 0) return 0;
		return Math.round((totalPoints / totalUnits) * 100) / 100;
	};

	const gwa1st = calculateGWA(grades1st);
	const gwa2nd = calculateGWA(grades2nd);

	// Check for disqualifiers
	const hasDisqualifyingGrade = (grades: GradeInput[]) => {
		return grades.some((g) => g.grade === "5.0" || g.grade === "INC");
	};

	const isDisqualifiedByGWA = (gwa: number) => {
		// lower numeric value = higher grade. GWA > threshold means worse grade (e.g. 1.8 > 1.75 is worse)
		return gwa > 0 && gwa > gwaThreshold;
	};

	const is1stDisqualified =
		hasDisqualifyingGrade(grades1st) || isDisqualifiedByGWA(gwa1st);
	const is2ndDisqualified =
		hasDisqualifyingGrade(grades2nd) || isDisqualifiedByGWA(gwa2nd);

	const handleAddGrade = (e: React.FormEvent) => {
		e.preventDefault();
		if (!subjectCode.trim()) return;
		const unitsNum = Number.parseInt(units, 10);
		if (Number.isNaN(unitsNum) || unitsNum < 1 || unitsNum > 6) return;

		const newGrade: GradeInput = {
			subjectCode: subjectCode.toUpperCase().trim(),
			subjectName: subjectName.trim() || subjectCode.toUpperCase().trim(),
			units: unitsNum,
			grade,
			_key: nextGradeKey(),
		};

		setActiveGrades([...activeGrades, newGrade]);
		setSubjectCode("");
		setSubjectName("");
		setUnits("");
		setGrade("1.0");
	};

	const handleDeleteGrade = (key: string) => {
		setActiveGrades(activeGrades.filter((g) => g._key !== key));
	};

	return (
		<div className="flex flex-col gap-6 items-start w-full animate-fade-in">
			<p className="font-sans font-normal text-sm leading-5 text-brand-muted select-none">
				Enter each subject from your COG exactly as printed. GWA is computed
				automatically. Entering an INC or 5.0 will trigger a disqualifier
				warning.
			</p>

			{/* GWA Summary Panel */}
			<div className="bg-card border border-brand-border flex items-center justify-between p-4 rounded-2xl w-full shadow-sm">
				{/* 1st Sem GWA */}
				{selectedSemesters.firstSem && (
					<div className="flex-1 flex flex-col items-center justify-center text-center">
						<span className="text-sm font-normal text-brand-muted">
							1st sem GWA
						</span>
						<span className="font-semibold text-2xl text-amber-600 mt-1 select-none">
							{gwa1st > 0 ? gwa1st.toFixed(2) : "0.00"}
						</span>
					</div>
				)}

				{/* Divider */}
				{selectedSemesters.firstSem && selectedSemesters.secondSem && (
					<div className="h-12 w-[1px] bg-brand-border mx-4" />
				)}

				{/* 2nd Sem GWA */}
				{selectedSemesters.secondSem && (
					<div className="flex-1 flex flex-col items-center justify-center text-center">
						<span className="text-sm font-normal text-brand-muted">
							2nd sem GWA
						</span>
						<span className="font-semibold text-2xl text-amber-600 mt-1 select-none">
							{gwa2nd > 0 ? gwa2nd.toFixed(2) : "0.00"}
						</span>
					</div>
				)}
			</div>

			{/* Disqualification Banners */}
			{((activeTab === "1st" && is1stDisqualified) ||
				(activeTab === "2nd" && is2ndDisqualified)) && (
				<div className="w-full bg-red-500/10 border border-red-200 rounded-xl p-3 flex gap-2 items-start text-red-700 animate-pulse-subtle">
					<AlertTriangle className="size-5 shrink-0 text-red-500 mt-0.5" />
					<div className="flex flex-col text-xs leading-normal">
						<span className="font-semibold">
							Disqualifier Warning Triggered
						</span>
						<span>
							{hasDisqualifyingGrade(activeGrades)
								? "Your grades include a 5.0 or INC, which makes you ineligible for membership."
								: `Your computed GWA (${(activeTab === "1st" ? gwa1st : gwa2nd).toFixed(2)}) is lower than the configured threshold of ${gwaThreshold.toFixed(2)}.`}
						</span>
						<span className="mt-1 text-[10px] text-red-500 font-medium">
							Note: You can still submit this application for administrative
							review.
						</span>
					</div>
				</div>
			)}

			{/* Semester Tab Toggles */}
			{selectedSemesters.firstSem && selectedSemesters.secondSem && (
				<div className="flex bg-muted p-0.5 rounded-lg shrink-0">
					<button
						type="button"
						onClick={() => setActiveTab("1st")}
						className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all select-none cursor-pointer ${
							activeTab === "1st"
								? "bg-card text-foreground shadow-sm"
								: "text-brand-muted hover:text-foreground"
						}`}
					>
						1st semester
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("2nd")}
						className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all select-none cursor-pointer ${
							activeTab === "2nd"
								? "bg-card text-foreground shadow-sm"
								: "text-brand-muted hover:text-foreground"
						}`}
					>
						2nd semester
					</button>
				</div>
			)}

			{/* Table of Grades */}
			<div className="flex flex-col items-start w-full border border-brand-border rounded-xl bg-card overflow-hidden">
				{/* Table Header */}
				<div className="flex justify-between items-center w-full bg-muted/30 border-b border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted uppercase tracking-wider">
					<div className="w-[300px]">Subject</div>
					<div className="flex-1 text-center">Unit</div>
					<div className="flex-1 text-center">Grade</div>
					<div className="w-10"></div>
				</div>

				{/* Table Rows */}
				{activeGrades.length === 0 ? (
					<div className="flex items-center justify-center p-8 w-full text-sm text-brand-muted">
						No grades added yet. Enter a subject below to start.
					</div>
				) : (
					activeGrades.map((g) => (
						<div
							key={g._key ?? `${g.subjectCode}-${Math.random()}`}
							className="flex justify-between items-center w-full border-b border-brand-border last:border-0 px-4 py-2 text-sm text-foreground hover:bg-muted/10 transition-colors"
						>
							<div className="w-[300px] font-medium">{g.subjectCode}</div>
							<div className="flex-1 text-center">{g.units}</div>
							<div className="flex-1 text-center font-semibold text-brand-primary-dark">
								{g.grade}
							</div>
							<div className="w-10 flex justify-end">
								<button
									type="button"
									onClick={() => g._key && handleDeleteGrade(g._key)}
									className="text-brand-muted hover:text-red-500 transition-colors p-1 cursor-pointer select-none"
									aria-label="Delete grade"
								>
									<Trash2 className="size-4" />
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{/* Add Grade Form Input Row */}
			<form
				onSubmit={handleAddGrade}
				className="flex gap-3 items-center w-full select-none"
			>
				<input
					type="text"
					value={subjectCode}
					onChange={(e) => setSubjectCode(e.target.value)}
					placeholder="Subject Code (e.g. IT101)"
					className={cn(INPUT_CLASS, "w-[280px]")}
				/>
				<input
					type="text"
					value={subjectName}
					onChange={(e) => setSubjectName(e.target.value)}
					placeholder="Subject Name (optional)"
					className={cn(INPUT_CLASS, "w-[200px]")}
				/>
				<input
					type="number"
					value={units}
					onChange={(e) => setUnits(e.target.value)}
					placeholder="Units"
					min="1"
					max="6"
					className={cn(INPUT_CLASS, "flex-1")}
				/>
				<Select value={grade} onValueChange={(val) => { if (val) setGrade(val); }}>
					<SelectTrigger className="flex-1">
						<SelectValue placeholder="Grade" />
					</SelectTrigger>
					<SelectContent>
						{validGrades.map((g) => (
							<SelectItem key={g} value={g}>
								{g}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					type="submit"
					className="bg-card border border-brand-primary text-brand-primary hover:bg-brand-primary-light/5 font-medium text-sm h-8 px-4 rounded-lg flex gap-1 items-center justify-center shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
				>
					<Plus className="size-4" />
					Add
				</Button>
			</form>

			{/* Navigation Buttons */}
			<StepNavigation
				onBack={onBack}
				onContinue={onContinue}
				disabled={
					(selectedSemesters.firstSem && grades1st.length === 0) ||
					(selectedSemesters.secondSem && grades2nd.length === 0)
				}
			/>
		</div>
	);
}
