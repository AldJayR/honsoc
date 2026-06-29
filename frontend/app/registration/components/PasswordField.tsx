import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { INPUT_CLASS } from "~/shared/lib/constants";

interface PasswordFieldProps {
	id: string;
	label: string;
	placeholder?: string;
	error?: string;
	register: UseFormRegisterReturn;
	labelRight?: React.ReactNode;
}

export function PasswordField({
	id,
	label,
	placeholder = "************",
	error,
	register,
	labelRight,
}: PasswordFieldProps) {
	const [visible, setVisible] = useState(false);

	return (
		<Field className="w-full" data-invalid={!!error}>
			<div className="flex justify-between items-center w-full mb-1">
				<FieldLabel htmlFor={id} className="text-sm font-medium text-foreground">
					{label}
				</FieldLabel>
				{labelRight}
			</div>
			<div className="relative w-full">
				<Input
					id={id}
					type={visible ? "text" : "password"}
					placeholder={placeholder}
					className={cn(INPUT_CLASS, "pr-10")}
					{...register}
				/>
				<button
					type="button"
					onClick={() => setVisible((prev) => !prev)}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer select-none p-1"
					aria-label={visible ? "Hide password" : "Show password"}
				>
					{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>
			{error && <FieldError className="text-xs mt-0.5">{error}</FieldError>}
		</Field>
	);
}
