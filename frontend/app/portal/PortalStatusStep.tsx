import { AlertTriangle, Award, Check, Clock, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApplicationStatusItem } from "@/shared/services/auth.api";
import { formatDate, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ApplicationStatus = ApplicationStatusItem["status"];
type StepName = "SUBMITTED" | "UNDER_REVIEW" | "FLAGGED_VERIFIED" | "HONOR_ROLL";

interface StepStatus {
	active: boolean;
	completed: boolean;
	label: string;
	error?: boolean;
}

function getStepStatus(stepName: StepName, status: ApplicationStatus): StepStatus {
	if (stepName === "SUBMITTED") {
		return {
			active: true,
			completed: status !== "SUBMITTED",
			label: "Submitted",
		};
	}
	if (stepName === "UNDER_REVIEW") {
		const active =
			status === "UNDER_REVIEW" ||
			status === "FLAGGED" ||
			status === "VERIFIED";
		const completed = status === "VERIFIED";
		return { active, completed, label: "Under Review" };
	}
	if (stepName === "FLAGGED_VERIFIED") {
		if (status === "FLAGGED") {
			return {
				active: true,
				completed: false,
				label: "Flagged",
				error: true,
			};
		}
		if (status === "VERIFIED") {
			return { active: true, completed: true, label: "Verified" };
		}
		return { active: false, completed: false, label: "Verified or flagged" };
	}
	if (stepName === "HONOR_ROLL") {
		const active = status === "VERIFIED"; // Roll published end of term
		return { active, completed: false, label: "Final honor roll" };
	}

	return { active: false, completed: false, label: "" };
}

interface PortalStatusStepProps {
	applications: ApplicationStatusItem[];
	schoolYear: string;
}

export function PortalStatusStep({
	applications,
	schoolYear,
}: PortalStatusStepProps) {
	const [activeAppIdx, setActiveAppIdx] = useState(0);
	const [copied, setCopied] = useState(false);

	if (!applications || applications.length === 0) {
		return (
			<div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center">
				<Clock className="mb-2 size-8 text-primary" />
				<span className="type-label">
					No Application Found
				</span>
				<span className="type-caption text-muted-foreground">
					Please check back later or start a new application.
				</span>
			</div>
		);
	}

	const app = applications[activeAppIdx];

	const handleCopyRef = () => {
		navigator.clipboard.writeText(app.referenceNo);
		setCopied(true);
		toast.success("Reference number copied!");
		setTimeout(() => setCopied(false), 2000);
	};

	const submittedStep = getStepStatus("SUBMITTED", app.status);
	const reviewStep = getStepStatus("UNDER_REVIEW", app.status);
	const verifyStep = getStepStatus("FLAGGED_VERIFIED", app.status);
	const honorStep = getStepStatus("HONOR_ROLL", app.status);

	const formattedDate = formatDate(app.submittedAt);
	const formattedTime = formatTime(app.submittedAt);

	return (
		<div className="flex w-full flex-col items-start gap-6">
			{/* Application Tabs if multiple applications exist */}
			{applications.length > 1 ? (
				<Tabs value={String(activeAppIdx)} onValueChange={(value) => setActiveAppIdx(Number(value))}>
					<TabsList className="rounded-md bg-muted p-0.5">
					{applications.map((a, idx) => (
						<TabsTrigger
							key={a.id}
							value={String(idx)}
							className="px-3 py-1 text-xs font-semibold"
						>
							{a.semester === "1ST" ? "1st Semester" : "2nd Semester"} {" "}
							Application
						</TabsTrigger>
					))}
					</TabsList>
				</Tabs>
			) : null}

			{/* Submission Success Banner */}
			<div className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-5 text-center">
				<span className="font-sans text-base font-semibold leading-6 select-none text-amber-600">
					{app.status === "FLAGGED"
						? "Action Required"
						: "Application Submitted"}
				</span>
				<p className="type-body-small text-foreground">
					{app.status === "FLAGGED"
						? "Your application has been flagged by the reviewer. Please see the timeline details below."
						: `Your application (${app.semester === "1ST" ? "1st Semester" : "2nd Semester"} AY ${schoolYear}) is in the queue. No further action needed.`}
				</p>

				{/* Reference No */}
				<div className="flex items-center gap-1.5 type-caption text-muted-foreground select-none mt-1">
					<span>Application Reference</span>
					<span className="font-sans font-semibold select-text text-foreground">
						{app.referenceNo}
					</span>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={handleCopyRef}
						className="text-muted-foreground hover:text-primary"
						aria-label="Copy reference number"
					>
						{copied ? (
							<Check className="size-3.5 text-green-600" />
						) : (
							<Copy className="size-3.5" />
						)}
					</Button>
				</div>
			</div>

			{/* Split Timeline & Summary */}
			<div className="mt-2 grid w-full grid-cols-1 gap-8 md:grid-cols-2">
				{/* Timeline Pane */}
				<div className="flex flex-col items-start w-full gap-4">
					<h3 className="type-label">
						Application Timeline
					</h3>

					<div className="relative flex flex-col gap-6 py-1 pl-6 ml-2 border-l select-none border-border">
						{/* Node 1: Submitted */}
						<div className="relative">
							{/* Bullet icon */}
							<div
								className={`absolute -left-[31px] top-0 rounded-full size-[18px] border-2 bg-card flex items-center justify-center transition-all ${
									submittedStep.completed || submittedStep.active
										? "border-green-600 bg-green-500/10"
										: "border-border"
								}`}
							>
								{(submittedStep.completed || submittedStep.active) ? (
									<div className="bg-green-600 rounded-full size-2" />
								) : null}
							</div>
							<div className="flex flex-col leading-tight">
								<span className="font-sans text-sm font-semibold text-foreground">
									{submittedStep.label}
								</span>
								<span className="font-sans text-[10px] text-muted-foreground">
									{formattedDate} {formattedTime}
								</span>
							</div>
						</div>

						{/* Node 2: Under Review */}
						<div className="relative">
							{/* Bullet icon */}
							<div
								className={`absolute -left-[31px] top-0 rounded-full size-[18px] border-2 bg-card flex items-center justify-center transition-all ${
									reviewStep.completed
										? "border-green-600 bg-green-500/10"
										: reviewStep.active
											? "border-amber-600 bg-amber-500/10"
											: "border-border"
								}`}
							>
								{reviewStep.completed ? (
									<div className="bg-green-600 rounded-full size-2" />
								) : reviewStep.active ? (
									<div className="rounded-full size-2 bg-amber-600" />
								) : null}
							</div>
							<div className="flex flex-col leading-tight">
								<span className="font-sans text-sm font-semibold text-foreground">
									{reviewStep.label}
								</span>
								<span className="font-sans text-[10px] text-muted-foreground">
									{reviewStep.completed
										? "Review finished"
										: reviewStep.active
											? "Assigned to college admin"
											: "Pending review assignment"}
								</span>
							</div>
						</div>

						{/* Node 3: Verified or Flagged */}
						<div className="relative">
							{/* Bullet icon */}
							<div
								className={`absolute -left-[31px] top-0 rounded-full size-[18px] border-2 bg-card flex items-center justify-center transition-all ${
									verifyStep.error
										? "border-red-600 bg-red-500/10"
										: verifyStep.completed
											? "border-green-600 bg-green-500/10"
											: "border-border"
								}`}
							>
								{verifyStep.error ? (
									<AlertTriangle className="size-2.5 text-destructive" />
								) : verifyStep.completed ? (
									<div className="bg-green-600 rounded-full size-2" />
								) : null}
							</div>
							<div className="flex flex-col leading-tight">
								<span
									className={`font-sans font-semibold text-sm ${
										verifyStep.error
											? "text-destructive"
											: "text-foreground"
									}`}
								>
									{verifyStep.label}
								</span>
								<span className="font-sans text-[10px] text-muted-foreground">
									{verifyStep.error
										? "Action needed: incorrect details flagged"
										: verifyStep.completed
											? "Approved by college admin"
											: "Pending admin validation"}
								</span>
							</div>
						</div>

						{/* Node 4: Final Honor Roll */}
						<div className="relative">
							{/* Bullet icon */}
							<div
								className={`absolute -left-[31px] top-0 rounded-full size-[18px] border-2 bg-card flex items-center justify-center transition-all ${
									honorStep.active
										? "border-amber-600 bg-amber-500/10"
										: "border-border"
								}`}
							>
								{honorStep.active ? (
									<Award className="size-3 text-amber-600" />
								) : null}
							</div>
							<div className="flex flex-col leading-tight">
								<span className="font-sans text-sm font-semibold text-foreground">
									{honorStep.label}
								</span>
								<span className="font-sans text-[10px] text-muted-foreground">
									{app.status === "VERIFIED"
										? "Verified member"
										: "Published at the end of the term"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Summary Pane */}
				<div className="flex flex-col items-start w-full gap-4 select-none">
					<h3 className="type-label">
						Summary
					</h3>

					<div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-muted/10 p-4">
						{/* SY */}
						<div className="flex items-center justify-between pb-2 text-xs border-b border-border/50">
							<span className="text-muted-foreground">Academic Year</span>
							<span className="font-semibold text-foreground">
								AY {schoolYear}
							</span>
						</div>

						{/* Semester */}
						<div className="flex items-center justify-between pb-2 text-xs border-b border-border/50">
							<span className="text-muted-foreground">Semester</span>
							<span className="font-semibold text-foreground">
								{app.semester === "1ST" ? "1st Semester" : "2nd Semester"}
							</span>
						</div>

						{/* GWA */}
						<div className="flex items-center justify-between pb-2 text-xs border-b border-border/50">
							<span className="text-muted-foreground">Semester GWA</span>
							<span className="text-sm font-semibold text-amber-600">
								{app.gwa ? app.gwa.toFixed(2) : "N/A"}
							</span>
						</div>

						{/* Status */}
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Application Status</span>
							<span
								className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
									app.status === "VERIFIED"
										? "bg-green-500/15 text-green-800"
										: app.status === "FLAGGED"
											? "bg-red-500/15 text-red-800"
											: "bg-amber-500/15 text-amber-800"
								}`}
							>
								{app.status}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

