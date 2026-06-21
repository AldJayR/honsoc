import { Outlet } from "react-router";
import { RegistrationLayout } from "~/components/RegistrationLayout";

export default function RegistrationLayoutRoute() {
	return (
		<RegistrationLayout>
			<Outlet />
		</RegistrationLayout>
	);
}
