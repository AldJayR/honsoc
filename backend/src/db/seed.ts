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

	console.log("Seeding verified account...");
	let verifiedUser = (
		await db
			.select()
			.from(users)
			.where(eq(users.email, "verified@example.com"))
			.limit(1)
	)[0];

	if (!verifiedUser) {
		const results = await db
			.insert(users)
			.values({
				name: "Verified User",
				email: "verified@example.com",
				emailVerified: true,
				first_name: "Verified",
				last_name: "User",
				role: "STUDENT",
				status: "ACTIVE",
				student_number: "SUM2023-00123",
			})
			.returning();
		verifiedUser = results[0];
	} else if (verifiedUser.student_number !== "SUM2023-00123") {
		await db
			.update(users)
			.set({ student_number: "SUM2023-00123" })
			.where(eq(users.id, verifiedUser.id));
		verifiedUser.student_number = "SUM2023-00123";
		console.log(`  Updated student number for verified user: ${verifiedUser.email}`);
	}

	if (!verifiedUser) {
		throw new Error("Failed to insert or find verified user");
	}

	const existingAccount = (
		await db
			.select()
			.from(accounts)
			.where(eq(accounts.userId, verifiedUser.id))
			.limit(1)
	)[0];

	if (!existingAccount) {
		const passwordHash = await hashPassword("password123");
		await db.insert(accounts).values({
			accountId: verifiedUser.id,
			providerId: "credential",
			userId: verifiedUser.id,
			password: passwordHash,
		});
		console.log(`  Inserted verified user: ${verifiedUser.email}`);
	} else {
		console.log(`  Verified user already exists: ${verifiedUser.email}`);
	}

	console.log("Seed complete.");
	await pool.end();
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
