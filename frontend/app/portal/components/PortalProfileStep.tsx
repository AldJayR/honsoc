import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
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
	type ProfileFormValues,
	profileSchema,
} from "~/shared/lib/schemas/portal";
import type { Campus, Department, Major } from "~/shared/services/auth.api";
import {
	getCampuses,
	getDepartments,
	getMajors,
} from "~/shared/services/auth.api";

export type { ProfileFormValues } from "~/shared/lib/schemas/portal";

interface PortalProfileStepProps {
	defaultValues: ProfileFormValues;
	onSubmit: (data: ProfileFormValues) => void;
	schoolYear: string;
}

const yearLevels = [
	{ value: "1ST_YEAR", label: "1st Year" },
	{ value: "2ND_YEAR", label: "2nd Year" },
	{ value: "3RD_YEAR", label: "3rd Year" },
	{ value: "4TH_YEAR", label: "4th Year" },
	{ value: "5TH_YEAR", label: "5th Year" },
];

const programsList = [
	"Bachelor of Science in Information Technology",
	"Bachelor of Science in Computer Science",
	"Bachelor of Science in Business Administration",
	"Bachelor of Science in Civil Engineering",
	"Bachelor of Science in Electrical Engineering",
	"Bachelor of Science in Criminology",
	"Bachelor of Science in Education",
];

export function PortalProfileStep({
	defaultValues,
	onSubmit,
	schoolYear,
}: PortalProfileStepProps) {
	const [campuses, setCampuses] = useState<Campus[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [majors, setMajors] = useState<Major[]>([]);
	const [loading, setLoading] = useState(true);

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

	useEffect(() => {
		const controller = new AbortController();
		async function loadData() {
			try {
				const [campData, deptData, majData] = await Promise.all([
					getCampuses(),
					getDepartments(),
					getMajors(),
				]);
				setCampuses(campData);
				setDepartments(deptData);
				setMajors(majData);
			} catch (_e) {
				// Network/abort errors are expected during unmount
			} finally {
				setLoading(false);
			}
		}
		loadData();
		return () => controller.abort();
	}, []);

	const handleFormSubmit = (data: ProfileFormValues) => {
		onSubmit(data);
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center w-full p-12">
				<div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
				<span className="mt-4 text-sm text-muted-foreground">
					Loading options...
				</span>
			</div>
		);
	}

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
					<Select
						value={watchedCampusId}
						onValueChange={(val) => {
							if (val) setValue("campusId", val, { shouldValidate: true });
						}}
						items={campuses.map((c) => ({ value: c.id.toString(), label: c.name }))}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select campus" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{campuses.map((c) => (
								<SelectItem key={c.id} value={c.id.toString()} className="overflow-hidden text-ellipsis">
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
					<Select
						value={watchedDepartmentId}
						onValueChange={(val) => {
							if (val) setValue("departmentId", val, { shouldValidate: true });
						}}
						items={departments.map((d) => ({ value: d.id.toString(), label: `${d.name} (${d.code})` }))}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select department" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							{departments.map((d) => (
								<SelectItem key={d.id} value={d.id.toString()} className="overflow-hidden text-ellipsis">
									{d.name} ({d.code})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
