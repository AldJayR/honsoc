import { useState, useMemo } from "react";
import { Search, Eye, Calendar, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApplicationFlags } from "@/shared/services/queries/representative";
import type { RepresentativeApplication } from "@/shared/services/representative.api";
import { MetricCard } from "./MetricCard";

interface FlaggedCasesProps {
	applications: RepresentativeApplication[];
	onAuditClick: (id: string) => void;
}

const formatReasonCode = (code: string) => {
	return code
		.toLowerCase()
		.replace(/_/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (dateStr: string) => {
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
};

function FlaggedRow({
	app,
	onAuditClick,
}: { app: RepresentativeApplication; onAuditClick: (id: string) => void }) {
	const { data: flags = [] } = useApplicationFlags(app.id);

	// Retrieve the latest flag details
	const latestFlag = useMemo(() => {
		if (!flags.length) return null;
		return [...flags].sort(
			(a, b) => new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime(),
		)[0];
	}, [flags]);

	const getResponseStatus = () => {
		if (app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") {
			return {
				label: "Re-submitted",
				className: "bg-success text-success-foreground border-success/30",
				icon: RefreshCw,
			};
		}
		return {
			label: "Awaiting",
			className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
			icon: Clock,
		};
	};

	const responseStatus = getResponseStatus();
	const ResponseIcon = responseStatus.icon;

	return (
		<TableRow className="hover:bg-muted/30 border-b border-border/50">
			<TableCell className="py-3 h-[53px]">
				<div className="flex flex-col">
					<span className="font-semibold text-sm text-foreground">{app.student.name}</span>
					<span className="text-xs text-muted-foreground">{app.student.student_number || "No student number"}</span>
				</div>
			</TableCell>
			<TableCell className="py-3 h-[53px]">
				<span className="text-sm text-foreground">
					{latestFlag ? formatReasonCode(latestFlag.reasonCode) : "Loading reason..."}
				</span>
			</TableCell>
			<TableCell className="py-3 h-[53px] text-muted-foreground text-sm">
				<div className="flex items-center gap-1.5">
					<Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
					<span>{latestFlag ? formatDate(latestFlag.flaggedAt) : "..."}</span>
				</div>
			</TableCell>
			<TableCell className="py-3 h-[53px] text-center">
				<div className="inline-flex justify-center">
					<Badge variant="outline" className={`gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg ${responseStatus.className}`}>
						<ResponseIcon className="w-3.5 h-3.5" />
						<span>{responseStatus.label}</span>
					</Badge>
				</div>
			</TableCell>
			<TableCell className="py-3 h-[53px] text-center">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onAuditClick(app.id)}
					className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
				>
					<Eye className="w-3.5 h-3.5" />
					<span>Audit</span>
				</Button>
			</TableCell>
		</TableRow>
	);
}

export function FlaggedCases({ applications, onAuditClick }: FlaggedCasesProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const flaggedApplications = useMemo(() => {
		return applications.filter((app) => app.status === "FLAGGED");
	}, [applications]);

	const filteredApplications = useMemo(() => {
		if (!searchQuery.trim()) return flaggedApplications;
		const query = searchQuery.toLowerCase();
		return flaggedApplications.filter(
			(app) =>
				app.student.name.toLowerCase().includes(query) ||
				(app.student.student_number && app.student.student_number.toLowerCase().includes(query)) ||
				app.referenceNo.toLowerCase().includes(query),
		);
	}, [flaggedApplications, searchQuery]);

	// Stats calculations
	const totalFlagged = flaggedApplications.length;
	const resubmittedCount = applications.filter((app) => (app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") && app.gwa !== null).length;

	return (
		<div className="flex w-full flex-col gap-6">
			{/* Title */}
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold text-foreground leading-[35px]">Flagged Cases</h1>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{[
					{ label: "Total Flagged", value: totalFlagged },
					{ label: "Awaiting Student", value: totalFlagged },
					{ label: "Re-submitted", value: resubmittedCount },
				].map((card) => (
					<MetricCard key={card.label} label={card.label} value={card.value} />
				))}
			</div>

			{/* Search */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative flex-1 max-w-[352px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by name or ID"
						className="h-9 border-border bg-card pl-9 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
					/>
				</div>
			</div>

			{/* Table Card */}
			<div className="overflow-x-auto rounded-lg border border-border bg-card">
				<Table>
					<TableHeader className="bg-muted/40">
						<TableRow>
							<TableHead className="font-medium text-xs text-muted-foreground w-[428px] h-10 py-2">Student</TableHead>
							<TableHead className="font-medium text-xs text-muted-foreground w-[238px] h-10 py-2">Reason</TableHead>
							<TableHead className="font-medium text-xs text-muted-foreground w-[118px] h-10 py-2">Flagged</TableHead>
							<TableHead className="font-medium text-xs text-muted-foreground w-[146px] h-10 py-2 text-center">Student Response</TableHead>
							<TableHead className="w-[50px] h-10 py-2" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredApplications.length > 0 ? (
							filteredApplications.map((app) => (
								<FlaggedRow key={app.id} app={app} onAuditClick={onAuditClick} />
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
									No flagged cases found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
