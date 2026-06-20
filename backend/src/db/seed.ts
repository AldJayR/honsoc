import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { campus, departments, majors } from "@/db/schema/index.ts";

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

	console.log("Seed complete.");
	await pool.end();
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
