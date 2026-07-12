import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	type ProfileFormValues,
	getRefinedProfileSchema,
	programsByDepartment,
} from "@/shared/lib/schemas/portal";
import type { Campus, Department, Major } from "@/shared/services/auth.api";

export type { ProfileFormValues } from "@/shared/lib/schemas/portal";

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
];


export function PortalProfileStep({
	defaultValues,
	onSubmit,
	schoolYear,
	campuses,
	departments,
	majors,
}: PortalProfileStepProps) {
	const campusItems = campuses.map((c) => ({
		value: c.id.toString(),
		label: c.name,
	}));

	const departmentItems = departments.map((d) => ({
		value: d.id.toString(),
		label: d.name,
	}));

	const stepSchema = getRefinedProfileSchema(departments);

	const {
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<ProfileFormValues>({
		resolver: zodResolver(stepSchema),
		defaultValues: {
			...defaultValues,
			academicYear: schoolYear || defaultValues.academicYear || "2025 - 2026",
		},
	});

	const watchedCampusId = watch("campusId");
	const watchedDepartmentId = watch("departmentId");
	const watchedYearLevel = watch("yearLevel");
	const watchedProgram = watch("program");

	const selectedDept = departments.find((d) => d.id.toString() === watchedDepartmentId);
	const isArchitecture = selectedDept?.code === "ARCH";
	const filteredYearLevels = yearLevels.filter(
		(yl) => yl.value !== "4TH_YEAR" || isArchitecture,
	);
	const filteredPrograms = selectedDept
		? programsByDepartment[selectedDept.code] || []
		: [];
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
						items={campusItems}
						value={campusItems.find((c) => c.value === watchedCampusId) || null}
						onValueChange={(val) => {
							if (val) setValue("campusId", val.value, { shouldValidate: true });
						}}
					>
						<ComboboxInput
							placeholder="Select campus"
							className="w-full"
						/>
						<ComboboxContent align="start">
							<ComboboxList>
								{(item: { value: string; label: string }) => (
									<ComboboxItem key={item.value} value={item} className="overflow-hidden text-ellipsis">
										{item.label}
									</ComboboxItem>
								)}
							</ComboboxList>
							<ComboboxEmpty>No campus found</ComboboxEmpty>
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
						items={departmentItems}
						value={departmentItems.find((d) => d.value === watchedDepartmentId) || null}
						onValueChange={(val) => {
							if (val) {
								setValue("departmentId", val.value, { shouldValidate: true });
								const selectedDept = departments.find((d) => d.id.toString() === val.value);
								if (selectedDept) {
									// Reset yearLevel if not ARCH
									if (selectedDept.code !== "ARCH" && watchedYearLevel === "4TH_YEAR") {
										setValue("yearLevel", "1ST_YEAR", { shouldValidate: true });
									}
									// Reset program if not offered by new department
									setValue("program", "");
								}
							}
						}}
					>
						<ComboboxInput
							placeholder="Select department"
							className="w-full"
						/>
						<ComboboxContent align="start">
							<ComboboxList>
								{(item: { value: string; label: string }) => (
									<ComboboxItem key={item.value} value={item} className="overflow-hidden text-ellipsis">
										{item.label}
									</ComboboxItem>
								)}
							</ComboboxList>
							<ComboboxEmpty>No department found</ComboboxEmpty>
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
						items={filteredYearLevels}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select year level" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{filteredYearLevels.map((yl) => (
								<SelectItem key={yl.value} value={yl.value} className="overflow-hidden text-ellipsis">
									{yl.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.yearLevel ? (
						<FieldError className="type-caption mt-0.5">
							{errors.yearLevel.message}
						</FieldError>
					) : null}
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
						items={filteredPrograms.map((p) => ({ value: p, label: p }))}
						disabled={!watchedDepartmentId}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select program" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{filteredPrograms.map((p) => (
								<SelectItem key={p} value={p} className="overflow-hidden text-ellipsis">
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.program ? (
						<FieldError className="type-caption mt-0.5">
							{errors.program.message}
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

