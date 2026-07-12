import { AlertTriangle, Info, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StepNavigation } from "@/portal/StepNavigation";
import type { GradeInput } from "@/shared/services/auth.api";
import {
	calculateGWA,
	hasDisqualifyingGrade,
	isDisqualifiedByGWA,
} from "@/shared/lib/grades";

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

const validGrades = ["1.00", "1.25", "1.50", "1.75", "2.00"];

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
	// Set initial active tab
	const initialTab = selectedSemesters.firstSem ? "1st" : "2nd";
	const [activeTab, setActiveTab] = useState<"1st" | "2nd">(initialTab);

	// Form input states
	const [subjectCode, setSubjectCode] = useState("");
	const [subjectName, setSubjectName] = useState("");
	const [units, setUnits] = useState("");
	const [grade, setGrade] = useState("1.00");

	const activeGrades = activeTab === "1st" ? grades1st : grades2nd;
	const setActiveGrades = activeTab === "1st" ? onChange1st : onChange2nd;

	const gwa1st = calculateGWA(grades1st);
	const gwa2nd = calculateGWA(grades2nd);

	const is1stDisqualified =
		hasDisqualifyingGrade(grades1st) || isDisqualifiedByGWA(gwa1st, gwaThreshold);
	const is2ndDisqualified =
		hasDisqualifyingGrade(grades2nd) || isDisqualifiedByGWA(gwa2nd, gwaThreshold);

	const handleAddGrade = (e: React.FormEvent) => {
		e.preventDefault();
		if (!subjectCode.trim() || !subjectName.trim()) return;

		const codeUpper = subjectCode.toUpperCase().trim();
		const nameUpper = subjectName.toUpperCase().trim();
		if (codeUpper.includes("NSTP") || nameUpper.includes("NSTP")) {
			toast.error("NSTP subjects are not included in the GWA computation. Please do not add them.");
			return;
		}

		const unitsNum = Number.parseInt(units, 10);
		if (Number.isNaN(unitsNum) || unitsNum < 1 || unitsNum > 6) return;

		const newGrade: GradeInput = {
			subjectCode: codeUpper,
			subjectName: subjectName.trim(),
			units: unitsNum,
			grade,
			_key: `grade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
		};

		setActiveGrades([...activeGrades, newGrade]);
		setSubjectCode("");
		setSubjectName("");
		setUnits("");
		setGrade("1.00");
	};

	const handleDeleteGrade = (key: string) => {
		setActiveGrades(activeGrades.filter((g) => g._key !== key));
	};

	return (
		<div className="flex flex-col items-start w-full gap-6 animate-fade-in">
			<div className="flex flex-col gap-1 w-full">
				<p className="select-none type-body-small text-muted-foreground">
					Enter each subject from your COG exactly as printed. GWA is computed
					automatically.
				</p>
			</div>

			{/* Info banner about NSTP exclusion */}
			<Alert>
				<Info className="size-4" />
				<AlertTitle>Important Guideline</AlertTitle>
				<AlertDescription>
					NSTP (National Service Training Program) subjects are not included in the GWA computation. Do not enter them here.
				</AlertDescription>
			</Alert>

			{/* GWA Summary Panel */}
			<div className="flex items-center justify-between w-full p-4 border shadow-sm bg-card border-border rounded-2xl">
				{/* 1st Sem GWA */}
				{selectedSemesters.firstSem ? (
					<div className="flex flex-col items-center justify-center flex-1 text-center">
						<span className="text-sm font-normal text-muted-foreground">
							1st sem GWA
						</span>
						<span className="mt-1 text-2xl font-semibold select-none text-amber-600">
							{gwa1st > 0 ? gwa1st.toFixed(2) : "0.00"}
						</span>
					</div>
				) : null}

				{/* Divider */}
				{selectedSemesters.firstSem && selectedSemesters.secondSem ? (
					<div className="h-12 w-[1px] bg-border mx-4" />
				) : null}

				{/* 2nd Sem GWA */}
				{selectedSemesters.secondSem ? (
					<div className="flex flex-col items-center justify-center flex-1 text-center">
						<span className="text-sm font-normal text-muted-foreground">
							2nd sem GWA
						</span>
						<span className="mt-1 text-2xl font-semibold select-none text-amber-600">
							{gwa2nd > 0 ? gwa2nd.toFixed(2) : "0.00"}
						</span>
					</div>
				) : null}
			</div>

			{/* Disqualification Banners */}
			{((activeTab === "1st" && is1stDisqualified) ||
				(activeTab === "2nd" && is2ndDisqualified)) ? (
				<div className="flex items-start w-full gap-2 p-3 text-red-700 border border-red-200 bg-red-500/10 rounded-xl animate-pulse-subtle">
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
			) : null}

			{/* Semester Tab Toggles */}
			{selectedSemesters.firstSem && selectedSemesters.secondSem ? (
				<div className="flex bg-muted p-0.5 rounded-lg shrink-0">
					<button
						type="button"
						onClick={() => setActiveTab("1st")}
						className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all select-none cursor-pointer ${
							activeTab === "1st"
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
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
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						2nd semester
					</button>
				</div>
			) : null}

			{/* Table of Grades */}
			{activeGrades.length === 0 ? (
				<p className="w-full p-8 text-sm text-center text-muted-foreground border border-dashed rounded-xl select-none">
					No grades added yet. Enter a subject below to start.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[300px]">Subject</TableHead>
							<TableHead className="text-center">Unit</TableHead>
							<TableHead className="text-center">Grade</TableHead>
							<TableHead className="w-10"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody key={activeTab}>
						{activeGrades.map((g) => (
							<TableRow key={g._key ?? `${activeTab}-${g.subjectCode}`}>
								<TableCell className="font-medium">{g.subjectName}</TableCell>
								<TableCell className="text-center">{g.units}</TableCell>
								<TableCell className="font-semibold text-center text-primary">
									{g.grade}
								</TableCell>
								<TableCell className="text-right">
									<button
										type="button"
										onClick={() => g._key && handleDeleteGrade(g._key)}
										className="p-1 transition-colors cursor-pointer select-none text-muted-foreground hover:text-destructive"
										aria-label="Delete grade"
									>
										<Trash2 className="size-4" />
									</button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			{/* Add Grade Form Input Row */}
			<form
				onSubmit={handleAddGrade}
				className="flex items-center w-full gap-3 select-none"
			>
				<Input
					type="text"
					value={subjectCode}
					onChange={(e) => setSubjectCode(e.target.value)}
					placeholder="Subject Code"
					className="w-[130px]"
				/>
				<Input
					type="text"
					value={subjectName}
					onChange={(e) => setSubjectName(e.target.value)}
					placeholder="Subject Name"
					className="flex-1"
				/>
				<Input
					type="text"
					inputMode="numeric"
					value={units}
					onChange={(e) => {
						const val = e.target.value;
						if (val === "" || /^[1-6]$/.test(val)) {
							setUnits(val);
						}
					}}
					placeholder="Units"
					className="w-[100px]"
				/>
				<Select
					value={grade}
					onValueChange={(val) => {
						if (val) setGrade(val);
					}}
					items={validGrades.map((g) => ({ value: g, label: g }))}
				>
					<SelectTrigger className="w-[100px]">
						<SelectValue placeholder="Grade" />
					</SelectTrigger>
					<SelectContent alignItemWithTrigger={false}>
						{validGrades.map((g) => (
							<SelectItem key={g} value={g} className="overflow-hidden text-ellipsis">
								{g}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button type="submit">
					<Plus />
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


