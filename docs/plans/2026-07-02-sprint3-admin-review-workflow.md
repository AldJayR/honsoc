# Sprint 3 — Admin Review Workflow: Implementation Plan

**Project:** NEUST Honor Society Verification System (NHSVS)
**Sprint:** 3 (Backend + Frontend — Admin Review Workflow)
**Date:** 2026-07-02
**Status:** Implemented (president escalation resolution and endpoint integration tests remain deferred)

---

## Goal

Build the admin review loop: the critical path where a `COLLEGE_ADMIN` reviews student applications, flags or verifies them, and every action is recorded immutably in the audit log. This unlocks the core `STUDENT → COLLEGE_ADMIN → PRESIDENT` workflow.

---

## Scope

### Backend Modules (new)
- **Flags** — DB schema + service + routes (POST/GET flags)
- **Audit Log** — DB schema + service (append-only) + routes (GET with filters)
- **PATCH Application Status** — status transitions with hard-block on VERIFIED when disqualifiers exist
- **Admin Management** — edit/deactivate officers, resend invite

### Frontend Pages (new under `frontend/app/admin/`)
- **Dashboard** — stats cards and applicant queue with status filters
- **Audit Workspace** — split-screen review: document scans (COR/COG/GMC) + computed grade table + GWA. Verify / Flag (modal with reason + note) / Escalate actions
- **Audit Log** — filterable action log

### Implementation Record
- Flag reasons use descriptive API values: `INCORRECT_GRADE`, `BLURRY_DOCUMENTS`, `INCOMPLETE_SUBMISSION`, and `OTHER`.
- Verification is blocked in the UI and API when grades/GWA disqualify an applicant or the required COR, GMC, or semester-specific COG is absent.
- The audit workspace derives semester tabs from applications for the same student and term. A single-semester submission shows one tab; paired applications show both tabs.
- Audit logs filter by action and local calendar date range.
- Escalation sets the application status to `ESCALATED`, requires an admin note, and writes an `ESCALATED` audit entry. President-side queue resolution remains Sprint 4 work.

---

## Constraints & Design Decisions

- **No college scoping** — `COLLEGE_ADMIN` sees all applications for now. Scoping by `department_id` or `campus_id` deferred.
- **Hard-block on VERIFY** — `PATCH /api/applications/:id/status` with `status: VERIFIED` shall return `422 Unprocessable Entity` if any disqualifying condition exists (INC, 5.0, GWA > threshold) or required documents are missing. This cannot be bypassed via direct API calls.
- **Audit log is append-only** — No update/delete exposed. Entries are inserted by the service layer during status transitions, not via direct POST.
- **Flag → FLAGGED status** — POSTing a flag automatically sets the application status to `FLAGGED`. The PATCH endpoint for `FLAGGED` exists but the flags endpoint is the canonical path.
- **Style conventions** match existing codebase: no unnecessary abstractions, module-level imports from `@/db`, `vi.mock()` for unit tests, `tsc --noEmit` zero errors.

---

## Task Breakdown

| # | Task | Backend/Frontend | Description |
|---|------|-----------------|-------------|
| 1 | DB schemas: flags, audit_log | Backend | Create `src/db/schema/flags.ts`, `src/db/schema/audit-log.ts`, barrel export, generate migration |
| 2 | Flags module | Backend | `src/modules/flags/` — service (`createFlag`, `getFlags`) + routes (POST, GET) + schema |
| 3 | Audit log module | Backend | `src/modules/audit-log/` — service (`logAction`, `getAuditLog`) + routes (GET with filters) |
| 4 | PATCH application status | Backend | Extend `application.service.ts` + `application.routes.ts` — document/disqualifier hard-block, escalation note, `reviewedBy`, and audit entry |
| 5 | Admin management | Backend | Extend `user.service.ts` + `user.routes.ts` — PUT edit officer, DELETE deactivate, POST resend-invite |
| 6 | Unit tests | Backend | `src/modules/flags/flags.service.test.ts`, `src/modules/audit-log/audit-log.service.test.ts`, extend `application.service.test.ts` |
| 7 | Wire routes + typecheck | Backend | Register flag routes, audit-log routes in `app.ts`. Full typecheck + test pass |
| 8 | Frontend: Admin dashboard | Frontend | Stats cards (total/pending/verified/flagged), applicant queue table with filters |
| 9 | Frontend: Audit workspace | Frontend | Split-screen: left = document viewer (COR/COG/GMC tabs), right = grade table + GWA + actions |
| 10 | Frontend: Flag modal + Audit log | Frontend | Flag modal (reason code select + note). Audit log page with filter controls |
| 11 | Integration tests | Both | Deferred: extend endpoint coverage beyond service-unit tests |

