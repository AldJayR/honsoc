import { HomePage } from "~/home/components/HomePage";

export function meta() {
	return [
		{ title: "NEUST Honor Society System" },
		{
			name: "description",
			content: "Welcome to the NEUST Honor Society System",
		},
	];
}

export default function Home() {
	return <HomePage />;
}
