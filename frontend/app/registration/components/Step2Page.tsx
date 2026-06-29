import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { INPUT_CLASS, STORAGE_KEYS } from "~/shared/lib/constants";
import {
	type Step2Values,
	step2Schema,
} from "~/shared/lib/schemas/registration";
import { signUpEmail } from "~/shared/services/auth.api";
import { FormHeader } from "./FormHeader";
import { PasswordField } from "./PasswordField";

interface Step2PageProps {
	defaultValues?: Partial<Step2Values>;
}

export function Step2Page({ defaultValues }: Step2PageProps) {
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<Step2Values>({
		resolver: zodResolver(step2Schema),
		defaultValues,
	});

	const onSubmit = async (data: Step2Values) => {
		let step1: Record<string, string> = {};
		try {
			const saved = sessionStorage.getItem(STORAGE_KEYS.REGISTRATION);
			if (saved) step1 = JSON.parse(saved);
		} catch (e) {
			console.error("Error reading step 1 cache", e);
		}

		const result = await signUpEmail({
			email: data.email,
			password: data.password,
			name:
				`${step1.firstName || ""} ${step1.lastName || ""}`.trim() ||
				"Honor Society Member",
			first_name: step1.firstName || "",
			middle_name: step1.middleName || "",
			middle_initial: step1.middleInitial || "",
			last_name: step1.lastName || "",
			student_number: step1.studentNumber || "",
		});

		if (!result.success && result.error) {
			const message = result.error;
			if (message.toLowerCase().includes("email")) {
				setError("email", { message });
			} else if (message.toLowerCase().includes("password")) {
				setError("password", { message });
			} else {
				setError("email", { message });
			}
			return;
		}

		try {
			const merged = { ...step1, ...data };
			sessionStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify(merged));
		} catch (e) {
			console.error("Error saving step 2 progress", e);
		}

		navigate("/register/verify");
	};

	return (
		<div className="w-full max-w-[512px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
			<form
				onSubmit={handleSubmit(onSubmit)}
				aria-labelledby="step2-heading"
				className="flex flex-col gap-8 items-start"
			>
				<div id="step2-heading">
					<FormHeader
						title="Create your account"
						description="Enter your login details"
					/>
				</div>

				<div className="flex flex-col gap-4 items-start justify-center w-full">
					<Field className="w-full" data-invalid={!!errors.email}>
						<FieldLabel
							htmlFor="email"
							className="text-sm font-medium text-foreground"
						>
							Email
						</FieldLabel>
						<Input
							id="email"
							type="email"
							placeholder="amldaldm@gmail.com"
							className={INPUT_CLASS}
							{...register("email")}
						/>
						{errors.email && (
							<FieldError className="text-xs mt-0.5">
								{errors.email.message}
							</FieldError>
						)}
					</Field>

					<PasswordField
						id="password"
						label="Password"
						error={errors.password?.message}
						register={register("password")}
					/>

					<PasswordField
						id="confirmPassword"
						label="Confirm Password"
						error={errors.confirmPassword?.message}
						register={register("confirmPassword")}
					/>
				</div>

				<div className="flex items-center justify-between py-2 w-full mt-4 select-none">
					<Link
						to="/"
						className="text-xs font-normal leading-4 text-foreground underline hover:text-brand-primary transition-colors whitespace-nowrap"
					>
						Already have an account?
					</Link>

					<Button
						type="submit"
						disabled={isSubmitting}
						aria-busy={isSubmitting}
						className="bg-brand-primary-dark hover:bg-brand-primary-dark text-primary-foreground font-medium text-sm leading-5 tracking-normal h-8 w-[113px] rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? (
							<>
								<span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
								Submitting
							</>
						) : (
							<>
								Continue
								<ArrowRight className="size-4 shrink-0" />
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
