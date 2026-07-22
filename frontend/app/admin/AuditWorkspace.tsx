import { useState } from "react";
import { AlertCircle, FileText, Check, Flag, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { GradeInput } from "@/shared/services/auth.api";
import type {
	RepresentativeApplication,
	ApplicationDocument,
	ApplicationGwaResponse,
} from "@/shared/services/representative.api";

interface AuditWorkspaceProps {
	applications: RepresentativeApplication[];
	selectedAppId: string | null;
	onSelectApp: (id: string | null) => void;
	selectedApp: RepresentativeApplication | undefined;
	isAppLoading: boolean;
	grades: GradeInput[];
	documents: ApplicationDocument[];
	gwaData: ApplicationGwaResponse | undefined;
	onVerify: () => Promise<void>;
	onUnverify: () => Promise<void>;
	onFlag: (reasonCode: string, note: string) => Promise<void>;
	onEscalate: (note: string) => Promise<void> | void;
	isVerifying: boolean;
	isUnverifying: boolean;
	isFlagging: boolean;
	isEscalating: boolean;
}

const formatYearLevel = (yearStr: string) => {
	return yearStr
		.replace("_YEAR", "")
		.replace("1ST", "1st Year")
		.replace("2ND", "2nd Year")
		.replace("3RD", "3rd Year")
		.replace("4TH", "4th Year")
		.replace("5TH", "5th Year");
};

const getInitials = (name: string) => {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
};

export function AuditWorkspace({
	applications,
	selectedAppId,
	onSelectApp,
	selectedApp,
	isAppLoading,
	grades,
	documents,
	gwaData,
	onVerify,
	onUnverify,
	onFlag,
	onEscalate,
	isVerifying,
	isUnverifying,
	isFlagging,
	isEscalating,
}: AuditWorkspaceProps) {
	const [activeDocTab, setActiveDocTab] = useState<string>("COG");
	const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
	const [isUnverifyDialogOpen, setIsUnverifyDialogOpen] = useState(false);
	const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false);
	const [flagReason, setFlagReason] = useState("INCORRECT_GRADE");
	const [flagNote, setFlagNote] = useState("");
	const [escalationNote, setEscalationNote] = useState("");

	const handleVerifyClick = () => {
		onVerify();
	};

	const handleUnverify = async () => {
		await onUnverify();
		setIsUnverifyDialogOpen(false);
	};

	const handleFlagSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onFlag(flagReason, flagNote);
		setIsFlagDialogOpen(false);
		setFlagNote("");
	};

	const handleEscalateSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onEscalate(escalationNote);
		setIsEscalateDialogOpen(false);
		setEscalationNote("");
	};

	const filteredGrades = grades;
	const requiredDocumentTypes = selectedApp
		? ["COR", "GMC", selectedApp.semester === "1ST" ? "COG_1ST" : "COG_2ND"]
		: [];
	const hasMissingDocuments = requiredDocumentTypes.some(
		(type) => !documents.some((document) => document.docType === type),
	);
	const hasDisqualifiers = (gwaData?.disqualifiers.length ?? 0) > 0;
	const isVerified = selectedApp?.status === "VERIFIED";
	const semesterApplications = selectedApp
		? applications
			.filter(
				(application) =>
					application.student.id === selectedApp.student.id &&
					application.term.id === selectedApp.term.id,
			)
			.sort((a, b) => a.semester.localeCompare(b.semester))
		: [];

	// Find the active document URL based on tab
	const getActiveDocument = () => {
		let typeToFind = "COG_1ST";
		if (activeDocTab === "COR") {
			typeToFind = "COR";
		} else if (activeDocTab === "GMC") {
			typeToFind = "GMC";
		} else {
			// COG
			typeToFind = selectedApp?.semester === "2ND" ? "COG_2ND" : "COG_1ST";
		}

		return documents.find((d) => d.docType === typeToFind) || null;
	};

	const activeDocument = getActiveDocument();
	const isImageDocument = activeDocument
		? /\.(png|jpe?g)$/i.test(activeDocument.objectKey)
		: false;

	return (
		<div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background lg:flex-row">
			{/* Left Column: Applicants list */}
			<div className="flex max-h-[220px] w-full flex-col border-b border-border bg-muted/20 lg:h-full lg:max-h-none lg:w-[258px] lg:border-b-0 lg:border-r">
				<div className="flex shrink-0 items-center justify-between border-b border-border bg-card p-4">
					<h3 className="font-semibold text-sm text-foreground">Queue</h3>
					<span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
						{applications.length}
					</span>
				</div>
				<div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
					{applications.map((app) => {
						const isSelected = app.id === selectedAppId;
						return (
							<Button
								key={app.id}
								variant="ghost"
								onClick={() => onSelectApp(app.id)}
								aria-pressed={isSelected}
								className={`h-auto w-full justify-start gap-3 rounded-md border p-3 text-left ${
									isSelected
										? "border-primary/20 bg-primary/10"
										: "border-transparent hover:bg-muted/50"
								}`}
							>
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
									{getInitials(app.student.name)}
								</div>
								<div className="min-w-0 flex-1">
									<h4 className="font-semibold text-xs text-foreground truncate">
										{app.student.name}
									</h4>
									<p className="text-[10px] text-muted-foreground truncate">
										{app.program} · {formatYearLevel(app.yearLevel)}
									</p>
									<Badge
										variant="outline"
										className={`mt-1 text-[9px] px-1.5 py-0 rounded ${
											app.status === "VERIFIED"
												? "bg-success text-success-foreground border-success/30"
												: app.status === "FLAGGED"
													? "bg-destructive/10 text-destructive border-destructive/20"
													: "bg-amber-500/10 text-amber-600 border-amber-500/20"
										}`}
									>
										{app.status}
									</Badge>
								</div>
							</Button>
						);
					})}
				</div>
			</div>

			{/* Right Column: Work space */}
			<div className="relative flex min-h-0 flex-1 flex-col bg-card">
				{isAppLoading ? (
					<div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground select-none">
						<div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
						<p className="text-sm font-semibold">
							Loading applicant details...
						</p>
					</div>
				) : selectedAppId && selectedApp ? (
					<>
						{/* Audit Workspace Header */}
						<div className="z-10 flex shrink-0 items-center justify-between border-b border-border bg-card p-4">
							<div>
								<h3 className="font-semibold text-sm text-foreground">
									{selectedApp.student?.name ?? "Unknown applicant"}
								</h3>
								<p className="text-xs text-muted-foreground">
									{selectedApp.program} ·{" "}
									{formatYearLevel(selectedApp.yearLevel)} ·{" "}
									{selectedApp.referenceNo}
								</p>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="h-8 text-xs gap-1.5"
									onClick={() => setIsEscalateDialogOpen(true)}
									disabled={isEscalating}
								>
									<ArrowUpRight className="w-3.5 h-3.5" />
									<span>{isEscalating ? "Escalating..." : "Escalate"}</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="h-8 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
									onClick={() => setIsFlagDialogOpen(true)}
								>
									<Flag className="w-3.5 h-3.5" />
									<span>Flag</span>
								</Button>
								<Button
									variant={isVerified ? "outline" : "default"}
									size="sm"
									className={
										isVerified
											? "h-8 gap-1.5 text-xs"
											: "h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
									}
									onClick={isVerified ? () => setIsUnverifyDialogOpen(true) : handleVerifyClick}
									disabled={
										isVerifying ||
										(!isVerified && (hasDisqualifiers || hasMissingDocuments))
									}
								>
									<Check className="w-3.5 h-3.5" />
									<span>
										{isVerified
											? isUnverifying ? "Unverifying..." : "Unverify"
											: isVerifying ? "Verifying..." : "Verify"}
									</span>
								</Button>
							</div>
						</div>

						{/* Audit Workspace Content */}
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
							{/* Column 1: Document Scan */}
							<div className="flex h-full w-full flex-col border-b border-border bg-muted/20 p-4 lg:w-[384px] lg:border-b-0 lg:border-r">
								<div className="flex justify-between items-center mb-3">
									<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										Document Scan
									</h4>
								</div>

								{/* Document Tabs */}
								<Tabs
									value={activeDocTab}
									onValueChange={setActiveDocTab}
									className="w-full flex-1 flex flex-col"
								>
									<TabsList className="grid grid-cols-3 h-8 p-0.5 bg-muted mb-3 rounded-lg">
										<TabsTrigger
											value="COG"
											className="text-[11px] font-semibold h-7 rounded-md"
										>
											COG
										</TabsTrigger>
										<TabsTrigger
											value="COR"
											className="text-[11px] font-semibold h-7 rounded-md"
										>
											COR
										</TabsTrigger>
										<TabsTrigger
											value="GMC"
											className="h-7 rounded-md text-[11px] font-semibold"
										>
											GMC
										</TabsTrigger>
									</TabsList>

									<div className="relative min-h-[300px] flex-1 overflow-hidden rounded-md border border-border bg-background">
										{activeDocument ? (
											isImageDocument ? (
												<img
													src={activeDocument.url}
													alt={`${activeDocument.docType} document scan`}
													className="h-full w-full object-contain"
												/>
											) : (
											<iframe
												src={activeDocument.url}
												title="Document Scan"
												className="w-full h-full border-none"
											/>
											)
										) : (
											<div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground gap-2">
												<FileText className="w-12 h-12 text-muted-foreground/30 stroke-[1.5]" />
												<div>
													<p className="text-xs font-semibold">
														No Document Uploaded
													</p>
													<p className="text-[10px] mt-0.5">
														Applicant has not uploaded this document type yet.
													</p>
												</div>
											</div>
										)}
									</div>
								</Tabs>
							</div>

							{/* Column 2: Computed Data */}
							<div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-4">
								<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
									Computed Data
								</h4>

								{/* GWA Card */}
								<div className="mb-4 flex items-center justify-between rounded-lg border border-success/30 bg-success p-4">
									<div>
										<p className="text-xs text-success-foreground font-medium">
											System GWA
										</p>
										<p className="text-3xl font-bold text-success-foreground mt-1">
											{gwaData?.gwa ? gwaData.gwa.toFixed(2) : "N/A"}
										</p>
									</div>
									{hasDisqualifiers || hasMissingDocuments ? (
										<div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-1.5 rounded-lg max-w-[200px] font-medium">
											<AlertCircle className="w-4 h-4 shrink-0" />
											<span className="leading-tight text-[11px]">
												{hasDisqualifiers
													? "Disqualifiers detected!"
													: "Required documents are missing!"}
											</span>
										</div>
									) : (
										<div className="flex items-center gap-1.5 rounded-md border border-success/50 bg-card px-2.5 py-1.5 text-xs font-medium text-success-foreground">
											<Check className="w-4 h-4" />
											<span>Meets GWA Requirements</span>
										</div>
									)}
								</div>

								{/* Semester Tabs */}
								<Tabs
									value={selectedApp.semester}
									onValueChange={(semester) => {
										const application = semesterApplications.find((item) => item.semester === semester);
										if (application) onSelectApp(application.id);
									}}
									className="w-full"
								>
									<TabsList className="mb-3 h-8 w-fit rounded-md bg-muted p-0.5">
										{semesterApplications.map((application) => (
											<TabsTrigger
												key={application.id}
												value={application.semester}
												className="h-7 rounded-md px-3 text-[11px] font-semibold"
											>
												{application.semester === "1ST" ? "1st Semester" : "2nd Semester"}
											</TabsTrigger>
										))}
									</TabsList>

									{/* Grades Table */}
									<div className="overflow-hidden rounded-md border border-border">
										<Table>
											<TableHeader className="bg-muted/40">
												<TableRow>
													<TableHead className="font-semibold text-[11px] text-muted-foreground py-2 h-8">
														Subject
													</TableHead>
													<TableHead className="font-semibold text-[11px] text-muted-foreground py-2 h-8 text-right">
														Units
													</TableHead>
													<TableHead className="font-semibold text-[11px] text-muted-foreground py-2 h-8 text-right">
														Grade
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredGrades.length > 0 ? (
													filteredGrades.map((g) => (
														<TableRow
															key={g._key ?? g.subjectCode}
															className="border-b border-border/50 hover:bg-muted/20"
														>
															<TableCell className="py-2 h-10">
																<div className="flex flex-col">
																	<span className="font-medium text-xs text-foreground">
																		{g.subjectCode}
																	</span>
																	<span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
																		{g.subjectName}
																	</span>
																</div>
															</TableCell>
															<TableCell className="py-2 h-10 text-right text-xs text-foreground font-mono">
																{g.units}
															</TableCell>
															<TableCell className="py-2 h-10 text-right text-xs text-foreground font-semibold font-mono">
																{Number(g.grade).toFixed(2)}
															</TableCell>
														</TableRow>
													))
												) : (
													<TableRow>
														<TableCell
															colSpan={3}
															className="text-center py-6 text-xs text-muted-foreground"
														>
															No grades records for this semester.
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
								</Tabs>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
						<FileText className="w-16 h-16 text-muted-foreground/20 stroke-[1.2]" />
						<div>
							<h3 className="font-semibold text-sm text-foreground">
								Select an Applicant
							</h3>
							<p className="text-xs text-muted-foreground mt-0.5">
								Choose a student application from the queue sidebar to start
								auditing.
							</p>
						</div>
					</div>
				)}

				{/* Design System Dialog for Flagging */}
				<Dialog open={isUnverifyDialogOpen} onOpenChange={setIsUnverifyDialogOpen}>
					<DialogContent className="sm:max-w-[400px]">
						<DialogHeader>
							<DialogTitle>Unverify Application?</DialogTitle>
							<DialogDescription>
								This will return the application to under review and remove its verified status.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button type="button" variant="ghost" onClick={() => setIsUnverifyDialogOpen(false)}>
								Cancel
							</Button>
							<Button type="button" variant="destructive" onClick={handleUnverify} disabled={isUnverifying}>
								{isUnverifying ? "Unverifying..." : "Unverify"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={isEscalateDialogOpen} onOpenChange={setIsEscalateDialogOpen}>
					<DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[440px]">
						<DialogHeader className="gap-1 border-b bg-card p-5 pr-12">
							<DialogTitle className="text-sm font-semibold">
								Escalate Application
							</DialogTitle>
							<DialogDescription className="text-xs">
								Send this application to the president with a required review note.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleEscalateSubmit} className="flex flex-col">
							<div className="p-5">
								<label htmlFor="escalationNote" className="text-xs font-semibold">
									Escalation Note
								</label>
								<Textarea
									id="escalationNote"
									rows={4}
									value={escalationNote}
									onChange={(e) => setEscalationNote(e.target.value)}
									required
									placeholder="Explain why this application needs president review..."
									className="mt-1.5 resize-none rounded-md border-border bg-card p-2.5 text-xs"
								/>
							</div>
							<DialogFooter className="mx-0 mb-0 shrink-0 gap-2 bg-muted/30 p-4">
								<Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsEscalateDialogOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" size="sm" className="h-8 text-xs" disabled={isEscalating}>
									{isEscalating ? "Escalating..." : "Escalate"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				<Dialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
					<DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[440px]">
						<DialogHeader className="gap-1 border-b bg-card p-5 pr-12">
							<DialogTitle className="flex items-center gap-2 text-sm font-semibold">
								<Flag className="w-4 h-4 text-red-600 fill-red-600/10" />
								<span>Flag Application</span>
							</DialogTitle>
							<DialogDescription className="text-xs">
								Record the issue so the applicant can correct it.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleFlagSubmit} className="flex flex-col">
							<div className="flex flex-col gap-4 p-5">
								<div className="flex flex-col gap-1.5">
									<label
										htmlFor="flagReason"
										className="text-xs font-semibold text-foreground"
									>
										Reason Code
									</label>
									<Select
										value={flagReason}
										onValueChange={(value) => setFlagReason(value ?? "INCORRECT_GRADE")}
									>
										<SelectTrigger id="flagReason" className="h-9 w-full bg-card text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="INCORRECT_GRADE">Incorrect Grade</SelectItem>
											<SelectItem value="BLURRY_DOCUMENTS">Blurry Documents</SelectItem>
											<SelectItem value="INCOMPLETE_SUBMISSION">Incomplete Submission</SelectItem>
											<SelectItem value="OTHER">Other Reason</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex flex-col gap-1.5">
									<label
										htmlFor="flagNote"
										className="text-xs font-semibold text-foreground"
									>
										Detailed Note
									</label>
									<Textarea
										id="flagNote"
										rows={3}
										value={flagNote}
										onChange={(e) => setFlagNote(e.target.value)}
										required
										placeholder="Specify which subject grade is incorrect, or which documents are blurry..."
										className="resize-none rounded-md border-border bg-card p-2.5 text-xs placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
									/>
								</div>
							</div>

							<DialogFooter className="mx-0 mb-0 shrink-0 gap-2 bg-muted/30 p-4">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-xs h-8"
									onClick={() => setIsFlagDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="default"
									size="sm"
									disabled={isFlagging}
									className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
								>
									{isFlagging ? "Flagging..." : "Flag Application"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
