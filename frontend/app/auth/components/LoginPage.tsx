import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { INPUT_CLASS } from "~/shared/lib/constants";
import { useSignInEmail } from "~/shared/services/queries/auth";
import { PasswordField } from "~/register/components/PasswordField";

const loginSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
	const navigate = useNavigate();
	const signIn = useSignInEmail();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
	});

	const onSubmit = async (data: LoginValues) => {
		await signIn.mutateAsync(
			{
				email: data.email,
				password: data.password,
			},
			{
				onSuccess: () => {
					toast.success("Successfully logged in!");
					navigate("/portal");
				},
				onError: (err) => {
					toast.error(
						err.message || "Failed to log in. Please check your credentials.",
					);
				},
			},
		);
	};

	return (
		<div className="w-full max-w-[512px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-6 items-start w-full"
			>
				<div className="flex flex-col items-center justify-center w-full mb-2">
					<h2 className="font-sans font-semibold text-lg leading-7 text-black text-center select-none">
						Login to your account
					</h2>
				</div>

				<div className="flex flex-col gap-4 items-start justify-center w-full">
					{/* Email Input */}
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
							placeholder="you@example.com"
							className={INPUT_CLASS}
							{...register("email")}
						/>
						{errors.email && (
							<FieldError className="text-xs mt-0.5">
								{errors.email.message}
							</FieldError>
						)}
					</Field>

					{/* Password Input */}
					<PasswordField
						id="password"
						label="Password"
						placeholder="************"
						error={errors.password?.message}
						register={register("password")}
						labelRight={
							<Link
								to="/forgot-password"
								className="text-xs text-black hover:underline hover:text-brand-primary transition-colors cursor-pointer"
							>
								Forgot Password?
							</Link>
						}
					/>

					{/* Remember Me */}
					<div className="flex items-center gap-2 select-none mt-1">
						<Checkbox
							id="rememberMe"
							{...register("rememberMe", { setValueAs: (v) => !!v })}
						/>
						<label
							htmlFor="rememberMe"
							className="text-sm font-medium text-foreground cursor-pointer"
						>
							Remember me
						</label>
					</div>
				</div>

				<div className="flex flex-col gap-3 items-center w-full mt-4">
					<Button
						type="submit"
						disabled={signIn.isPending}
						className="bg-brand-primary-dark hover:bg-brand-primary text-primary-foreground font-medium text-base leading-6 h-[36px] px-3 rounded-lg flex items-center justify-center shadow-md cursor-pointer w-full transition-all duration-200 active:scale-[0.98]"
					>
						{signIn.isPending ? "Logging in..." : "Login"}
					</Button>

					<div className="text-center mt-2">
						<span className="text-xs font-normal text-black mr-1">
							Not yet registered?
						</span>
						<Link
							to="/register"
							className="text-xs font-semibold text-brand-primary hover:underline"
						>
							Apply for membership
						</Link>
					</div>
				</div>
			</form>
		</div>
	);
}
