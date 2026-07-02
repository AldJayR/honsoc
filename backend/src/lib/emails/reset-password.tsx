import { Button, Heading, Text } from "react-email";
import { BaseLayout } from "./base-layout.tsx";

interface ResetPasswordProps {
	userName: string;
	url: string;
}

export function ResetPassword({ userName, url }: ResetPasswordProps) {
	return (
		<BaseLayout previewText="Reset your password">
			<Heading as="h1" className="text-2xl font-bold text-gray-800 mb-4">
				Reset your password
			</Heading>
			<Text className="text-gray-600 mb-6">
				Hi {userName}, we received a request to reset your password for your NHSVS account.
			</Text>
			<Button
				href={url}
				className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center block w-full"
			>
				Reset Password
			</Button>
			<Text className="text-gray-400 text-sm mt-6">
				This link expires in 1 hour. If you did not request a password reset, you can ignore this email.
			</Text>
		</BaseLayout>
	);
}
