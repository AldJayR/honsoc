import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
	label: string;
}

export function LoadingFallback({ label }: LoadingFallbackProps) {
	return (
		<div
			className="w-full max-w-[512px] mx-auto min-h-[300px] flex flex-col items-center justify-center gap-3 select-none"
			aria-live="polite"
		>
			<Loader2 className="size-8 animate-spin text-brand-primary" />
			<p className="text-sm font-medium text-brand-muted">{label}</p>
		</div>
	);
}
