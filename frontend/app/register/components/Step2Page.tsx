import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
	type Step1Values,
	type Step2Values,
	step2Schema,
} from "~/shared/lib/schemas/registration";
import { readRegistration, writeRegistration } from "~/shared/lib/storage";
import { useSignUpEmail } from "~/shared/services/queries/auth";
import { FormActions } from "./FormActions";
import { FormHeader } from "./FormHeader";
import { PasswordField } from "./PasswordField";

interface Step2PageProps {
	defaultValues?: Partial<Step2Values>;
}

export function Step2Page({ defaultValues }: Step2PageProps) {
	const navigate = useNavigate();
	const signUp = useSignUpEmail();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<Step2Values>({
		resolver: zodResolver(step2Schema),
		defaultValues,
	});

	const onSubmit = async (data: Step2Values) => {
		const step1: Partial<Step1Values> = readRegistration();

		await signUp.mutateAsync(
			{
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
			},
			{
				onSuccess: () => {
					writeRegistration({ ...step1, ...data });
					navigate("/register/verify", { replace: true });
				},
				onError: (error) => {
					setError("root", { message: error.message });
				},
			},
		);
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			aria-labelledby="step2-heading"
			className="w-full max-w-[512px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start gap-8"
		>
			<FormHeader
				id="step2-heading"
				title="Create your account"
				description="Enter your login details"
			/>

			{errors.root?.message ? (
				<div className="w-full p-3 text-sm text-red-700 border border-red-200 bg-red-500/10 rounded-xl">
					{errors.root.message}
				</div>
			) : null}

			<div className="flex flex-col items-start justify-center w-full gap-4">
				<Field className="w-full" data-invalid={!!errors.email}>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						{...register("email")}
					/>
					{errors.email ? (
						<FieldError className="text-xs mt-0.5">
							{errors.email.message}
						</FieldError>
					) : null}
				</Field>

				<PasswordField
					id="password"
					label="Password"
					placeholder="Enter your password"
					error={errors.password?.message}
					register={register("password")}
				/>

				<p className="type-caption text-muted-foreground">
					Password must be at least 8 characters long.
				</p>

				<PasswordField
					id="confirmPassword"
					label="Confirm Password"
					placeholder="Re-enter your password"
					error={errors.confirmPassword?.message}
					register={register("confirmPassword")}
				/>
			</div>

			<FormActions isPending={signUp.isPending} />
		</form>
	);
}