---

## Detailed Specifications

### Task 1: DB Schemas

**Files:**
- Create: `src/db/schema/flags.ts`
- Create: `src/db/schema/audit-log.ts`
- Modify: `src/db/schema/index.ts` (barrel exports)
- Run: `pnpm db:generate`

#### `src/db/schema/flags.ts`

```typescript
import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";
import { users } from "./users.ts";

export const flags = pgTable("flags", {
	id: serial("id").primaryKey(),
	applicationId: uuid("application_id")
		.notNull()
		.references(() => applications.id),
	reasonCode: text("reason_code").notNull(),
	note: text("note").notNull(),
	flaggedBy: uuid("flagged_by")
		.notNull()
		.references(() => users.id),
	flaggedAt: timestamp("flagged_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const flagsRelations = relations(flags, ({ one }) => ({
	application: one(applications, {
		fields: [flags.applicationId],
		references: [applications.id],
	}),
	flagger: one(users, {
		fields: [flags.flaggedBy],
		references: [users.id],
	}),
}));
```

#### `src/db/schema/audit-log.ts`

```typescript
import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { applications } from "./applications.ts";
import { users } from "./users.ts";

export const auditLog = pgTable("audit_log", {
	id: serial("id").primaryKey(),
	actorId: uuid("actor_id")
		.notNull()
		.references(() => users.id),
	applicationId: uuid("application_id")
		.notNull()
		.references(() => applications.id),
	action: text("action").notNull(),
	note: text("note"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	actor: one(users, {
		fields: [auditLog.actorId],
		references: [users.id],
	}),
	application: one(applications, {
		fields: [auditLog.applicationId],
		references: [applications.id],
	}),
}));
```

#### Barrel export (`src/db/schema/index.ts`)

Add:
```typescript
export { flags, flagsRelations } from "./flags.ts";
export { auditLog, auditLogRelations } from "./audit-log.ts";
```

---

### Task 2: Flags Module

**Files:**
- Create: `src/modules/flags/flags.schema.ts`
- Create: `src/modules/flags/flags.service.ts`
- Create: `src/modules/flags/flags.routes.ts`

#### `flags.schema.ts`

```typescript
import { z } from "zod";

export const FLAG_REASONS = [
	"INCORRECT_GRADE",
	"BLURRY_DOCUMENTS",
	"INCOMPLETE_SUBMISSION",
	"OTHER",
] as const;

export const createFlagSchema = z.object({
	reasonCode: z.enum(FLAG_REASONS),
	note: z.string().min(1, "Note is required"),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
```

#### `flags.service.ts`

```typescript
import { db } from "@/db";
import { flags, applications, auditLog } from "@/db/schema/index.ts";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors.ts";

async function verifyApplicationAccess(
	applicationId: string,
	userId: string,
	role: string,
) {
	const app = await db.query.applications.findFirst({
		where: eq(applications.id, applicationId),
	});
	if (!app) throw new NotFoundError("Application not found");
	if (role === "STUDENT" && app.studentId !== userId)
		throw new NotFoundError("Application not found");
	return app;
}

export async function createFlag(
	applicationId: string,
	flaggedBy: string,
	input: { reasonCode: string; note: string },
) {
	await verifyApplicationAccess(applicationId, flaggedBy, "COLLEGE_ADMIN");

	const [flag] = await db
		.insert(flags)
		.values({
			applicationId,
			reasonCode: input.reasonCode,
			note: input.note,
			flaggedBy,
		})
		.returning();

	// Auto-set application status to FLAGGED
	await db
		.update(applications)
		.set({ status: "FLAGGED" })
		.where(eq(applications.id, applicationId));

	// Record in audit log
	await db.insert(auditLog).values({
		actorId: flaggedBy,
		applicationId,
		action: "FLAGGED",
		note: `${input.reasonCode}: ${input.note}`,
	});

	return flag;
}

export async function getFlags(
	applicationId: string,
	userId: string,
	role: string,
) {
	await verifyApplicationAccess(applicationId, userId, role);
	return db.query.flags.findMany({
		where: eq(flags.applicationId, applicationId),
	});
}
```

