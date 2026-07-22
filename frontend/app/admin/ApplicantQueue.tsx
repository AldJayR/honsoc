import { useState, useMemo } from "react";
import { Search, Eye, Filter, ArrowUpDown, CheckCircle, AlertTriangle, HelpCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RepresentativeApplication } from "@/shared/services/representative.api";

interface ApplicantQueueProps {
	applications: RepresentativeApplication[];
	onAuditClick: (id: string) => void;
}

type StatusFilter = "ALL" | "SUBMITTED" | "UNDER_REVIEW" | "FLAGGED" | "VERIFIED" | "REJECTED" | "ESCALATED";

const formatYearLevel = (yearStr: string) => {
	return yearStr
		.replace("_YEAR", "")
		.replace("1ST", "1st Year")
		.replace("2ND", "2nd Year")
		.replace("3RD", "3rd Year")
		.replace("4TH", "4th Year")
		.replace("5TH", "5th Year");
};

const getStatusConfig = (status: string) => {
	switch (status) {
		case "VERIFIED":
			return { label: "Verified", icon: CheckCircle, className: "bg-success text-success-foreground border-success/30" };
		case "FLAGGED":
			return { label: "Flagged", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/20" };
		case "UNDER_REVIEW":
			return { label: "Under Review", icon: HelpCircle, className: "bg-primary/10 text-primary border-primary/20" };
		case "REJECTED":
			return { label: "Rejected", icon: XCircle, className: "bg-muted text-muted-foreground border-border" };
		case "ESCALATED":
			return { label: "Escalated", icon: AlertTriangle, className: "bg-primary/10 text-primary border-primary/20" };
		case "SUBMITTED":
		default:
			return { label: "Submitted", icon: HelpCircle, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
	}
};

export function ApplicantQueue({ applications, onAuditClick }: ApplicantQueueProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [sortConfig, setSortConfig] = useState<{ key: "gwa" | "submittedAt"; direction: "asc" | "desc" } | null>(null);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const handleSort = (key: "gwa" | "submittedAt") => {
		setSortConfig((prev) => {
			if (!prev || prev.key !== key) return { key, direction: "asc" };
			if (prev.direction === "asc") return { key, direction: "desc" };
			return null;
		});
	};

	const filteredAndSortedApplications = useMemo(() => {
		let result = [...applications];

		// 1. Search Filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(app) =>
					app.student.name.toLowerCase().includes(query) ||
					(app.student.student_number && app.student.student_number.toLowerCase().includes(query)) ||
					app.referenceNo.toLowerCase().includes(query),
			);
		}

		// 2. Status Filter
		if (statusFilter !== "ALL") {
			result = result.filter((app) => app.status === statusFilter);
		}

		// 3. Sorting
		if (sortConfig) {
			result.sort((a, b) => {
				if (sortConfig.key === "gwa") {
					const aVal = a.gwa === null ? 999 : Number(a.gwa);
					const bVal = b.gwa === null ? 999 : Number(b.gwa);
					if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
					if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
					return 0;
				} else {
					const aVal = new Date(a.submittedAt).getTime();
					const bVal = new Date(b.submittedAt).getTime();
					if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
					if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
					return 0;
				}
			});
		}

		return result;
	}, [applications, searchQuery, statusFilter, sortConfig]);

	return (
		<div className="flex w-full flex-col gap-6">
			{/* Header Section */}
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold text-foreground leading-[35px]">Applicant Queue</h1>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1 max-w-[352px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						type="text"
						value={searchQuery}
						onChange={handleSearchChange}
						placeholder="Search by name or ID"
						className="h-9 border-border bg-card pl-9 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
					/>
				</div>

				<div className="flex items-center gap-2 sm:justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-semibold outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20">
							<Filter className="w-4 h-4" />
							<span>Status: {statusFilter === "ALL" ? "All" : statusFilter.replace("_", " ")}</span>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[180px]">
							<DropdownMenuItem onClick={() => setStatusFilter("ALL")} className="cursor-pointer">All</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setStatusFilter("SUBMITTED")} className="cursor-pointer">Submitted</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setStatusFilter("UNDER_REVIEW")} className="cursor-pointer">Under Review</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setStatusFilter("FLAGGED")} className="cursor-pointer">Flagged</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setStatusFilter("VERIFIED")} className="cursor-pointer">Verified</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setStatusFilter("REJECTED")} className="cursor-pointer">Rejected</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setStatusFilter("ESCALATED")} className="cursor-pointer">Escalated</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						variant="outline"
						size="sm"
						className="h-9 gap-2"
						onClick={() => handleSort("gwa")}
					>
						<ArrowUpDown className="w-4 h-4" />
						<span>Sort by GWA</span>
					</Button>
				</div>
			</div>

			{/* Table Card */}
			<div className="overflow-x-auto rounded-lg border border-border bg-card">
				<Table>
					<TableHeader className="bg-muted/40">
						<TableRow>
							<TableHead className="font-medium text-xs text-muted-foreground w-[299px] h-10 py-2">Student</TableHead>
							<TableHead className="font-medium text-xs text-muted-foreground w-[238px] h-10 py-2">Program</TableHead>
							<TableHead className="font-medium text-xs text-muted-foreground w-[118px] h-10 py-2">Year Level</TableHead>
							<TableHead className="font-medium text-xs text-muted-foreground w-[118px] h-10 py-2 text-right">GWA</TableHead>
							<TableHead className="font-medium text-xs text-muted-foreground w-[129px] h-10 py-2 text-center">Status</TableHead>
							<TableHead className="w-[50px] h-10 py-2" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredAndSortedApplications.length > 0 ? (
							filteredAndSortedApplications.map((app) => {
								const status = getStatusConfig(app.status);
								const StatusIcon = status.icon;
								return (
									<TableRow key={app.id} className="hover:bg-muted/30 border-b border-border/50">
										<TableCell className="py-3 h-[53px]">
											<div className="flex flex-col">
												<span className="font-semibold text-sm text-foreground">{app.student.name}</span>
												<span className="text-xs text-muted-foreground">{app.student.student_number || "No student number"}</span>
											</div>
										</TableCell>
										<TableCell className="py-3 h-[53px]">
											<span className="text-sm text-foreground">{app.program}</span>
										</TableCell>
										<TableCell className="py-3 h-[53px]">
											<span className="text-sm text-foreground">{formatYearLevel(app.yearLevel)}</span>
										</TableCell>
										<TableCell className="py-3 h-[53px] text-right">
											<span className="font-mono text-sm text-foreground">{app.gwa !== null ? app.gwa.toFixed(2) : "N/A"}</span>
										</TableCell>
										<TableCell className="py-3 h-[53px] text-center">
											<div className="inline-flex justify-center">
												<Badge variant="outline" className={`gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-lg ${status.className}`}>
													<StatusIcon className="w-3.5 h-3.5" />
													<span>{status.label}</span>
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
							})
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
									No applications found in the queue.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
