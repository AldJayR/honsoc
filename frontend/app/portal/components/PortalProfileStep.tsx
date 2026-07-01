import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "~/components/ui/combobox";
import {
	type ProfileFormValues,
	profileSchema,
} from "~/shared/lib/schemas/portal";
import type { Campus, Department, Major } from "~/shared/services/auth.api";

export type { ProfileFormValues } from "~/shared/lib/schemas/portal";

interface PortalProfileStepProps {
	defaultValues: ProfileFormValues;
	onSubmit: (data: ProfileFormValues) => void;
	schoolYear: string;
	campuses: Campus[];
	departments: Department[];
	majors: Major[];
}

const yearLevels = [
	{ value: "1ST_YEAR", label: "1st Year" },
	{ value: "2ND_YEAR", label: "2nd Year" },
	{ value: "3RD_YEAR", label: "3rd Year" },
	{ value: "4TH_YEAR", label: "4th Year" },
	{ value: "5TH_YEAR", label: "5th Year" },
];

const programsList = [
	"BS in Information Technology",
	"BS in Computer Science",
	"BS in Business Administration",
	"BS in Civil Engineering",
	"BS in Electrical Engineering",
	"BS in Criminology",
	"BS in Education",
];

export function PortalProfileStep({
	defaultValues,
	onSubmit,
	schoolYear,
	campuses,
	departments,
	majors,
}: PortalProfileStepProps) {
	const {
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			...defaultValues,
			academicYear: schoolYear || defaultValues.academicYear || "2025 - 2026",
		},
	});

	const watchedCampusId = watch("campusId");
	const watchedDepartmentId = watch("departmentId");
	const watchedYearLevel = watch("yearLevel");
	const watchedProgram = watch("program");
	const watchedMajorId = watch("majorId");

	const handleFormSubmit = (data: ProfileFormValues) => {
		onSubmit(data);
	};

	return (
		<form
			onSubmit={handleSubmit(handleFormSubmit)}
			className="flex flex-col items-start w-full gap-6 animate-fade-in"
		>
			<p className="select-none type-body-small text-muted-foreground">
				Confirm your student details. These will be cross-checked against your
				COR during verification.
			</p>

			<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
				{/* Campus */}
				<Field className="w-full" data-invalid={!!errors.campusId}>
					<FieldLabel
						htmlFor="campusId"
						className="type-label"
					>
						Campus
					</FieldLabel>
					<Combobox
						value={watchedCampusId}
						onValueChange={(val) => {
							if (val) setValue("campusId", val, { shouldValidate: true });
						}}
					>
						<ComboboxInput
							placeholder="Select campus"
							className="w-full"
						/>
						<ComboboxContent align="start">
							<ComboboxList>
								{campuses.map((c) => (
									<ComboboxItem key={c.id} value={c.id.toString()} className="overflow-hidden text-ellipsis">
										{c.name}
									</ComboboxItem>
								))}
								<ComboboxEmpty>No campus found</ComboboxEmpty>
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
					{errors.campusId ? (
						<FieldError className="type-caption mt-0.5">
							Campus is required
						</FieldError>
					) : null}
				</Field>

				{/* Department */}
				<Field className="w-full" data-invalid={!!errors.departmentId}>
					<FieldLabel
						htmlFor="departmentId"
						className="type-label"
					>
						Department
					</FieldLabel>
					<Combobox
						value={watchedDepartmentId}
						onValueChange={(val) => {
							if (val) setValue("departmentId", val, { shouldValidate: true });
						}}
					>
						<ComboboxInput
							placeholder="Select department"
							className="w-full"
						/>
						<ComboboxContent align="start">
							<ComboboxList>
								{departments.map((d) => (
									<ComboboxItem key={d.id} value={d.id.toString()} className="overflow-hidden text-ellipsis">
										{d.name} ({d.code})
									</ComboboxItem>
								))}
								<ComboboxEmpty>No department found</ComboboxEmpty>
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
					{errors.departmentId ? (
						<FieldError className="type-caption mt-0.5">
							Department is required
						</FieldError>
					) : null}
				</Field>

				{/* Academic Year */}
				<Field className="w-full">
					<FieldLabel
						htmlFor="academicYear"
						className="type-label"
					>
						Academic Year
					</FieldLabel>
					<Input
						id="academicYear"
						value={schoolYear}
						disabled
						className="w-full"
					/>
				</Field>

				{/* Year Level */}
				<Field className="w-full" data-invalid={!!errors.yearLevel}>
					<FieldLabel
						htmlFor="yearLevel"
						className="type-label"
					>
						Year Level
					</FieldLabel>
					<Select
						value={watchedYearLevel}
						onValueChange={(val) => {
							if (val)
								setValue("yearLevel", val as ProfileFormValues["yearLevel"], {
									shouldValidate: true,
								});
						}}
						items={yearLevels}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select year level" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{yearLevels.map((yl) => (
								<SelectItem key={yl.value} value={yl.value} className="overflow-hidden text-ellipsis">
									{yl.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				{/* Program/course */}
				<Field className="w-full" data-invalid={!!errors.program}>
					<FieldLabel
						htmlFor="program"
						className="type-label"
					>
						Program/course
					</FieldLabel>
					<Select
						value={watchedProgram}
						onValueChange={(val) => {
							if (val) setValue("program", val, { shouldValidate: true });
						}}
						items={programsList.map((p) => ({ value: p, label: p }))}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select program" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{programsList.map((p) => (
								<SelectItem key={p} value={p} className="overflow-hidden text-ellipsis">
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.program ? (
						<FieldError className="type-caption mt-0.5">
							Program is required
						</FieldError>
					) : null}
				</Field>

				{/* Major */}
				<Field className="w-full">
					<FieldLabel
						htmlFor="majorId"
						className="type-label"
					>
						Major
					</FieldLabel>
					<Select
						value={watchedMajorId}
						onValueChange={(val) => {
							if (val) setValue("majorId", val, { shouldValidate: true });
						}}
						items={majors.map((m) => ({ value: m.id.toString(), label: m.name }))}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="None" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{majors.map((m) => (
								<SelectItem key={m.id} value={m.id.toString()} className="overflow-hidden text-ellipsis">
									{m.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			</div>

			<Button type="submit" className="self-end mt-4">
				Continue
				<ArrowRight />
			</Button>
		</form>
	);
}