#### `flags.routes.ts`

| Method | Path | Guard | Handler |
|--------|------|-------|---------|
| POST | `/api/applications/:id/flags` | `requireRole("COLLEGE_ADMIN")` | Parse body, call `createFlag`, return 201 |
| GET | `/api/applications/:id/flags` | `requireRole("STUDENT", "COLLEGE_ADMIN", "PRESIDENT")` | Call `getFlags`, return array |

---

### Task 3: Audit Log Module

**Files:**
- Create: `src/modules/audit-log/audit-log.service.ts`
- Create: `src/modules/audit-log/audit-log.routes.ts`

#### `audit-log.service.ts`

```typescript
import { db } from "@/db";
import { auditLog } from "@/db/schema/index.ts";
import { desc } from "drizzle-orm";

export async function logAction(
	actorId: string,
	applicationId: string,
	action: string,
	note?: string,
) {
	await db.insert(auditLog).values({ actorId, applicationId, action, note });
}

export async function getAuditLog(filters: {
	action?: string;
	from?: string;
	to?: string;
	timezoneOffset?: number;
} = {}) {
	// Filter by action and the browser's local calendar-day boundaries.
	return db.query.auditLog.findMany({
		orderBy: [desc(auditLog.createdAt)],
		with: {
			actor: { columns: { id: true, name: true, role: true } },
			application: { columns: { id: true, referenceNo: true, semester: true } },
		},
	});
}
```

#### `audit-log.routes.ts`

| Method | Path | Guard | Handler |
|--------|------|-------|---------|
| GET | `/api/audit-log?action=&from=&to=&timezoneOffset=` | `requireRole("COLLEGE_ADMIN", "PRESIDENT")` | Return action/date-filtered entries |

---

### Task 4: PATCH Application Status

**Modify:** `src/modules/applications/application.service.ts`

Add:

```typescript
export async function updateApplicationStatus(
	applicationId: string,
	actorId: string,
	actorRole: string,
	newStatus: string,
): Promise<{ id: string; status: string }> {
	const app = await db.query.applications.findFirst({
		where: eq(applications.id, applicationId),
	with: { grades: true, documents: true },
	});
	if (!app) throw new NotFoundError("Application not found");

	if (newStatus === "VERIFIED") {
		// Hard-block: check required documents and disqualifiers
		const term = await db.query.terms.findFirst({
			where: eq(terms.id, app.termId),
		});
		const gwa = await computeGWA(applicationId);
		const disq = checkDisqualifiers(
			app.grades.map((g) => ({ grade: g.grade, units: g.units })),
			gwa,
			Number(term?.gwaThreshold ?? 1.75),
		);
		if (disq.hasDisqualifier) {
			throw new UnprocessableError(
				`Cannot verify: ${disq.reasons.map((r) => r.message).join("; ")}`,
			);
		}
	}

	const [updated] = await db
		.update(applications)
		.set({
			status: newStatus,
			reviewedBy: newStatus === "VERIFIED" ? actorId : undefined,
		})
		.where(eq(applications.id, applicationId))
		.returning({ id: applications.id, status: applications.status });

	// Record in audit log
	const auditAction = newStatus === "VERIFIED" ? "VERIFIED"
		: newStatus === "FLAGGED" ? "FLAGGED"
		: newStatus === "REJECTED" ? "REJECTED"
		: newStatus === "ESCALATED" ? "ESCALATED"
		: "REVIEWED";
	await logAction(actorId, applicationId, auditAction, note);

	return updated!;
}
```

**Modify:** `src/modules/applications/application.routes.ts`

Add:

| Method | Path | Guard | Handler |
|--------|------|-------|---------|
| PATCH | `/api/applications/:id/status` | `requireRole("COLLEGE_ADMIN", "PRESIDENT")` | Parse `{ status, note? }`; `ESCALATED` requires `note` |

---

