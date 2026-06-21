import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Form, Link, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
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

// Client Loader: runs on the client to retrieve cached details, enforcing guard rules
export async function clientLoader() {
	try {
		const saved = sessionStorage.getItem("honsoc_registration");
		if (!saved) {
			return redirect("/register");
		}
		const parsed = JSON.parse(saved);
		if (!parsed.firstName || !parsed.lastName || !parsed.studentNumber) {
			return redirect("/register");
		}
		return parsed;
	} catch (e) {
		console.error("Error reading step 2 data", e);
		return redirect("/register");
	}
}
clientLoader.hydrate = true;

// Hydrate fallback display
export function HydrateFallback() {
	return (
		<div className="w-full max-w-[512px] mx-auto min-h-[300px] flex flex-col items-center justify-center gap-3 select-none">
			<Loader2 className="size-8 animate-spin text-brand-primary" />
			<p className="text-[14px] font-medium text-brand-muted">
				Verifying details...
			</p>
		</div>
	);
}

// Client Action: validates and saves credentials
export async function clientAction({ request }: Route.ClientActionArgs) {
	const formData = await request.formData();
	const values = {
		email: (formData.get("email") as string) || "",
		password: (formData.get("password") as string) || "",
		confirmPassword: (formData.get("confirmPassword") as string) || "",
	};

	// Validation
	const errors: Record<string, string> = {};
	if (!values.email.trim()) {
		errors.email = "Email is required";
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
		errors.email = "Please enter a valid email address";
	}

	if (!values.password) {
		errors.password = "Password is required";
	} else if (values.password.length < 8) {
		errors.password = "Password must be at least 8 characters long";
	}

	if (!values.confirmPassword) {
		errors.confirmPassword = "Confirm password is required";
	} else if (values.password !== values.confirmPassword) {
		errors.confirmPassword = "Passwords do not match";
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
		console.error("Error saving step 2 progress", e);
	}

	return redirect("/register/verify");
}

export default function RegisterStep2({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const defaultValues = actionData?.values || loaderData || {};
	const errors = actionData?.errors || {};

	// Password visibility state (pure visual presentation state)
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	return (
		<div className="w-full max-w-[512px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
			<Form method="post" className="flex flex-col gap-[32px] items-start">
				{/* Header titles */}
				<div className="[word-break:break-word] flex flex-col items-center justify-center leading-normal text-center tracking-normal w-full">
					<h2 className="font-sans font-semibold text-[18px] leading-7 text-black dark:text-white select-none">
						Create your account
					</h2>
					<p className="font-sans font-light text-[12px] leading-4 text-brand-muted mt-1 select-none">
						Enter your login details
					</p>
				</div>

				{/* Form Fields */}
				<div className="flex flex-col gap-[16px] items-start justify-center w-full">
					{/* Email Field */}
					<Field className="w-full" data-invalid={!!errors.email}>
						<FieldLabel
							htmlFor="email"
							className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
						>
							Email
						</FieldLabel>
						<Input
							id="email"
							name="email"
							type="email"
							defaultValue={defaultValues.email}
							placeholder="amldaldm@gmail.com"
							className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px]"
						/>
						{errors.email && (
							<FieldError className="text-[12px] mt-0.5">
								{errors.email}
							</FieldError>
						)}
					</Field>

					{/* Password Field */}
					<Field className="w-full" data-invalid={!!errors.password}>
						<FieldLabel
							htmlFor="password"
							className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
						>
							Password
						</FieldLabel>
						<div className="relative w-full">
							<Input
								id="password"
								name="password"
								type={showPassword ? "text" : "password"}
								defaultValue={defaultValues.password}
								placeholder="************"
								className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px] pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer select-none p-1"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? (
									<EyeOff className="size-4" />
								) : (
									<Eye className="size-4" />
								)}
							</button>
						</div>
						{errors.password && (
							<FieldError className="text-[12px] mt-0.5">
								{errors.password}
							</FieldError>
						)}
					</Field>

					{/* Confirm Password Field */}
					<Field className="w-full" data-invalid={!!errors.confirmPassword}>
						<FieldLabel
							htmlFor="confirmPassword"
							className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200"
						>
							Confirm Password
						</FieldLabel>
						<div className="relative w-full">
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								defaultValue={defaultValues.confirmPassword}
								placeholder="************"
								className="h-[36px] rounded-lg border-brand-border bg-white dark:bg-zinc-900 shadow-sm focus:border-brand-primary placeholder:text-brand-muted text-[16px] pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword((prev) => !prev)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer select-none p-1"
								aria-label={
									showConfirmPassword ? "Hide password" : "Show password"
								}
							>
								{showConfirmPassword ? (
									<EyeOff className="size-4" />
								) : (
									<Eye className="size-4" />
								)}
							</button>
						</div>
						{errors.confirmPassword && (
							<FieldError className="text-[12px] mt-0.5">
								{errors.confirmPassword}
							</FieldError>
						)}
					</Field>
				</div>

				{/* Footer Controls */}
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
