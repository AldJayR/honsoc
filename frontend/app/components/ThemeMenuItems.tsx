import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ThemeProvider";

const themeOptions = [
	{ value: "light" as const, label: "Light", icon: Sun },
	{ value: "dark" as const, label: "Dark", icon: Moon },
	{ value: "system" as const, label: "System", icon: Monitor },
];

export function ThemeMenuItems() {
	const { theme, setTheme } = useTheme();

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuLabel>Appearance</DropdownMenuLabel>
				{themeOptions.map(({ value, label, icon: Icon }) => (
					<DropdownMenuItem key={value} onClick={() => setTheme(value)}>
						<Icon />
						<span>{label}</span>
						{theme === value ? <Check className="ml-auto" /> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuGroup>
		</>
	);
}