### Task 5: Admin Management

**Modify:** `src/modules/users/user.service.ts`

Add:

```typescript
export async function editOfficer(
	officerId: string,
	input: { role?: string; campus_id?: number; department_id?: number },
) {
	const [updated] = await db
		.update(users)
		.set(input)
		.where(eq(users.id, officerId))
		.returning({ id: users.id, email: users.email, role: users.role });
	if (!updated) throw new NotFoundError("Officer not found");
	return updated;
}

export async function deactivateOfficer(officerId: string) {
	const [updated] = await db
		.update(users)
		.set({ status: "INACTIVE" })
		.where(eq(users.id, officerId))
		.returning({ id: users.id, email: users.email });
	if (!updated) throw new NotFoundError("Officer not found");
	return updated;
}

export async function resendInvite(officerId: string, redirectTo: string) {
	const officer = await db.query.users.findFirst({
		where: eq(users.id, officerId),
		columns: { id: true, email: true, status: true },
	});
	if (!officer) throw new NotFoundError("Officer not found");
	if (officer.status !== "INVITE_PENDING") {
		throw new UnprocessableError("Account is not in INVITE_PENDING status");
	}
	await auth.api.requestPasswordReset({
		body: { email: officer.email, redirectTo },
	});
	return { email: officer.email };
}
```

**Modify:** `src/modules/users/user.routes.ts`

| Method | Path | Guard | Handler |
|--------|------|-------|---------|
| PUT | `/api/admin/officers/:id` | PRESIDENT | Edit officer role/campus/department |
| DELETE | `/api/admin/officers/:id` | PRESIDENT | Deactivate (set status=INACTIVE) |
| POST | `/api/admin/officers/:id/resend-invite` | PRESIDENT | Resend invite email |

---

### Task 6: Unit Tests

Test files to create/extend:

| File | Tests |
|------|-------|
| `src/modules/flags/flags.service.test.ts` | `createFlag` sets FLAGGED status + writes audit entry, `getFlags` returns flags, flags for non-existent app → NotFoundError |
| `src/modules/audit-log/audit-log.service.test.ts` | `logAction` inserts entry, `getAuditLog` returns entries with actor + application |
| Extend `application.service.test.ts` | `updateApplicationStatus` → VERIFY hard-blocks on disqualifier, VERIFY succeeds when clean, REJECTED sets status |

---

### Task 7: Wire Routes + Typecheck

**Modify:** `src/app.ts`

Add imports for `flagRoutes`, `auditLogRoutes`. Register after existing routes:

```typescript
await app.register(flagRoutes);
await app.register(auditLogRoutes);
```

Run `pnpm typecheck` → zero errors. Run `pnpm test` → all tests pass.

---

### Task 8: Frontend — Admin Dashboard

**New directory:** `frontend/app/admin/`

