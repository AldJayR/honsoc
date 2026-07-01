import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { hashPassword } from "better-auth/crypto";
import { campus, departments, majors, users, accounts, terms } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
});
const db = drizzle({ client: pool });

const campuses = [
	"Sumacab Campus",
	"General Tinio Street Campus",
	"Atate Campus",
	"Fort Magsaysay Campus",
	"Gabaldon Campus",
	"San Isidro Campus",
	"Carranglan Off-Campus",
	"Peñaranda Off-Campus",
	"Papaya Off-Campus",
	"San Antonio Off-Campus",
	"San Leonardo Off-Campus",
	"Talavera Off-Campus",
];

const departmentData = [
	{ code: "ARCH", name: "College of Architecture" },
	{ code: "EDUC", name: "College of Education" },
	{ code: "COE", name: "College of Engineering" },
	{ code: "CRIM", name: "College of Criminology" },
	{ code: "CICT", name: "College of Information and Communications Technology" },
	{ code: "CMBT", name: "College of Management and Business Technology" },
	{ code: "CPADM", name: "College of Public Administration and Disaster Management" },
	{ code: "CAS", name: "College of Arts and Sciences" },
	{ code: "CIT", name: "College of Industrial Technology" },
	{ code: "CON", name: "College of Nursing" },
	{ code: "ILL", name: "Institute of Linguistics and Literature" },
	{ code: "COA", name: "College of Agriculture" },
];

const majorData = [
	"Database Systems Technology",
	"Network Systems Technology",
	"Web Systems Technology",
	"Business Economics",
	"Service Management for Business Process Outsourcing",
	"Financial Management",
	"Human Resource Management",
	"Marketing Management",
	"Disaster Risk Management",
	"Medical Biology",
	"Apparel and Fashion Technology",
	"Automotive Technology",
	"Architectural Drafting Technology",
	"Electrical Technology",
	"Electronics Technology",
	"Culinary Technology",
	"Mechatronics Technology",
	"HVACR Technology",
	"Indigenous Peoples' Studies",
	"Animal Science",
	"Crop Science",
	"Agricultural Extension",
	"Agro-forestry",
	"Basic Education",
	"English Education",
	"Filipino Education",
	"Mathematics Education",
	"General Science Education",
	"Technology and Livelihood Education",
	"Music, Arts, Physical Education and Health",
	"Industrial Arts",
	"Home Economics",
];

async function main() {
	console.log("Seeding campus...");
	const campusValues = campuses.map((name) => ({ name }));
	await db
		.insert(campus)
		.values(campusValues)
		.onConflictDoNothing();
	console.log(`  Inserted ${campusValues.length} campuses`);

	console.log("Seeding departments...");
	const deptValues = departmentData.map((d) => ({
		code: d.code,
		name: d.name,
	}));
	await db
		.insert(departments)
		.values(deptValues)
		.onConflictDoNothing();
	console.log(`  Inserted ${deptValues.length} departments`);

	console.log("Seeding majors...");
	const majorValues = majorData.map((name) => ({ name }));
	await db
		.insert(majors)
		.values(majorValues)
		.onConflictDoNothing();
	console.log(`  Inserted ${majorValues.length} majors`);

	console.log("Seeding active term...");
	await db
		.insert(terms)
		.values({
			schoolYear: "2025-2026",
			semester: "BOTH",
			gwaThreshold: "1.75",
			isActive: true,
		})
		.onConflictDoNothing();
	console.log("  Inserted active term");

	const seedUsers = [
		{
			name: "Verified User",
			email: "verified@example.com",
			first_name: "Verified",
			last_name: "User",
			student_number: "SUM2023-00123",
		},
		{
			name: "Alice Santos",
			email: "alice@example.com",
			first_name: "Alice",
			last_name: "Santos",
			student_number: "SUM2023-00124",
		},
		{
			name: "Bob Reyes",
			email: "bob@example.com",
			first_name: "Bob",
			last_name: "Reyes",
			student_number: "SUM2023-00125",
		},
		{
			name: "Carla Gomez",
			email: "carla@example.com",
			first_name: "Carla",
			last_name: "Gomez",
			student_number: "SUM2023-00126",
		},
	];

	console.log("Seeding accounts...");
	const passwordHash = await hashPassword("password123");

	for (const user of seedUsers) {
		let existingUser = (
			await db
				.select()
				.from(users)
				.where(eq(users.email, user.email))
				.limit(1)
		)[0];

		if (!existingUser) {
			const results = await db
				.insert(users)
				.values({
					...user,
					emailVerified: true,
					role: "STUDENT",
					status: "ACTIVE",
				})
				.returning();
			existingUser = results[0];
		} else if (existingUser.student_number !== user.student_number) {
			await db
				.update(users)
				.set({ student_number: user.student_number })
				.where(eq(users.id, existingUser.id));
			existingUser.student_number = user.student_number;
			console.log(`  Updated student number for ${user.email}`);
		}

		if (!existingUser) {
			throw new Error(`Failed to insert or find user: ${user.email}`);
		}

		const existingAccount = (
			await db
				.select()
				.from(accounts)
				.where(eq(accounts.userId, existingUser.id))
				.limit(1)
		)[0];

		if (!existingAccount) {
			await db.insert(accounts).values({
				accountId: existingUser.id,
				providerId: "credential",
				userId: existingUser.id,
				password: passwordHash,
			});
			console.log(`  Inserted user: ${user.email}`);
		} else {
			console.log(`  User already exists: ${user.email}`);
		}
	}

	console.log("Seed complete.");
	await pool.end();
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
