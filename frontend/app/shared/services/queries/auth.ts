import { useMutation } from "@tanstack/react-query";
import { signUpEmail } from "~/shared/services/auth.api";

export const authKeys = {
	all: ["auth"] as const,
};

export function useSignUpEmail() {
	return useMutation({
		mutationFn: async (variables: Parameters<typeof signUpEmail>[0]) => {
			const result = await signUpEmail(variables);
			if (!result.success && result.error) {
				throw new Error(result.error);
			}
			return result;
		},
	});
}
