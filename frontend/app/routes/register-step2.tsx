import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, redirect } from "react-router";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type Step1Values, type Step2Values, step2Schema } from "@/shared/lib/schemas/registration";
import { readRegistration, writeRegistration } from "@/shared/lib/storage";
import { useSignUpEmail } from "@/shared/services/queries/auth";
import { LoadingFallback } from "@/shared/components/LoadingFallback";
import { FormActions } from "@/routes/register/FormActions";
import { FormHeader } from "@/routes/register/FormHeader";
import { PasswordField } from "@/components/ui/password-field";
import type { Route } from "./+types/register-step2";

export function meta() {
	return [
		{ title: "Register - Account Details" },
		{
			name: "description",
			content: "Create your account - Account credentials",
		},
	];
}

export async function clientLoader() {
	const parsed = readRegistration();
	if (!parsed.firstName || !parsed.lastName || !parsed.studentNumber) {
		throw redirect("/register");
	}
	return parsed;
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Verifying details..." />;
}

export default function RegisterStep2({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();
	const signUp = useSignUpEmail();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<Step2Values>({
		resolver: zodResolver(step2Schema),
		defaultValues: loaderData || undefined,
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
			className="mx-auto flex w-full max-w-[512px] flex-col items-start gap-8"
		>
			<FormHeader
				id="step2-heading"
				title="Create your account"
				description="Enter your login details"
			/>

			{errors.root?.message ? (
				<div className="w-full rounded-lg border border-red-200 bg-red-500/10 p-3 text-sm text-red-700">
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
