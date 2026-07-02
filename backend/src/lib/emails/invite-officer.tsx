import { Button, Heading, Text } from "react-email";
import { BaseLayout } from "./base-layout.tsx";

interface InviteOfficerProps {
	userName: string;
	url: string;
}

export function InviteOfficer({ userName, url }: InviteOfficerProps) {
	return (
		<BaseLayout previewText="You've been invited to NHSVS">
			<Heading as="h1" className="text-2xl font-bold text-gray-800 mb-4">
				You've been invited
			</Heading>
			<Text className="text-gray-600 mb-2">
				Hi {userName},
			</Text>
			<Text className="text-gray-600 mb-6">
				The NEUST Honor Society president has created an officer account for you. Click below to set your password and activate your account.
			</Text>
			<Button
				href={url}
				className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center block w-full"
			>
				Set Up Your Account
			</Button>
			<Text className="text-gray-400 text-sm mt-6">
				This link expires in 7 days. If you believe this was a mistake, contact the NHSVS president.
			</Text>
		</BaseLayout>
	);
}
