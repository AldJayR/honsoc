import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signInEmail, signUpEmail } from "~/shared/services/auth.api";

export const authKeys = {
	all: ["auth"] as const,
};

export function useSignUpEmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: signUpEmail,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authKeys.all });
		},
	});
}

export function useSignInEmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: signInEmail,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authKeys.all });
		},
	});
}
