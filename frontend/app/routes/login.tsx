import { LoginPage } from "~/registration/components/LoginPage";

export function meta() {
	return [
		{ title: "Login - NEUST Honor Society" },
		{
			name: "description",
			content: "Login to your NEUST Honor Society account",
		},
	];
}

export default function LoginRoute() {
	return <LoginPage />;
}
