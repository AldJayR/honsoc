# Sprint 2 — Application Submission Backend

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the student application submission system: term config, grade entry, document upload via Cloudflare R2 presigned URLs, GWA computation, and status tracking.

**Architecture:** Each domain (terms, applications, grades, documents) gets its own module under `src/modules/`. File uploads use R2 presigned URLs — server generates a time-limited PUT URL, client uploads directly, server records the link. GWA is computed on-demand from the grades table (never stored). "Both Semesters" submissions are split into two independent application records server-side at creation time.

**Tech Stack:** Fastify 5, Drizzle ORM + node-postgres, better-auth (session), Zod 4, @aws-sdk/client-s3 (R2 S3-compatible API), tsx, Vitest

---

## Task Overview

| # | Task | Description |
|---|------|-------------|
| 1 | DB Schemas | `terms`, `applications`, `grades`, `documents` tables |
| 2 | R2 Service | S3 client wrapper with `generatePresignedUrl` |
| 3 | Seed Script | Default terms, departments, campuses |
| 4 | Terms Module | CRUD for academic term (PRESIDENT only) |
| 5 | Grade Validation | Allowed values, disqualifier detection, Zod schema |
| 6 | GWA Engine | `computeGWA(appId)` — server-authoritative |
| 7 | Application Create | POST /applications with split-both logic |
| 8 | Application GETs | /mine, /:id with per-semester status |
| 9 | Documents Module | Presign + link + list endpoints |
| 10 | Grades Endpoint | POST + GET for grades within an application |
| 11 | Integration Wiring | Register all routes in app.ts |
| 12 | Typecheck + Tests | `tsc --noEmit`, Vitest unit tests |

---

### Task 1: DB Schemas

**Files:**
- Create: `src/db/schema/terms.ts`
- Create: `src/db/schema/applications.ts`
- Create: `src/db/schema/grades.ts`
- Create: `src/db/schema/documents.ts`
- Modify: `src/db/schema/index.ts` (barrel exports)
- Create: `src/db/migrations/` (via `drizzle-kit generate`)

**Schema: `src/db/schema/terms.ts`**

```typescript
import { boolean, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";

export const terms = pgTable("terms", {
	id: serial("id").primaryKey(),
	schoolYear: text("school_year").notNull(),
	semester: text("semester").notNull().default("1ST"),
	gwaThreshold: numeric("gwa_threshold", { precision: 4, scale: 2 })
		.default("1.75")
		.notNull(),
	isActive: boolean("is_active").default(false).notNull(),
});
```

**Schema: `src/db/schema/applications.ts`**

```typescript
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { terms } from "./terms.ts";
import { grades } from "./grades.ts";
import { documents } from "./documents.ts";

export const applications = pgTable("applications", {
	id: uuid("id").defaultRandom().primaryKey(),
	studentId: uuid("student_id").notNull().references(() => users.id),
	termId: integer("term_id").notNull().references(() => terms.id),
	semester: text("semester").notNull(),              // "1ST" | "2ND"
	status: text("status").notNull().default("SUBMITTED"), // SUBMITTED | UNDER_REVIEW | FLAGGED | VERIFIED | REJECTED
	referenceNo: text("reference_no").notNull().unique(),
	reviewedBy: uuid("reviewed_by").references(() => users.id),
	submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const applicationsRelations = relations(applications, ({ one, many }) => ({
	student: one(users, { fields: [applications.studentId], references: [users.id] }),
	term: one(terms, { fields: [applications.termId], references: [terms.id] }),
	reviewer: one(users, { fields: [applications.reviewedBy], references: [users.id] }),
	grades: many(grades),
	documents: many(documents),
}));
```

**Schema: `src/db/schema/grades.ts`**

```typescript
import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, uuid } from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";

export const grades = pgTable("grades", {
	id: serial("id").primaryKey(),
	applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
	subjectCode: text("subject_code").notNull(),
	subjectName: text("subject_name").notNull(),
	units: integer("units").notNull(),
	grade: text("grade").notNull(),  // "1.00" | "1.25" | "1.50" | "1.75" | "2.00" | "5.0" | "INC"
});

export const gradesRelations = relations(grades, ({ one }) => ({
	application: one(applications, { fields: [grades.applicationId], references: [applications.id] }),
}));
```

**Schema: `src/db/schema/documents.ts`**

```typescript
import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";

export const documents = pgTable("documents", {
	id: serial("id").primaryKey(),
	applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
	docType: text("doc_type").notNull(), // "COR" | "COG_1ST" | "COG_2ND" | "GMC"
	objectKey: text("object_key").notNull().unique(),
	fileSizeKb: integer("file_size_kb"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
	application: one(applications, { fields: [documents.applicationId], references: [applications.id] }),
}));
```

**Step: Barrel export** (`src/db/schema/index.ts`) — add exports for terms, applications, grades, documents.

**Step: Generate migration**

Run: `pnpm db:generate`

Expected: Creates migration files in `src/db/migrations/` reflecting the four new tables.

---

### Task 2: R2 Service

