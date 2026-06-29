import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signUpEmail, signInEmail } from "~/shared/services/auth.api";

export const authKeys = {
	all: ["auth"] as const,
};

export function useSignUpEmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (variables: Parameters<typeof signUpEmail>[0]) => {
			const result = await signUpEmail(variables);
			if (!result.success && result.error) {
				throw new Error(result.error);
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authKeys.all });
		},
	});
}

export function useSignInEmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (variables: Parameters<typeof signInEmail>[0]) => {
			const result = await signInEmail(variables);
			if (!result.success && result.error) {
				throw new Error(result.error);
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authKeys.all });
		},
	});
}

