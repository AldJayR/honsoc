import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel, FieldError } from "~/components/ui/field";
import { Select } from "~/components/ui/select";
import { getCampuses, getDepartments, getMajors } from "~/shared/services/api";
import type { Campus, Department, Major } from "~/shared/services/api";

export interface ProfileFormValues {
	campusId: string;
	departmentId: string;
	academicYear: string;
	yearLevel: "1ST_YEAR" | "2ND_YEAR" | "3RD_YEAR" | "4TH_YEAR" | "5TH_YEAR";
	program: string;
	majorId: string; // empty string for None
}

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

export function PortalProfileStep({ defaultValues, onSubmit, schoolYear }: PortalProfileStepProps) {
	const [campuses, setCampuses] = useState<Campus[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [majors, setMajors] = useState<Major[]>([]);
	const [loading, setLoading] = useState(true);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<ProfileFormValues>({
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
			} catch (e) {
				console.error("Error loading step 1 data:", e);
			} finally {
				setLoading(false);
			}
		}
		loadData();
	}, []);

	const handleFormSubmit = (data: ProfileFormValues) => {
		onSubmit(data);
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 w-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
				<span className="mt-4 text-sm text-brand-muted">Loading options...</span>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit(handleFormSubmit)}
			className="flex flex-col gap-6 items-start w-full animate-fade-in"
		>
			<p className="font-sans font-normal text-sm leading-5 text-brand-muted select-none">
				Confirm your student details. These will be cross-checked against your COR during verification.
			</p>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
				{/* Campus */}
				<Field className="w-full" data-invalid={!!errors.campusId}>
					<FieldLabel htmlFor="campusId" className="text-sm font-medium text-foreground">
						Campus
					</FieldLabel>
					<select
						id="campusId"
						value={watchedCampusId}
						onChange={(e) => setValue("campusId", e.target.value, { shouldValidate: true })}
						className="w-full bg-white border border-brand-border h-[36px] px-3 rounded-lg text-sm text-foreground shadow-sm focus:border-brand-primary outline-none"
					>
						<option value="">Select campus</option>
						{campuses.map((c) => (
							<option key={c.id} value={c.id.toString()}>
								{c.name}
							</option>
						))}
					</select>
					{errors.campusId && (
						<FieldError className="text-xs mt-0.5">Campus is required</FieldError>
					)}
				</Field>

				{/* Department */}
				<Field className="w-full" data-invalid={!!errors.departmentId}>
					<FieldLabel htmlFor="departmentId" className="text-sm font-medium text-foreground">
						Department
					</FieldLabel>
					<select
						id="departmentId"
						value={watchedDepartmentId}
						onChange={(e) => setValue("departmentId", e.target.value, { shouldValidate: true })}
						className="w-full bg-white border border-brand-border h-[36px] px-3 rounded-lg text-sm text-foreground shadow-sm focus:border-brand-primary outline-none"
					>
						<option value="">Select department</option>
						{departments.map((d) => (
							<option key={d.id} value={d.id.toString()}>
								{d.name} ({d.code})
							</option>
						))}
					</select>
					{errors.departmentId && (
						<FieldError className="text-xs mt-0.5">Department is required</FieldError>
					)}
				</Field>

				{/* Academic Year */}
				<Field className="w-full">
					<FieldLabel htmlFor="academicYear" className="text-sm font-medium text-foreground">
						Academic Year
					</FieldLabel>
					<select
						id="academicYear"
						{...register("academicYear")}
						className="w-full bg-white border border-brand-border h-[36px] px-3 rounded-lg text-sm text-foreground shadow-sm focus:border-brand-primary outline-none"
					>
						<option value={schoolYear}>{schoolYear}</option>
						<option value="2025 - 2026">2025 - 2026</option>
						<option value="2024 - 2025">2024 - 2025</option>
					</select>
				</Field>

				{/* Year Level */}
				<Field className="w-full" data-invalid={!!errors.yearLevel}>
					<FieldLabel htmlFor="yearLevel" className="text-sm font-medium text-foreground">
						Year Level
					</FieldLabel>
					<select
						id="yearLevel"
						value={watchedYearLevel}
						onChange={(e) => setValue("yearLevel", e.target.value as any, { shouldValidate: true })}
						className="w-full bg-white border border-brand-border h-[36px] px-3 rounded-lg text-sm text-foreground shadow-sm focus:border-brand-primary outline-none"
					>
						{yearLevels.map((yl) => (
							<option key={yl.value} value={yl.value}>
								{yl.label}
							</option>
						))}
					</select>
				</Field>

				{/* Program/course */}
				<Field className="w-full" data-invalid={!!errors.program}>
					<FieldLabel htmlFor="program" className="text-sm font-medium text-foreground">
						Program/course
					</FieldLabel>
					<select
						id="program"
						value={watchedProgram}
						onChange={(e) => setValue("program", e.target.value, { shouldValidate: true })}
						className="w-full bg-white border border-brand-border h-[36px] px-3 rounded-lg text-sm text-foreground shadow-sm focus:border-brand-primary outline-none"
					>
						<option value="">Select program</option>
						{programsList.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</select>
					{errors.program && (
						<FieldError className="text-xs mt-0.5">Program is required</FieldError>
					)}
				</Field>

				{/* Major */}
				<Field className="w-full">
					<FieldLabel htmlFor="majorId" className="text-sm font-medium text-foreground">
						Major
					</FieldLabel>
					<select
						id="majorId"
						value={watchedMajorId}
						onChange={(e) => setValue("majorId", e.target.value, { shouldValidate: true })}
						className="w-full bg-white border border-brand-border h-[36px] px-3 rounded-lg text-sm text-foreground shadow-sm focus:border-brand-primary outline-none"
					>
						<option value="">None</option>
						{majors.map((m) => (
							<option key={m.id} value={m.id.toString()}>
								{m.name}
							</option>
						))}
					</select>
				</Field>
			</div>

			<div className="flex items-center justify-end w-full mt-4 select-none">
				<Button
					type="submit"
					className="bg-brand-primary-dark hover:bg-brand-primary text-primary-foreground font-medium text-sm h-8 px-4 rounded-lg flex gap-1.5 items-center justify-center border-0 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
				>
					Continue
					<ArrowRight className="size-4 shrink-0" />
				</Button>
			</div>
		</form>
	);
}
