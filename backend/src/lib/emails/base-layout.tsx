import { Container, Head, Html, Preview, Tailwind, Text } from "react-email";

interface BaseLayoutProps {
	previewText: string;
	children: React.ReactNode;
}

export function BaseLayout({ previewText, children }: BaseLayoutProps) {
	return (
		<Html lang="en">
			<Tailwind>
				<Head />
				<Preview>{previewText}</Preview>
				<body className="bg-gray-50 font-sans">
					<Container className="mx-auto py-10 px-4 max-w-lg">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
							{children}
						</div>
						<Text className="text-center text-gray-400 text-xs mt-6">
							NEUST Honor Society Verification System
						</Text>
					</Container>
				</body>
			</Tailwind>
		</Html>
	);
}