**Files:**
- Create: `src/lib/storage.ts`

**Implementation notes:**
- Use `@aws-sdk/client-s3` with R2 endpoint and credentials
- Only one public method: `generatePresignedUrl(key: string, contentType: string): Promise<{ url: string; objectKey: string }>`
- Object key format: `applications/{appId}/{docType}_{uuid}.{ext}`
- URL expires in 15 minutes
- Bucket name from env

**Env additions (`.env.example`):**
```
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=<bucket-name>
```

**Modified:** `src/config/env.ts` — add Zod schema for R2 vars.

---

### Task 3: Seed Script

**Files:**
- Create: `src/db/seed.ts`

Seed data:
- Departments: CEIT, CAS, CEN, COED, CHTM, etc.
- Campus: Gabaldon, San Leonardo, Cabanatuan, etc.
- One active term: SY 2025-2026, 2ND semester (or whatever is current)

---

### Task 4: Terms Module

**Files:**
- Create: `src/modules/terms/term.schema.ts`
- Create: `src/modules/terms/term.service.ts`
- Create: `src/modules/terms/term.routes.ts`

**Routes:**
- `POST /api/terms` — PRESIDENT creates term
- `GET /api/terms/active` — Any auth, get active term (used by student portal to check if apps open)
- `GET /api/terms` — PRESIDENT lists all terms
- `PATCH /api/terms/:id` — PRESIDENT updates term (activate, change deadline, etc.)

**Schema:**
```typescript
export const createTermSchema = z.object({
	schoolYear: z.string(),
	semester: z.enum(["1ST", "2ND", "BOTH"]),
	gwaThreshold: z.string().default("1.75"),
});

export const updateTermSchema = createTermSchema.partial();
```

---

### Task 5: Grade Validation

**Files:**
- Create: `src/modules/grades/grade.schema.ts`

The allowed grade values:
```typescript
export const ALLOWED_GRADES = ["1.00", "1.25", "1.50", "1.75", "2.00", "5.0", "INC"] as const;

export const gradeSchema = z.object({
	subjectCode: z.string().min(1).max(20),
	subjectName: z.string().min(1).max(100),
	units: z.number().int().min(1).max(6),
	grade: z.enum(ALLOWED_GRADES),
});
```

**Disqualifier logic** (reusable function):

```typescript
export function checkDisqualifiers(
	grades: Array<{ grade: string; units: number }>,
	gwa: number | null,
	gwaThreshold: number,
) {
	const reasons: Array<{ code: string; message: string }> = [];

	const hasDisqualifyingGrade = grades.some(g => g.grade === "5.0" || g.grade === "INC");
	if (hasDisqualifyingGrade) reasons.push({ code: "GRD-004", message: "Contains a disqualifying grade (5.0 or INC)" });

	if (gwa !== null && gwa > gwaThreshold) {
		reasons.push({ code: "GRD-006", message: `GWA ${gwa} does not meet the required threshold of ${gwaThreshold}` });
	}

	return { hasDisqualifier: reasons.length > 0, reasons };
}
```

---

### Task 6: GWA Engine

**Files:**
- Create: `src/modules/grades/gwa.service.ts`

**Logic:**
```typescript
import { db } from "@/db/index.ts";
import { grades } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";

export async function computeGWA(applicationId: string): Promise<number | null> {
	const rows = await db.select().from(grades).where(eq(grades.applicationId, applicationId));

	const numericGrades = rows.filter(g => /^[0-9.]+$/.test(g.grade));

	if (numericGrades.length === 0) return null;

	const totalWeighted = numericGrades.reduce((sum, g) => sum + parseFloat(g.grade) * g.units, 0);
	const totalUnits = numericGrades.reduce((sum, g) => sum + g.units, 0);

	return Math.round((totalWeighted / totalUnits) * 100) / 100;
}
```

GWA is **never stored**. It is computed on demand. Disqualifiers (INC, 5.0, underload) are checked separately. GWA is only meaningful when no numeric disqualifier exists.

---

### Task 7: Application Create

**Files:**
- Create: `src/modules/applications/application.schema.ts`
- Create: `src/modules/applications/application.service.ts`
- Create: `src/modules/applications/application.routes.ts`

**The split-both logic** is the core complexity:

```typescript
export async function createApplication(studentId: string, input: CreateApplicationInput) {
	// 1. Check active term exists → else throw 422 "No active term"
	// 2. Check term allows requested semester(s) — if input.semester is "BOTH", term.semester must be "BOTH" or include both
	// 3. Check no duplicate per semester — UNIQUE(student_id, term_id, semester)
	// 4. Generate reference numbers: HS-[YY][SEM]-[STUDENT_NO]
	// 5. If BOTH: transactional batch insert two application rows + two grade sets
	//    If SINGLE: insert one application + grades
	// 6. Return array of { id, referenceNo, semester }
}
```

**Reference number format:** `HS-252-2-2012345` where:
- `25` = last 2 digits of school year start (2025)
- `2` = semester (1 or 2)
- `2012345` = student number

