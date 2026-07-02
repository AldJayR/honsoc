import { Button, Heading, Text } from "react-email";
import { BaseLayout } from "./base-layout.tsx";

interface VerifyEmailProps {
	userName: string;
	url: string;
}

export function VerifyEmail({ userName, url }: VerifyEmailProps) {
	return (
		<BaseLayout previewText="Verify your email address">
			<Heading as="h1" className="text-2xl font-bold text-gray-800 mb-4">
				Verify your email
			</Heading>
			<Text className="text-gray-600 mb-6">
				Hi {userName}, please verify your email address to activate your NHSVS account.
			</Text>
			<Button
				href={url}
				className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center block w-full"
			>
				Verify Email Address
			</Button>
			<Text className="text-gray-400 text-sm mt-6">
				This link expires in 24 hours. If you did not create an account, you can ignore this email.
			</Text>
		</BaseLayout>
	);
}
