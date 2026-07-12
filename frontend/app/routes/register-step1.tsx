import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type Step1Values, step1Schema } from "@/shared/lib/schemas/registration";
import { readRegistration, writeRegistration } from "@/shared/lib/storage";
import { LoadingFallback } from "@/shared/components/LoadingFallback";
import { FormActions } from "@/routes/register/FormActions";
import { FormHeader } from "@/routes/register/FormHeader";
import type { Route } from "./+types/register-step1";

export function meta() {
	return [
		{ title: "Register - NEUST Honor Society" },
		{ name: "description", content: "Create your account - Personal details" },
	];
}

export async function clientLoader() {
	return readRegistration();
}
clientLoader.hydrate = true;

export function HydrateFallback() {
	return <LoadingFallback label="Loading details..." />;
}

export default function RegisterStep1({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<Step1Values>({
		resolver: zodResolver(step1Schema),
		defaultValues: loaderData || undefined,
	});

	const onSubmit = (data: Step1Values) => {
		writeRegistration(data);
		navigate("/register/step2");
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			aria-labelledby="step1-heading"
			className="mx-auto flex w-full max-w-[512px] flex-col items-start gap-8"
		>
			<FormHeader
				id="step1-heading"
				title="Create your account"
				description="Your student number will be verified against your COR during application review."
			/>

			<div className="flex flex-col items-start justify-center w-full gap-4">
				<div className="flex items-start w-full gap-4">
					<Field className="flex-1" data-invalid={!!errors.firstName}>
						<FieldLabel htmlFor="firstName">First Name</FieldLabel>
						<Input
							id="firstName"
							placeholder="e.g., Juan"
							{...register("firstName")}
						/>
						{errors.firstName ? (
							<FieldError className="text-xs mt-0.5">
								{errors.firstName.message}
							</FieldError>
						) : null}
					</Field>

					<Field className="flex-1">
						<FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
						<Input
							id="middleName"
							placeholder="e.g., Santos"
							{...register("middleName")}
						/>
					</Field>
				</div>

				<div className="flex items-start w-full gap-4">
					<Field className="flex-1" data-invalid={!!errors.lastName}>
						<FieldLabel htmlFor="lastName">Last Name</FieldLabel>
						<Input
							id="lastName"
							placeholder="e.g., Dela Cruz"
							{...register("lastName")}
						/>
						{errors.lastName ? (
							<FieldError className="text-xs mt-0.5">
								{errors.lastName.message}
							</FieldError>
						) : null}
					</Field>

					<Field className="flex-1">
						<FieldLabel htmlFor="middleInitial">Middle Initial</FieldLabel>
						<Input
							id="middleInitial"
							placeholder="e.g., S"
							{...register("middleInitial")}
						/>
					</Field>
				</div>

				<Field className="w-full" data-invalid={!!errors.studentNumber}>
					<FieldLabel htmlFor="studentNumber">Student Number</FieldLabel>
					<Input
						id="studentNumber"
						placeholder="SUM2023-12345"
						{...register("studentNumber")}
					/>
					{errors.studentNumber ? (
						<FieldError className="text-xs mt-0.5">
							{errors.studentNumber.message}
						</FieldError>
					) : null}
				</Field>
			</div>

			<FormActions />
		</form>
	);
}
