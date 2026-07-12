import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
			<div className="flex items-center justify-between w-full mb-1">
				<FieldLabel
					htmlFor={id}
					className="type-label"
				>
					{label}
				</FieldLabel>
				{labelRight}
			</div>
			<div className="relative w-full">
				<Input
					id={id}
					type={visible ? "text" : "password"}
					placeholder={placeholder}
					className="pr-8"
					{...register}
				/>
				<button
					type="button"
					onClick={() => setVisible((prev) => !prev)}
					className="absolute p-1 transition-colors -translate-y-1/2 cursor-pointer select-none right-3 top-1/2 text-muted-foreground hover:text-primary"
					aria-label={visible ? "Hide password" : "Show password"}
				>
					{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>
			{error ? (
				<FieldError className="type-caption mt-0.5">{error}</FieldError>
			) : null}
		</Field>
	);
}
