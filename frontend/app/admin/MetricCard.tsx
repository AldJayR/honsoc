import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";

interface MetricCardProps {
	label: string;
	value: ReactNode;
}

export function MetricCard({ label, value }: MetricCardProps) {
	return (
		<Card className="shadow-sm">
			<CardHeader className="pb-2">
				<CardDescription className="text-sm font-semibold text-muted-foreground">
					{label}
				</CardDescription>
			</CardHeader>
			<CardContent className="pb-4">
				<p className="text-4xl font-bold tracking-tight text-foreground">
					{value}
				</p>
			</CardContent>
		</Card>
	);
}
