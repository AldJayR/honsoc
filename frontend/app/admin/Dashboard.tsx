import { PieChart, Pie, Cell, BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import type { RepresentativeApplication, AuditLogEntry } from "@/shared/services/representative.api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

interface DashboardProps {
	applications: RepresentativeApplication[];
	auditLogs: AuditLogEntry[];
	onViewApplication: (id: string) => void;
}

export function Dashboard({
	applications,
	auditLogs,
	onViewApplication,
}: DashboardProps) {
	// 1. Calculate stats from applications
	const totalApplicants = applications.length;
	const pendingCount = applications.filter((app) => app.status === "SUBMITTED" || app.status === "UNDER_REVIEW").length;
	const verifiedCount = applications.filter((app) => app.status === "VERIFIED").length;
	const flaggedCount = applications.filter((app) => app.status === "FLAGGED").length;

	// 2. Breakdown counts
	const underReviewCount = applications.filter((app) => app.status === "UNDER_REVIEW").length;

	// Donut chart config and data
	const donutData = [
		{ name: "verified", value: verifiedCount, fill: "var(--color-verified)" },
		{ name: "pending", value: pendingCount, fill: "var(--color-pending)" },
		{ name: "flagged", value: flaggedCount, fill: "var(--color-flagged)" },
		{ name: "underReview", value: underReviewCount, fill: "var(--color-underReview)" },
	];

	const donutConfig = {
		value: {
			label: "Applicants",
		},
		verified: {
			label: "Verified",
			color: "var(--success-foreground)",
		},
		pending: {
			label: "Pending",
			color: "var(--primary)",
		},
		flagged: {
			label: "Flagged",
			color: "var(--destructive)",
		},
		underReview: {
			label: "Under Review",
			color: "var(--primary)",
		},
	} satisfies ChartConfig;

	// Bar chart config and data
	const barData = [
		{ label: "BSBA", verified: Math.min(verifiedCount, 12), pending: Math.min(pendingCount, 8) },
		{ label: "BSIT", verified: Math.min(verifiedCount, 10), pending: Math.min(pendingCount, 6) },
		{ label: "BSHM", verified: Math.min(verifiedCount, 4), pending: Math.min(pendingCount, 5) },
		{ label: "BSTM", verified: Math.min(verifiedCount, 6), pending: Math.min(pendingCount, 4) },
	];

	const barConfig = {
		verified: {
			label: "Verified",
			color: "var(--success-foreground)",
		},
		pending: {
			label: "Pending",
			color: "var(--color-chart-2)",
		},
	} satisfies ChartConfig;

	// 3. Recent activity list from audit logs
	const recentActivities = auditLogs.slice(0, 5);

	const formatTimeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	};

	return (
		<div className="w-full flex flex-col gap-8 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
			{/* Page Title */}
			<div>
				<h1 className="text-2xl font-semibold text-foreground leading-[35px]">Dashboard</h1>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				{[
					{ label: "Total Applicants", value: totalApplicants },
					{ label: "Pending Review", value: pendingCount },
					{ label: "Verified", value: verifiedCount },
					{ label: "Flagged", value: flaggedCount },
				].map((card, i) => (
					<Card key={i} className="shadow-sm">
						<CardHeader className="pb-2">
							<CardDescription className="text-sm font-semibold text-muted-foreground">
								{card.label}
							</CardDescription>
						</CardHeader>
						<CardContent className="pb-4">
							<p className="text-4xl font-bold text-foreground tracking-tight">{card.value}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Breakdown and Insights row */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Circular Application Breakdown */}
				<Card className="lg:col-span-5 shadow-sm h-[290px] flex flex-col">
					<CardHeader className="pb-0">
						<CardTitle className="text-base font-semibold text-foreground">Application Breakdown</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center justify-between gap-6 flex-1 py-4">
						{/* Recharts Pie Chart in ChartContainer */}
						<div className="relative w-36 h-36 shrink-0">
							<ChartContainer config={donutConfig} className="w-full h-full aspect-square">
								<PieChart>
									<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
									<Pie
										data={donutData}
										dataKey="value"
										nameKey="name"
										innerRadius={48}
										outerRadius={64}
										strokeWidth={2}
										stroke="var(--card)"
									>
										{donutData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.fill} />
										))}
									</Pie>
								</PieChart>
							</ChartContainer>
							<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
								<span className="text-2xl font-bold text-foreground">{totalApplicants}</span>
								<span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total</span>
							</div>
						</div>

						{/* Legend */}
						<div className="flex flex-col gap-2 flex-1 justify-center">
							{[
								{ label: "Verified", color: "bg-success-foreground", val: verifiedCount },
								{ label: "Pending", color: "bg-amber-500", val: pendingCount },
								{ label: "Flagged", color: "bg-destructive", val: flaggedCount },
								{ label: "Under Review", color: "bg-primary", val: underReviewCount },
							].map((legend, idx) => (
								<div key={idx} className="flex items-center justify-between text-sm">
									<div className="flex items-center gap-2">
										<span className={`w-3 h-3 rounded-full ${legend.color}`} />
										<span className="text-muted-foreground text-xs">{legend.label}</span>
									</div>
									<span className="font-semibold text-foreground text-xs">{legend.val}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Column Chart Insights */}
				<Card className="lg:col-span-7 shadow-sm h-[290px] flex flex-col">
					<CardHeader className="pb-0">
						<CardTitle className="text-base font-semibold text-foreground">Application Insights</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col flex-1 py-4">
						{/* Recharts Bar Chart in ChartContainer */}
						<div className="flex-1 h-[140px]">
							<ChartContainer config={barConfig} className="w-full h-full">
								<BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
									<CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
									<XAxis
										dataKey="label"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										tick={{ fill: "var(--muted-foreground)" }}
									/>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar dataKey="verified" fill="var(--color-verified)" radius={[4, 4, 0, 0]} maxBarSize={28} />
									<Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} maxBarSize={28} />
								</BarChart>
							</ChartContainer>
						</div>
						<div className="flex justify-center gap-6 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-3 shrink-0">
							<div className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 bg-success-foreground rounded-sm" />
								<span>Verified</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 bg-amber-400 rounded-sm" />
								<span>Pending</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity Card */}
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="text-base font-semibold text-foreground">Recent Activity</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{recentActivities.length > 0 ? (
						recentActivities.map((log) => (
							<div
								key={log.id}
								className="flex items-start justify-between border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
							>
								<div className="flex flex-col gap-1">
									<p className="text-sm text-foreground">
										<span className="font-semibold">{log.actor.name}</span>{" "}
										<span className="text-muted-foreground">
											{log.action === "VERIFIED"
												? "verified application for"
												: log.action === "FLAGGED"
													? "flagged application for"
													: log.action === "REJECTED"
														? "rejected application for"
														: "reviewed application for"}{" "}
										</span>
										<span className="font-semibold text-primary">
											{log.application.student.name}
										</span>{" "}
										<span className="text-xs text-muted-foreground">
											({log.application.referenceNo})
										</span>
									</p>
									{log.note && (
										<p className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded border border-border/20 self-start">
											Note: {log.note}
										</p>
									)}
								</div>
								<span className="text-xs text-muted-foreground shrink-0 ml-4 font-medium">
									{formatTimeAgo(log.createdAt)}
								</span>
							</div>
						))
					) : (
						<div className="text-center py-6 text-sm text-muted-foreground">
							No recent activity recorded.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
