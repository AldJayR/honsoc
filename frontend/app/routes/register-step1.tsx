import { ArrowRight, Loader2 } from "lucide-react";
import { Form, Link, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import type { Route } from "./+types/register-step1";

export function meta() {
	return [
		{ title: "Register - NEUST Honor Society" },
		{ name: "description", content: "Create your account - Personal details" },
	];
}

// Client Loader: runs in the browser before hydration to load values from storage
export async function clientLoader() {
	try {
		const saved = sessionStorage.getItem("honsoc_registration");
		return saved ? JSON.parse(saved) : {};
	} catch (e) {
		console.error("Error reading from sessionStorage", e);
		return {};
	}
}
clientLoader.hydrate = true;

// Fallback to display while data is loading during hydration
export function HydrateFallback() {
	return (
		<div className="w-full max-w-[512px] mx-auto min-h-[300px] flex flex-col items-center justify-center gap-3 select-none">
			<Loader2 className="size-8 animate-spin text-brand-primary" />
			<p className="text-[14px] font-medium text-brand-muted">
				Loading details...
			</p>
		</div>
	);
}

// Client Action: handles form submission, validation, data caching, and redirects
export async function clientAction({ request }: Route.ClientActionArgs) {
	const formData = await request.formData();
	const values = {
		firstName: (formData.get("firstName") as string) || "",
		middleName: (formData.get("middleName") as string) || "",
		lastName: (formData.get("lastName") as string) || "",
		middleInitial: (formData.get("middleInitial") as string) || "",
		studentNumber: (formData.get("studentNumber") as string) || "",
	};

	// Validation
	const errors: Record<string, string> = {};
	if (!values.firstName.trim()) {
		errors.firstName = "First name is required";
	}
	if (!values.lastName.trim()) {
		errors.lastName = "Last name is required";
	}
	if (!values.studentNumber.trim()) {
		errors.studentNumber = "Student number is required";
	} else if (!/^[A-Z0-9-]{3,20}$/i.test(values.studentNumber.trim())) {
		errors.studentNumber = "Invalid student number format (e.g. SUM2023-12345)";
	}

	if (Object.keys(errors).length > 0) {
		return { errors, values };
	}

	// Save values
	try {
		const currentSaved = sessionStorage.getItem("honsoc_registration") || "{}";
		const merged = { ...JSON.parse(currentSaved), ...values };
		sessionStorage.setItem("honsoc_registration", JSON.stringify(merged));
	} catch (e) {
		console.error("Error saving step 1 progress", e);
	}

	return redirect("/register/step2");
}

export default function RegisterStep1({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const defaultValues = actionData?.values || loaderData || {};
	const errors = actionData?.errors || {};

	return (
		<div className="w-full max-w-[512px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
			<Form method="post" className="flex flex-col gap-[32px] items-start">
				{/* Header titles */}
				<div className="[word-break:break-word] flex flex-col items-center justify-center leading-normal text-center tracking-normal w-full">
					<h2 className="font-sans font-semibold text-[18px] leading-7 text-black dark:text-white select-none">
						Create your account
					</h2>
					<p className="font-sans font-light text-[12px] leading-4 text-brand-muted mt-1 select-none">
						Your student number will be verified against your COR during
						application review.
					</p>
				</div>

				{/* Input fields grid */}
				<div className="flex flex-col gap-[16px] items-start justify-center w-full">
					{/* Row 1: First Name & Middle Name */}
					<div className="flex gap-[16px] items-start w-full">
						<Field className="flex-1" data-invalid={!!errors.firstName}>
							<FieldLabel
								htmlFor="firstName"
								className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
							>
								First Name
							</FieldLabel>
							<Input
								id="firstName"
								name="firstName"
								defaultValue={defaultValues.firstName}
								placeholder="Maria"
								className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px]"
							/>
							{errors.firstName && (
								<FieldError className="text-[12px] mt-0.5">
									{errors.firstName}
								</FieldError>
							)}
						</Field>

						<Field className="flex-1">
							<FieldLabel
								htmlFor="middleName"
								className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
							>
								Middle Name
							</FieldLabel>
							<Input
								id="middleName"
								name="middleName"
								defaultValue={defaultValues.middleName}
								placeholder="Maria"
								className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px]"
							/>
						</Field>
					</div>

					{/* Row 2: Last Name & Middle Initial */}
					<div className="flex gap-[16px] items-start w-full">
						<Field className="flex-1" data-invalid={!!errors.lastName}>
							<FieldLabel
								htmlFor="lastName"
								className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
							>
								Last Name
							</FieldLabel>
							<Input
								id="lastName"
								name="lastName"
								defaultValue={defaultValues.lastName}
								placeholder="Maria"
								className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px]"
							/>
							{errors.lastName && (
								<FieldError className="text-[12px] mt-0.5">
									{errors.lastName}
								</FieldError>
							)}
						</Field>

						<Field className="flex-1">
							<FieldLabel
								htmlFor="middleInitial"
								className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
							>
								Middle Initial
							</FieldLabel>
							<Input
								id="middleInitial"
								name="middleInitial"
								defaultValue={defaultValues.middleInitial}
								placeholder="Maria"
								className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px]"
							/>
						</Field>
					</div>

					{/* Row 3: Student Number */}
					<Field className="w-full" data-invalid={!!errors.studentNumber}>
						<FieldLabel
							htmlFor="studentNumber"
							className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
						>
							Student Number
						</FieldLabel>
						<Input
							id="studentNumber"
							name="studentNumber"
							defaultValue={defaultValues.studentNumber}
							placeholder="SUM2023-12345"
							className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px]"
						/>
						{errors.studentNumber && (
							<FieldError className="text-[12px] mt-0.5">
								{errors.studentNumber}
							</FieldError>
						)}
					</Field>
				</div>

				{/* Footer controls */}
				<div className="flex items-center justify-between py-[8px] w-full mt-4 select-none">
					<Link
						to="/"
						className="text-[12px] font-normal leading-4 text-black dark:text-zinc-200 underline hover:text-brand-primary transition-colors whitespace-nowrap"
					>
						Already have an account?
					</Link>

					<Button
						type="submit"
						className="bg-brand-primary-dark hover:bg-[#4d3200] text-primary-foreground font-medium text-[14px] leading-5 tracking-normal h-[32px] w-[113px] rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
					>
						Continue
						<ArrowRight className="size-4 shrink-0" />
					</Button>
				</div>
			</Form>
		</div>
	);
}