**Routes:**
- `POST /api/applications` — STUDENT only (guard: `requireRole("STUDENT")`)

**Request body for "Both Semesters":**
```json
{
  "semester": "BOTH",
  "grades_1st": [{ "subjectCode": "MATH101", "subjectName": "Math 101", "units": 3, "grade": "1.50" }],
  "grades_2nd": [{ "subjectCode": "ENG102", "subjectName": "Eng 102", "units": 3, "grade": "1.25" }]
}
```

**Request body for single semester:**
```json
{
  "semester": "1ST",
  "grades": [{ "subjectCode": "MATH101", "subjectName": "Math 101", "units": 3, "grade": "1.50" }]
}
```

**Response:** Always returns an array (one or two items), so the client handles uniformly.

---

### Task 8: Application GET Endpoints

**Routes (same module):**
- `GET /api/applications/mine` — STUDENT, returns own applications with computed GWA per semester
- `GET /api/applications/:id` — STUDENT (own) | COLLEGE_ADMIN (own college) | PRESIDENT

**GET /mine response shape:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "semester": "1ST",
      "status": "SUBMITTED",
      "referenceNo": "HS-252-1-2012345",
      "gwa": 1.45,
      "disqualifiers": [],
      "submittedAt": "2026-06-17T00:00:00Z"
    }
  ]
}
```

The service queries applications for the student, then calls `computeGWA()` for each.

---

### Task 9: Documents Module

**Files:**
- Create: `src/modules/documents/document.schema.ts`
- Create: `src/modules/documents/document.service.ts`
- Create: `src/modules/documents/document.routes.ts`

**Routes:**
- `POST /api/documents/presign` — STUDENT (own app), generates R2 presigned URL
- `POST /api/documents/link` — STUDENT (own app), records uploaded file in DB
- `GET /api/applications/:id/documents` — STUDENT (own) | COLLEGE_ADMIN (own college) | PRESIDENT

**Presign request/response:**
```json
// POST /api/documents/presign
{ "applicationId": "uuid", "docType": "COG_1ST", "fileName": "scan.pdf" }

// Response
{ "url": "https://r2.example.com/...?X-Amz-Signature=...", "objectKey": "applications/uuid/COG_1ST_abc123.pdf" }
```

**Link request:** after client uploads to R2 successfully:
```json
// POST /api/documents/link
{ "applicationId": "uuid", "docType": "COG_1ST", "objectKey": "applications/uuid/COG_1ST_abc123.pdf", "fileSizeKb": 2048 }

// Response
{ "id": 1, "docType": "COG_1ST", "objectKey": "..." }
```

**Security:** Verify the student owns the application before generating presign or linking. Guard with `requireRole("STUDENT")` + ownership check.

---

### Task 10: Grades Endpoints

**Files:**
- Already covered, but routes to add in `application.routes.ts` or a separate `grades.routes.ts`

**Routes:**
- `POST /api/applications/:id/grades` — STUDENT (own, only if status is SUBMITTED or FLAGGED)
- `GET /api/applications/:id/grades` — STUDENT (own) | COLLEGE_ADMIN (own college) | PRESIDENT
- `GET /api/applications/:id/gwa` — All authenticated roles (computed on demand)

**Validation:** Allowed grade values enforced server-side → 422 on invalid. If any numeric grade > 2.00 (except 5.0) → 422.

---

### Task 11: Integration Wiring

**Files:**
- Modify: `src/app.ts`
- Modify: `src/config/env.ts`

Add R2 env vars to `env.ts`. Register new route plugins in `app.ts`:

```typescript
import { termRoutes } from "@/modules/terms/term.routes.ts";
import { applicationRoutes } from "@/modules/applications/application.routes.ts";
import { documentRoutes } from "@/modules/documents/document.routes.ts";
```

---

### Task 12: Typecheck + Tests

**Files:**
- Create: `src/modules/applications/application.service.test.ts`
- Create: `src/modules/grades/gwa.service.test.ts`
- Create: `src/modules/terms/term.service.test.ts`

**Run:** `pnpm typecheck` — zero errors
**Run:** `pnpm test` — all tests pass
**Run:** `pnpm db:seed` — seeds successfully (requires DB connection)

---

## Acceptance Criteria

- [ ] PRESIDENT can create and activate a term
- [ ] STUDENT creating a "Both Semesters" application generates two DB records with correct reference numbers
- [ ] Duplicate semester applications are rejected (DB unique constraint + service check)
- [ ] Grade values outside the allowed set return 422
- [ ] Grade values > 2.00 (except 5.0) return 422
- [ ] INC or 5.0 in grades triggers disqualifier flag
- [ ] Presigned URL endpoint returns a valid R2 signed URL
- [ ] Link endpoint records the object key in the documents table
- [ ] `GET /applications/mine` returns the student's applications with computed GWA
- [ ] `GET /applications/:id/documents` returns document metadata
- [ ] Ownership checks prevent student A from accessing student B's application
- [ ] `tsc --noEmit` passes
- [ ] All unit tests pass
