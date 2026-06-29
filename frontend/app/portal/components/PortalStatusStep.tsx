import { AlertTriangle, Award, Check, Clock, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApplicationStatusItem } from "~/shared/services/auth.api";

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
			<div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-brand-border rounded-2xl w-full">
				<Clock className="size-8 text-brand-primary animate-pulse mb-3" />
				<span className="font-sans font-semibold text-sm text-foreground">
					No Application Found
				</span>
				<span className="text-xs text-brand-muted mt-1">
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

	// Determine timeline node active state based on application status
	// Statuses: SUBMITTED, UNDER_REVIEW, FLAGGED, VERIFIED, REJECTED
	const getStepStatus = (
		stepName: "SUBMITTED" | "UNDER_REVIEW" | "FLAGGED_VERIFIED" | "HONOR_ROLL",
	) => {
		const status = app.status;

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
	};

	const submittedStep = getStepStatus("SUBMITTED");
	const reviewStep = getStepStatus("UNDER_REVIEW");
	const verifyStep = getStepStatus("FLAGGED_VERIFIED");
	const honorStep = getStepStatus("HONOR_ROLL");

	const submittedDate = new Date(app.submittedAt);
	const formattedDate = submittedDate.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	const formattedTime = submittedDate.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<div className="flex flex-col gap-6 items-start w-full animate-fade-in">
			{/* Application Tabs if multiple applications exist */}
			{applications.length > 1 && (
				<div className="flex bg-muted p-0.5 rounded-lg select-none">
					{applications.map((a, idx) => (
						<button
							key={a.id}
							type="button"
							onClick={() => setActiveAppIdx(idx)}
							className={`px-3 py-1 text-xs font-semibold rounded-md transition-all select-none cursor-pointer ${
								activeAppIdx === idx
									? "bg-card text-foreground shadow-sm"
									: "text-brand-muted hover:text-foreground"
							}`}
						>
							{a.semester === "1ST" ? "1st Semester" : "2nd Semester"}{" "}
							Application
						</button>
					))}
				</div>
			)}

			{/* Submission Success Banner */}
			<div className="bg-card border border-brand-border p-5 rounded-2xl flex flex-col gap-3 items-center justify-center text-center w-full shadow-sm">
				<span className="font-sans font-semibold text-amber-600 text-base leading-6 select-none">
					{app.status === "FLAGGED"
						? "Action Required"
						: "Application Submitted"}
				</span>
				<p className="font-sans font-normal text-sm leading-5 text-foreground">
					{app.status === "FLAGGED"
						? "Your application has been flagged by the reviewer. Please see the timeline details below."
						: `Your application (${app.semester === "1ST" ? "1st Semester" : "2nd Semester"} AY ${schoolYear}) is in the queue. No further action needed.`}
				</p>

				{/* Reference No */}
				<div className="flex items-center gap-1.5 text-xs text-brand-muted select-none mt-1">
					<span>Application Reference</span>
					<span className="font-sans font-semibold text-foreground select-text">
						{app.referenceNo}
					</span>
					<button
						type="button"
						onClick={handleCopyRef}
						className="text-brand-muted hover:text-brand-primary p-1 cursor-pointer transition-colors"
						aria-label="Copy reference number"
					>
						{copied ? (
							<Check className="size-3.5 text-green-600" />
						) : (
							<Copy className="size-3.5" />
						)}
					</button>
				</div>
			</div>

			{/* Split Timeline & Summary */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-2">
				{/* Timeline Pane */}
				<div className="flex flex-col gap-4 items-start w-full">
					<h3 className="font-sans font-semibold text-sm text-foreground">
						Application Timeline
					</h3>

					<div className="flex flex-col relative pl-6 border-l border-brand-border ml-2 gap-6 select-none py-1">
						{/* Node 1: Submitted */}
						<div className="relative">
							{/* Bullet icon */}
							<div
								className={`absolute -left-[31px] top-0 rounded-full size-[18px] border-2 bg-card flex items-center justify-center transition-all ${
									submittedStep.completed || submittedStep.active
										? "border-green-600 bg-green-500/10"
										: "border-brand-border"
								}`}
							>
								{(submittedStep.completed || submittedStep.active) && (
									<div className="size-2 rounded-full bg-green-600" />
								)}
							</div>
							<div className="flex flex-col leading-tight">
								<span className="font-sans font-semibold text-sm text-foreground">
									{submittedStep.label}
								</span>
								<span className="font-sans text-[10px] text-brand-muted">
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
											: "border-brand-border"
								}`}
							>
								{reviewStep.completed ? (
									<div className="size-2 rounded-full bg-green-600" />
								) : reviewStep.active ? (
									<div className="size-2 rounded-full bg-amber-600" />
								) : null}
							</div>
							<div className="flex flex-col leading-tight">
								<span className="font-sans font-semibold text-sm text-foreground">
									{reviewStep.label}
								</span>
								<span className="font-sans text-[10px] text-brand-muted">
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
											: "border-brand-border"
								}`}
							>
								{verifyStep.error ? (
									<AlertTriangle className="size-2.5 text-red-600" />
								) : verifyStep.completed ? (
									<div className="size-2 rounded-full bg-green-600" />
								) : null}
							</div>
							<div className="flex flex-col leading-tight">
								<span
									className={`font-sans font-semibold text-sm ${
										verifyStep.error
											? "text-red-600 animate-pulse-subtle"
											: "text-foreground"
									}`}
								>
									{verifyStep.label}
								</span>
								<span className="font-sans text-[10px] text-brand-muted">
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
										: "border-brand-border"
								}`}
							>
								{honorStep.active ? (
									<Award className="size-3 text-amber-600" />
								) : null}
							</div>
							<div className="flex flex-col leading-tight">
								<span className="font-sans font-semibold text-sm text-foreground">
									{honorStep.label}
								</span>
								<span className="font-sans text-[10px] text-brand-muted">
									{app.status === "VERIFIED"
										? "Verified member"
										: "Published at the end of the term"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Summary Pane */}
				<div className="flex flex-col gap-4 items-start w-full select-none">
					<h3 className="font-sans font-semibold text-sm text-foreground">
						Summary
					</h3>

					<div className="flex flex-col gap-2 w-full border border-brand-border rounded-xl p-4 bg-muted/10">
						{/* SY */}
						<div className="flex justify-between items-center pb-2 border-b border-brand-border/50 text-xs">
							<span className="text-brand-muted">Academic Year</span>
							<span className="font-semibold text-foreground">
								AY {schoolYear}
							</span>
						</div>

						{/* Semester */}
						<div className="flex justify-between items-center pb-2 border-b border-brand-border/50 text-xs">
							<span className="text-brand-muted">Semester</span>
							<span className="font-semibold text-foreground">
								{app.semester === "1ST" ? "1st Semester" : "2nd Semester"}
							</span>
						</div>

						{/* GWA */}
						<div className="flex justify-between items-center pb-2 border-b border-brand-border/50 text-xs">
							<span className="text-brand-muted">Semester GWA</span>
							<span className="font-semibold text-amber-600 text-sm">
								{app.gwa ? app.gwa.toFixed(2) : "N/A"}
							</span>
						</div>

						{/* Status */}
						<div className="flex justify-between items-center text-xs">
							<span className="text-brand-muted">Application Status</span>
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
