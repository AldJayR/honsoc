interface FormHeaderProps {
	id?: string;
	title: string;
	description: string;
}

export function FormHeader({ id, title, description }: FormHeaderProps) {
	return (
		<div
			id={id}
			className="flex flex-col items-center justify-center w-full text-center"
		>
			<h2 className="select-none type-h4">
				{title}
			</h2>
			<p className="type-caption text-muted-foreground">
				{description}
			</p>
		</div>
	);
}