**Dashboard page** (`routes/admin.tsx`):
- Stats row: Total | Pending | Verified | Flagged counts
- Applicant queue: table with columns (Reference #, Student Name, Semester, Status, GWA, Submitted At, Actions)
- Filters: status dropdown
- Click row → navigate to audit workspace (`/admin/applications/:id`)

**Data source:** `GET /api/applications` (new endpoint or reuse existing). Need a service-side endpoint that returns all applications for COLLEGE_ADMIN/PRESIDENT — extend `application.service.ts` with `getAllApplications(role)`.

---

### Task 9: Frontend — Audit Workspace

**Route:** `/admin/applications/:id`

**Layout:** Split-screen using CSS grid (left 50% / right 50% at ≥1024px).

**Left pane:** Document viewer
- Tab selector: COR | COG_1ST | COG_2ND | GMC
- Each tab renders the document via its presigned URL (generate on-the-fly via `POST /api/documents/presign` or add a dedicated `GET /api/documents/:id/view` endpoint that returns a signed URL)

**Right pane:** Review panel
- Student info card (name, program, year level, student number)
- Grade table: subject code, subject name, units, entered grade, match indicator (✓/✕)
- Computed GWA with threshold indicator
- Documents completeness chips
- Action buttons: Verify (green), Flag (yellow), Escalate
	- Verify: disabled if disqualifiers exist or COR, GMC, or the semester-specific COG is missing (check on load + show warning)
	- Flag: opens modal with reason code dropdown + note textarea
	- Escalate: opens a modal requiring an escalation note, then sets `ESCALATED` and records the note in the audit log
	- Semester tabs show only the current semester unless paired applications for the same student and term exist

---

### Task 10: Frontend — Flag Modal + Audit Log

**Flag Modal:**
- Reason selector (`INCORRECT_GRADE`, `BLURRY_DOCUMENTS`, `INCOMPLETE_SUBMISSION`, `OTHER`)
- Note textarea (required, min 1 char)
- Submit → `POST /api/applications/:id/flags`

**Audit Log Page** (dashboard Audit Logs tab):
- Table: Timestamp, Actor, Action, Application, Note
- Filters: action type dropdown, date range
- Data: `GET /api/audit-log`

---

### Task 11: Integration Tests

Deferred integration tests should cover:
- Flag creation → verifies FLAGGED status + audit entry exists
- Verify clean application → status changes, reviewedBy set
- Verify disqualified application → 422, status unchanged
- Admin management (edit, deactivate, resend)

---

## Acceptance Criteria

### Backend
- [x] `POST /api/applications/:id/flags` sets status to FLAGGED and writes audit entry
- [x] `GET /api/applications/:id/flags` returns flags for authorized roles
- [x] `GET /api/audit-log` returns entries with actor + application data, filterable by action and local date range
- [x] `PATCH /api/applications/:id/status` with `VERIFIED` hard-blocks (422) when disqualifiers exist or required documents are missing
- [x] `PATCH /api/applications/:id/status` with `VERIFIED` succeeds on clean app, sets reviewedBy, writes audit
- [x] `PATCH /api/applications/:id/status` with `ESCALATED` requires a note and writes audit
- [x] `PUT /api/admin/officers/:id` updates officer role/campus/department
- [x] `DELETE /api/admin/officers/:id` sets status to INACTIVE (not DELETE)
- [x] `POST /api/admin/officers/:id/resend-invite` sends invite for INVITE_PENDING accounts
- [x] `tsc --noEmit` passes with zero errors
- [x] All unit tests pass

### Frontend
- [x] Admin dashboard shows stats and applicant queue with filters
- [x] Audit workspace renders split-screen: document viewer + review panel
- [x] Verify button is disabled when disqualifiers or required documents exist with a visible warning
- [x] Flag modal requires a reason and note before submission
- [x] Audit log page displays filterable action log
- [x] Escalate requires a note and records the action

---

## What's NOT in Sprint 3 (deferred)

- **President dashboard / governance pages** — Sprint 4
- **Honor Roll generation + export** — Sprint 4
- **President escalation queue and approve/return resolution** — Sprint 4
- **Flag resolve / re-submission** (student corrects flagged app) — Sprint 4
- **College-level access scoping** — deferred until seeded data
- **Email notifications for status changes** — deferred
- **Status timeline widget** on student portal — deferred
- **Seed script** (departments, campuses, terms) — deferred

---

## File Summary

| Action | File |
|--------|------|
| Create | `src/db/schema/flags.ts` |
| Create | `src/db/schema/audit-log.ts` |
| Modify | `src/db/schema/index.ts` |
| Create | `src/modules/flags/flags.schema.ts` |
| Create | `src/modules/flags/flags.service.ts` |
| Create | `src/modules/flags/flags.routes.ts` |
| Create | `src/modules/audit-log/audit-log.service.ts` |
| Create | `src/modules/audit-log/audit-log.routes.ts` |
| Modify | `src/modules/applications/application.service.ts` |
| Modify | `src/modules/applications/application.routes.ts` |
| Modify | `src/modules/users/user.service.ts` |
| Modify | `src/modules/users/user.routes.ts` |
| Modify | `src/app.ts` |
| Create | `src/modules/flags/flags.service.test.ts` |
| Create | `src/modules/audit-log/audit-log.service.test.ts` |
| Modify | `src/modules/applications/application.service.test.ts` |
| Create | `frontend/app/admin/routes/admin.tsx` |
| Create | `frontend/app/admin/routes/applications.$id.tsx` |
| Create | `frontend/app/admin/routes/audit-log.tsx` |
| Create | `frontend/app/admin/components/*` |
