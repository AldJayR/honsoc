import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { INPUT_CLASS } from "~/shared/lib/constants";
import {
	type Step1Values,
	step1Schema,
} from "~/shared/lib/schemas/registration";
import { writeRegistration } from "~/shared/lib/storage";
import { FormActions } from "./FormActions";
import { FormHeader } from "./FormHeader";

interface Step1PageProps {
	defaultValues?: Partial<Step1Values>;
}

export function Step1Page({ defaultValues }: Step1PageProps) {
	const navigate = useNavigate();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<Step1Values>({
		resolver: zodResolver(step1Schema),
		defaultValues,
	});

	const onSubmit = (data: Step1Values) => {
		writeRegistration(data as unknown as Record<string, string>);
		navigate("/register/step2");
	};

	return (
		<div className="w-full max-w-[512px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
			<form
				onSubmit={handleSubmit(onSubmit)}
				aria-labelledby="step1-heading"
				className="flex flex-col gap-8 items-start"
			>
				<div id="step1-heading" className="w-full">
					<FormHeader
						title="Create your account"
						description="Your student number will be verified against your COR during application review."
					/>
				</div>

				<div className="flex flex-col gap-4 items-start justify-center w-full">
					<div className="flex gap-4 items-start w-full">
						<Field className="flex-1" data-invalid={!!errors.firstName}>
							<FieldLabel
								htmlFor="firstName"
								className="text-sm font-medium text-foreground"
							>
								First Name
							</FieldLabel>
							<Input
								id="firstName"
								placeholder="e.g., Juan"
								className={INPUT_CLASS}
								{...register("firstName")}
							/>
							{errors.firstName && (
								<FieldError className="text-xs mt-0.5">
									{errors.firstName.message}
								</FieldError>
							)}
						</Field>

						<Field className="flex-1">
							<FieldLabel
								htmlFor="middleName"
								className="text-sm font-medium text-foreground"
							>
								Middle Name
							</FieldLabel>
							<Input
								id="middleName"
								placeholder="e.g., Santos"
								className={INPUT_CLASS}
								{...register("middleName")}
							/>
						</Field>
					</div>

					<div className="flex gap-4 items-start w-full">
						<Field className="flex-1" data-invalid={!!errors.lastName}>
							<FieldLabel
								htmlFor="lastName"
								className="text-sm font-medium text-foreground"
							>
								Last Name
							</FieldLabel>
							<Input
								id="lastName"
								placeholder="e.g., Dela Cruz"
								className={INPUT_CLASS}
								{...register("lastName")}
							/>
							{errors.lastName && (
								<FieldError className="text-xs mt-0.5">
									{errors.lastName.message}
								</FieldError>
							)}
						</Field>

						<Field className="flex-1">
							<FieldLabel
								htmlFor="middleInitial"
								className="text-sm font-medium text-foreground"
							>
								Middle Initial
							</FieldLabel>
							<Input
								id="middleInitial"
								placeholder="e.g., S"
								className={INPUT_CLASS}
								{...register("middleInitial")}
							/>
						</Field>
					</div>

					<Field className="w-full" data-invalid={!!errors.studentNumber}>
						<FieldLabel
							htmlFor="studentNumber"
							className="text-sm font-medium text-foreground"
						>
							Student Number
						</FieldLabel>
						<Input
							id="studentNumber"
							placeholder="SUM2023-12345"
							className={INPUT_CLASS}
							{...register("studentNumber")}
						/>
						{errors.studentNumber && (
							<FieldError className="text-xs mt-0.5">
								{errors.studentNumber.message}
							</FieldError>
						)}
					</Field>
				</div>

				<FormActions />
			</form>
		</div>
	);
}
