interface FormHeaderProps {
	title: string;
	description: string;
}

export function FormHeader({ title, description }: FormHeaderProps) {
	return (
		<div className="[word-break:break-word] flex flex-col items-center justify-center leading-normal text-center tracking-normal w-full">
			<h2 className="font-sans font-semibold text-lg leading-7 text-foreground select-none">
				{title}
			</h2>
			<p className="font-sans font-light text-xs leading-4 text-brand-muted mt-1 select-none">
				{description}
			</p>
		</div>
	);
}
