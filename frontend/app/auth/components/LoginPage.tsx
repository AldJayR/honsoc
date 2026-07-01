import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { PasswordField } from "~/register/components/PasswordField";
import { useSignInEmail } from "~/shared/services/queries/auth";

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
					navigate("/portal", { replace: true });
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
				className="flex flex-col items-start w-full gap-6"
			>
				<h2 className="w-full mb-2 text-center select-none type-h4">
					Login to your account
				</h2>

				<div className="flex flex-col items-start justify-center w-full gap-4">
					{/* Email Input */}
					<Field className="w-full" data-invalid={!!errors.email}>
						<FieldLabel
							htmlFor="email"
							className="type-label"
						>
							Email
						</FieldLabel>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							{...register("email")}
						/>
						{errors.email ? (
							<FieldError className="type-caption mt-0.5">
								{errors.email.message}
							</FieldError>
						) : null}
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
								className="transition-colors cursor-pointer type-caption text-foreground hover:underline hover:text-primary"
							>
								Forgot Password?
							</Link>
						}
					/>

					{/* Remember Me */}
					<div className="flex items-center gap-2 mt-1 select-none">
						<Checkbox
							id="rememberMe"
							{...register("rememberMe", { setValueAs: (v) => !!v })}
						/>
						<label
							htmlFor="rememberMe"
							className="cursor-pointer type-label"
						>
							Remember me
						</label>
					</div>
				</div>

				<div className="flex flex-col items-center w-full gap-3 mt-4">
					<Button type="submit" disabled={signIn.isPending} className="w-full">
						{signIn.isPending ? "Logging in..." : "Login"}
					</Button>

					<div className="mt-2 text-center">
						<span className="type-caption">
							Not yet registered?
						</span>
						<Link
							to="/register"
							className="font-semibold type-caption text-primary hover:underline"
						>
							Apply for membership
						</Link>
					</div>
				</div>
			</form>
		</div>
	);
}
