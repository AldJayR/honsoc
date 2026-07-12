import { useState, useMemo } from "react";
import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuditLogEntry } from "@/shared/services/representative.api";
import { MetricCard } from "./MetricCard";

interface AuditLogsProps {
	auditLogs: AuditLogEntry[];
}

const formatAction = (action: string) => {
	switch (action) {
		case "VERIFIED":
			return { label: "Verified applicant", className: "text-success-foreground font-semibold" };
		case "FLAGGED":
			return { label: "Flagged applicant", className: "text-destructive font-semibold" };
		case "REJECTED":
			return { label: "Rejected applicant", className: "text-muted-foreground font-semibold" };
		default:
			return { label: "Reviewed application", className: "text-foreground font-medium" };
	}
};

const formatTimestamp = (timestampStr: string) => {
	const d = new Date(timestampStr);
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

export function AuditLogs({ auditLogs }: AuditLogsProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredLogs = useMemo(() => {
		if (!searchQuery.trim()) return auditLogs;
		const query = searchQuery.toLowerCase();
		return auditLogs.filter(
			(log) =>
				log.action.toLowerCase().includes(query) ||
				log.actor.name.toLowerCase().includes(query) ||
				log.application.referenceNo.toLowerCase().includes(query) ||
				log.application.student.name.toLowerCase().includes(query) ||
				(log.note && log.note.toLowerCase().includes(query)),
		);
	}, [auditLogs, searchQuery]);

	// Stats counters
	const totalDecisions = auditLogs.length;
	const verificationsCount = auditLogs.filter((log) => log.action === "VERIFIED").length;
	const flagsCount = auditLogs.filter((log) => log.action === "FLAGGED").length;

	return (
		<div className="flex w-full flex-col gap-6">
			{/* Title */}
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold text-foreground leading-[35px]">Audit Logs</h1>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{[
					{ label: "Decisions", value: totalDecisions },
					{ label: "Verifications", value: verificationsCount },
					{ label: "Flags Issued", value: flagsCount },
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
						placeholder="Search by action, name, or reference #"
						className="h-9 border-border bg-card pl-9 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
					/>
				</div>
			</div>

			{/* Table Card */}
			<div className="overflow-x-auto rounded-lg border border-border bg-card">
				<Table>
					<TableHeader className="bg-muted/40">
						<TableRow>
							<TableHead className="font-semibold text-xs text-muted-foreground w-[240px] h-10 py-2">Action</TableHead>
							<TableHead className="font-semibold text-xs text-muted-foreground h-10 py-2">Application</TableHead>
							<TableHead className="font-semibold text-xs text-muted-foreground w-[220px] h-10 py-2">Timestamp</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredLogs.length > 0 ? (
							filteredLogs.map((log) => {
								const actionInfo = formatAction(log.action);
								return (
									<TableRow key={log.id} className="hover:bg-muted/30 border-b border-border/50">
										<TableCell className="py-3 h-[53px]">
											<div className="flex flex-col">
												<span className={`text-sm ${actionInfo.className}`}>{actionInfo.label}</span>
												<span className="text-[10px] text-muted-foreground mt-0.5">by {log.actor.name}</span>
											</div>
										</TableCell>
										<TableCell className="py-3 h-[53px]">
											<div className="flex flex-col text-sm">
												<span className="font-semibold text-foreground">
													{log.application.student.name}{" "}
													<span className="text-xs text-muted-foreground font-normal">
														({log.application.program})
													</span>
												</span>
												<span className="text-xs text-muted-foreground mt-0.5">
													Reference: {log.application.referenceNo}
												</span>
												{log.note && (
													<span className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 border border-border/20 rounded mt-1 self-start font-medium leading-tight">
														Note: {log.note}
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="py-3 h-[53px] text-muted-foreground text-sm">
											<div className="flex items-center gap-1.5">
												<Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
												<span>{formatTimestamp(log.createdAt)}</span>
											</div>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={3} className="text-center py-10 text-sm text-muted-foreground">
									No audit logs found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
