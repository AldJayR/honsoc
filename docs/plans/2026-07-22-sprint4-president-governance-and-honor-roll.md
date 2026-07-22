# Sprint 4 - President Governance and Honor Roll Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the president governance layer, complete escalation resolution, support flagged-application resubmission, and generate immutable Final Honor Roll exports.

**Architecture:** Extend the existing Fastify/Drizzle service modules instead of creating a second API layer. The `departments` table is the current college representation, so president queries aggregate by department while `campus` remains a separate dimension. Use the append-only `audit_log` as the source of status history and escalation evidence; use a new `honor_rolls` snapshot table for frozen exports. Add a dedicated president workspace while preserving the existing college representative workspace and student portal.

**Tech Stack:** Fastify 5, Zod 4, Drizzle ORM/PostgreSQL, Better Auth session guards, React Router 7, React 19, TanStack Query, existing shadcn/Base UI primitives, PDFKit for server-side PDF generation.

---

## Source Requirements

This sprint implements the capabilities explicitly deferred by Sprint 3 and required by the SRS:

- `PRE-01` through `PRE-07`: president overview, college progress, deadline tracker, escalation queue, Honor Roll, and audit report.
- `STA-01` through `STA-06`: status timeline, flag details, correction/resubmission, and deadline display.
- `ADM-07`: escalation from college representative to president with a note.
- `REL-04`: immutable Honor Roll snapshots.
- SRS API entries for `/honor-roll/preview`, `/honor-roll/generate`, and `/honor-roll/:id/export`.
- Sprint 3 deferred items: president dashboard/governance pages, Honor Roll generation/export, escalation approve/return, and flag resolve/resubmission.

## Current-State Constraints

- Applications are independent semester records. Every dashboard, escalation, resubmission, and Honor Roll operation must operate on one application record at a time.
- `departments` currently represents the assigned college through `users.department_id`; do not introduce a new college table in this sprint.
- `audit_log` is append-only. New actions are inserted, never edited or deleted.
- The current application status set is `SUBMITTED`, `UNDER_REVIEW`, `FLAGGED`, `VERIFIED`, `REJECTED`, and `ESCALATED`.
- The current `terms` table has no deadline field. Add one so deadline displays are backed by persisted data instead of a frontend constant.
- The current application service does not consistently scope college representatives to their assigned department. Sprint 4 should establish the shared access predicate before exposing president and escalation views.
- There is no existing PDF generation dependency. Add a small server-side PDF dependency rather than generating PDFs in the browser from mutable query data.
- Do not add email notifications, automated grade matching, or Honor Roll editing. Those remain outside this sprint.

## Status and Audit Semantics

Use these transitions and audit actions consistently:

| Operation | Application status | Audit action | Note |
|---|---|---|---|
| Student submits | `SUBMITTED` | `SUBMITTED` | Created for every generated semester application |
| Representative begins/reviews | `UNDER_REVIEW` | `REVIEWED` | Existing status transition behavior |
| Representative flags | `FLAGGED` | `FLAGGED` | Flag reason and note are retained |
| Representative escalates | `ESCALATED` | `ESCALATED` | Admin note required |
| President approves escalation | `VERIFIED` | `APPROVED_ESCALATION` | Must pass the same verification hard-block |
| President returns escalation | `UNDER_REVIEW` | `RETURNED_ESCALATION` | President note required |
| Representative verifies | `VERIFIED` | `VERIFIED` | `reviewedBy` is set to actor |
| Representative un-verifies | `UNDER_REVIEW` | `UNVERIFIED` | `reviewedBy` is cleared |
| Student resubmits a flagged app | `UNDER_REVIEW` | `RE_SUBMITTED` | Active flags are resolved with a timestamp |

Timeline UI should derive timestamps from these audit entries. If an old application has no initial `SUBMITTED` entry, the UI should fall back to `submittedAt` for that first timeline point rather than failing.

## Task Breakdown

### Task 1: Persist Term Deadlines and Honor Roll Snapshots

**Files:**
- Create: `backend/src/db/schema/honor-rolls.ts`
- Modify: `backend/src/db/schema/terms.ts`
- Modify: `backend/src/db/schema/index.ts`
- Modify: `backend/src/modules/terms/term.schema.ts`
- Modify: `backend/src/modules/terms/term.service.ts`
- Modify: `backend/src/modules/terms/term.routes.ts`
- Create: `backend/src/db/migrations/<generated-sprint4-migration>.sql`
- Modify: `backend/src/db/migrations/meta/*` through Drizzle generation
- Test: `backend/src/modules/terms/term.service.test.ts`

**Implementation details:**

1. Add `deadlineAt` to `terms` as a nullable timezone-aware timestamp initially. Existing terms must remain readable; the president UI must show a clear "No deadline configured" state when null.
2. Add the `honor_rolls` table from SRS `6.1`:
   - `id` serial primary key.
   - `termId` foreign key to `terms`.
   - `semester` text constrained by service/schema to `1ST` or `2ND`.
   - `generatedBy` foreign key to `users`.
   - `generatedAt` timezone-aware timestamp defaulting to now.
   - `rollReference` unique text.
   - `snapshotJson` JSONB not null.
3. Add Drizzle relations for the term, generator, and Honor Roll rows.
4. Extend create/update term schemas and route responses with `deadlineAt`.
5. Validate that a deadline is a valid future-or-present timestamp when configuring an active term. Do not silently alter a deadline on unrelated term updates.
6. Generate the migration with `pnpm db:generate`; do not hand-edit generated snapshot metadata except when required by the existing Drizzle workflow.

**Verification:**

- Term create/update accepts and returns `deadlineAt`.
- Existing terms with null deadlines still load.
- Honor Roll schema typechecks and migration generation succeeds.

### Task 2: Centralize Governance Access and Dashboard Queries

**Files:**
- Create: `backend/src/modules/governance/governance.schema.ts`
- Create: `backend/src/modules/governance/governance.service.ts`
- Create: `backend/src/modules/governance/governance.routes.ts`
- Modify: `backend/src/modules/applications/application.service.ts`
- Modify: `backend/src/modules/applications/application.routes.ts`
- Modify: `backend/src/modules/grades/grade.service.ts`
- Modify: `backend/src/modules/documents/document.service.ts`
- Modify: `backend/src/modules/flags/flags.service.ts`
- Modify: `backend/src/modules/audit-log/audit-log.service.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/src/modules/governance/governance.service.test.ts`

**Implementation details:**

1. Add one shared access helper that loads the actor's role and `department_id` and applies these rules:
   - `PRESIDENT`: all colleges and campuses.
   - `COLLEGE_ADMIN` and `OFFICER`: only applications whose student's assigned department matches the actor's department.
   - `STUDENT`: own application only.
2. Apply the helper to admin application list/detail, grade reads, document reads, flag reads, status transitions, and audit-log reads. Preserve the existing `NotFoundError` behavior for unauthorized application IDs to avoid leaking existence.
3. Add governance response types and service methods:
   - `getPresidentOverview(termId?)`: system totals, processed percentage, deadline data, and escalation count.
   - `getCollegeBreakdown(termId?)`: department/college name, assigned admin names, pending/verified/flagged counts, total, and progress percentage.
   - `getEscalationQueue(termId?)`: escalated applications with student, college, semester, GWA, admin actor, note, and timestamp.
4. Count each semester application independently. Pending includes `SUBMITTED`, `UNDER_REVIEW`, and `ESCALATED`; verified and flagged are exact status counts.
5. Resolve the assigned college through `users.department_id -> departments`. Include campus information only as an additional display dimension, not as a replacement for college aggregation.
6. Add president-only routes:
   - `GET /api/president/overview`
   - `GET /api/president/colleges`
   - `GET /api/president/escalations`

**Verification:**

- A president sees cross-college data.
- A college representative cannot read an application outside the assigned department.
- Overview counts match the independently stored semester application rows.
- Empty terms and departments return stable empty arrays/zero counts.

### Task 3: Complete Escalation Resolution

**Files:**
- Create: `backend/src/modules/governance/escalation.schema.ts`
- Modify: `backend/src/modules/governance/governance.service.ts`
- Modify: `backend/src/modules/governance/governance.routes.ts`
- Modify: `backend/src/modules/applications/application.service.ts`
- Modify: `backend/src/modules/applications/application.schema.ts`
- Modify: `backend/src/modules/applications/application.routes.ts` if the shared status route is retained
- Test: `backend/src/modules/governance/escalation.service.test.ts`

**Implementation details:**

1. Add a president-only resolution endpoint with an explicit action instead of overloading arbitrary status changes:
   - `PATCH /api/president/escalations/:id` with `{ action: "APPROVE" | "RETURN", note?: string }`.
2. Require an escalation note for `RETURN`. Permit an optional approval note, but preserve the original admin escalation note in the audit log.
3. `APPROVE` must call the same server-side verification predicate used by `VERIFIED` status updates. It must reject `INC`, `5.0`, GWA disqualification, or missing required documents with `422`; it must not bypass the verification hard-block.
4. On approval, set status to `VERIFIED`, set `reviewedBy` to the president actor, and insert `APPROVED_ESCALATION`.
5. On return, set status to `UNDER_REVIEW`, clear `reviewedBy`, and insert `RETURNED_ESCALATION` with the president note.
6. Restrict both operations to applications currently in `ESCALATED` status. Return `409` or `422` for repeated/stale actions rather than changing an unrelated state.
7. Wrap status update and audit insert in one database transaction.

**Verification:**

- Approve clean escalation changes status and is visible in the audit log.
- Approve disqualified escalation returns `422` and leaves status unchanged.
- Return requires a note and makes the application visible to the college representative queue.
- Student and college representative tokens cannot resolve escalations.

### Task 4: Build Honor Roll Preview, Generation, and PDF Export

**Files:**
- Create: `backend/src/modules/honor-roll/honor-roll.schema.ts`
- Create: `backend/src/modules/honor-roll/honor-roll.service.ts`
- Create: `backend/src/modules/honor-roll/honor-roll.routes.ts`
- Create: `backend/src/modules/honor-roll/honor-roll.service.test.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/package.json`
- Modify: `backend/pnpm-lock.yaml` through the package manager

**Implementation details:**

1. Add PDFKit and its TypeScript types to the backend. Keep PDF generation server-side so exports are generated from a verified, transactional snapshot.
2. Add a shared verified-applicant query filtered by required `termId` and `semester`. Include:
   - Student name and student number.
   - College/department code and name.
   - Campus name.
   - Semester and application reference.
   - Server-computed GWA.
   - The actor and timestamp from the final `VERIFIED` or `APPROVED_ESCALATION` audit action.
3. Add routes:
   - `GET /api/honor-roll/preview?termId=&semester=` for president-only preview.
   - `POST /api/honor-roll/generate` with `{ termId, semester }` for president-only generation.
   - `GET /api/honor-roll/:id/export` for president-only PDF download.
4. Refuse generation when no active/valid term is selected or when no verified applications exist, with a human-readable `422` response.
5. Generate a unique roll reference containing the term, semester, and timestamp/random suffix. Insert one immutable `honor_rolls` row containing the full JSON snapshot in the same transaction as the generated metadata.
6. Never rebuild an export from current applications after generation. The PDF endpoint must read only `snapshotJson`.
7. Set PDF response headers:
   - `Content-Type: application/pdf`.
   - `Content-Disposition: attachment; filename="<roll-reference>.pdf"`.
8. Include a title, school year, semester, roll reference, generated timestamp, president name, and tabular applicant data in the PDF. Handle long names and multiple pages without dropping rows.

**Verification:**

- Preview excludes non-verified applications.
- Generated snapshot remains unchanged after an application is unverified or edited.
- Export includes timestamp, term identifier, semester, president name, and every snapshot row.
- Student and representative roles receive `403`.

### Task 5: Add President Audit Report Queries and Export

**Files:**
- Modify: `backend/src/modules/audit-log/audit-log.schema.ts` or create it if filters remain inline
- Modify: `backend/src/modules/audit-log/audit-log.service.ts`
- Modify: `backend/src/modules/audit-log/audit-log.routes.ts`
- Create: `backend/src/modules/audit-log/audit-report.service.ts`
- Create: `backend/src/modules/audit-log/audit-report.service.test.ts`

**Implementation details:**

1. Extend president audit filters to include `termId`, `semester`, `departmentId` (college), `action`, `from`, and `to`.
2. Keep date filtering based on the browser-provided timezone offset already used by Sprint 3.
3. Return actor, role, student, application, college, campus, semester, action, note, and timestamp in a stable response shape.
4. Preserve role scoping:
   - President can view all matching records.
   - College representatives can view only records for their allowed college scope.
5. Add `GET /api/president/audit-report/export` returning a CSV file with the same filters. Escape commas, quotes, and newlines in actor names and notes.
6. Do not expose update or delete routes for audit records.

**Verification:**

- Each filter composes with the others.
- The CSV export matches the filtered table response.
- Audit rows cannot be mutated or deleted through the API.

### Task 6: Implement Flag Correction and Resubmission

**Files:**
- Create: `backend/src/modules/applications/resubmission.schema.ts`
- Create: `backend/src/modules/applications/resubmission.service.ts`
- Modify: `backend/src/modules/applications/draft.service.ts` if flagged edits reuse drafts
- Modify: `backend/src/modules/applications/application.routes.ts`
- Modify: `backend/src/modules/grades/grade.service.ts`
- Modify: `backend/src/modules/documents/document.service.ts`
- Modify: `backend/src/modules/documents/document.routes.ts`
- Modify: `backend/src/modules/flags/flags.service.ts`
- Create: `backend/src/modules/applications/resubmission.service.test.ts`

**Implementation details:**

1. Add `GET /api/applications/:id/timeline` for the owning student. Build timeline entries from audit log actions and fallback to `submittedAt` for legacy submissions.
2. Add `POST /api/applications/:id/resubmit` for the owning student. The route must accept the corrected grade rows and require the application to be `FLAGGED`.
3. Reuse the existing grade schema and server-side validation. Replace grades transactionally and recompute GWA/disqualifiers before changing status.
4. Permit document re-upload for the flagged application. When linking a replacement of the same `docType`, replace the prior document reference for that application rather than accumulating ambiguous active copies. Preserve shared COR/GMC behavior for paired semester applications explicitly.
5. Before resubmission succeeds, validate the required semester-specific document set. If incomplete, return `422` and leave the application flagged.
6. On success:
   - Set status to `UNDER_REVIEW`.
   - Resolve active flags by setting `resolvedAt`.
   - Insert `RE_SUBMITTED` with a concise note.
   - Leave the other semester application unchanged.
7. Student reads must return reason, note, flagged timestamp, and resolved timestamp for every flag.
8. A resubmitted application remains subject to the normal representative verification hard-block.

**Verification:**

- A flagged student sees all flag reasons and notes.
- Correcting one semester does not modify the other semester application.
- Missing replacement documents prevent resubmission.
- Resubmission updates status, flags, timeline, and representative queue atomically.
- Non-owners and president/representative accounts cannot use the student resubmission route.

### Task 7: Build the President Frontend Workspace

**Files:**
- Create: `frontend/app/president/PresidentWorkspace.tsx`
- Create: `frontend/app/president/PresidentSidebar.tsx`
- Create: `frontend/app/president/Overview.tsx`
- Create: `frontend/app/president/Colleges.tsx`
- Create: `frontend/app/president/Escalations.tsx`
- Create: `frontend/app/president/HonorRoll.tsx`
- Create: `frontend/app/president/AuditReport.tsx`
- Create: `frontend/app/president/TermSettings.tsx`
- Create: `frontend/app/president/OfficerManagement.tsx`
- Create: `frontend/app/shared/services/president.api.ts`
- Create: `frontend/app/shared/services/queries/president.ts`
- Create: `frontend/app/routes/president.tsx`
- Modify: `frontend/app/routes.ts`
- Modify: `frontend/app/routes/dashboard.tsx`
- Modify: `frontend/app/routes/portal.tsx`

**Implementation details:**

1. Add a president-only `/president` route with a loader that rejects non-presidents and redirects them to `/portal` or `/dashboard` as appropriate.
2. Update the workspace chooser so a president's administrative option opens `/president`, while college representatives and officers continue to use `/dashboard`.
3. Build a sidebar matching the existing design system but with president sections:
   - Overview.
   - Colleges.
   - Escalations.
   - Honor Roll.
   - Audit Report.
   - Settings.
4. Overview must show total, pending, verified, flagged, processed percentage, deadline countdown, and escalation count. Make the counts explicitly per-semester application.
5. Colleges must show one row per department with college name, assigned admins, counts, total, and progress bar. Include useful empty and missing-assignment states.
6. Escalations must show the application, student, semester, college, admin note, date, GWA/disqualifier warning, and Approve/Return controls. Return opens a required-note dialog; Approve must surface a verification-block error instead of silently failing.
7. Honor Roll must provide term and semester selectors, preview table, Generate action, generation confirmation, generated snapshot metadata, and PDF download.
8. Audit Report must provide all SRS filters, a table, loading/error/empty states, and CSV export.
9. Settings must reuse the existing term and officer APIs for deadline configuration and admin provisioning/edit/deactivation/resend. Do not duplicate provisioning logic in the client.
10. Use existing `Card`, `Table`, `Badge`, `Progress`, `Select`, `Dialog`, `AlertDialog`, `Button`, and `Input` components. Avoid new decorative card patterns or custom native controls.

**Verification:**

- President route is inaccessible to other roles.
- Every page has responsive loading, empty, error, and permission states.
- Approve/Return and Generate actions invalidate the relevant queries.
- PDF and CSV downloads are initiated from user actions and do not navigate away from the workspace.

### Task 8: Complete Student Flagged Status and Resubmission UI

**Files:**
- Modify: `frontend/app/portal/PortalStatusStep.tsx`
- Modify: `frontend/app/portal/PortalPage.tsx`
- Modify: `frontend/app/portal/useApplicationSubmit.ts`
- Modify: `frontend/app/portal/PortalDocumentsStep.tsx`
- Modify: `frontend/app/portal/PortalGradesStep.tsx`
- Create: `frontend/app/portal/PortalFlagDetails.tsx`
- Create: `frontend/app/portal/PortalTimeline.tsx`
- Modify: `frontend/app/shared/services/auth.api.ts`
- Create or modify: `frontend/app/shared/services/student.api.ts`
- Create or modify: `frontend/app/shared/services/queries/student.ts`

**Implementation details:**

1. Load flags and timeline per application, not as one combined student-level status. Keep paired semester applications independent.
2. Render a timeline with timestamps for Submitted, Under Review, Flagged, Verified, and Final Honor Roll when data exists. Do not fabricate a Final Honor Roll timestamp before the application appears in a generated roll.
3. For a flagged application, show every reason and note in a clear action panel. Include flagged date and whether each flag has been resolved.
4. Add a correction mode that opens the grade editor and document uploader for only the flagged application.
5. Submit corrections through the resubmission endpoint, show inline validation, and return the target application to Under Review after success.
6. Show the configured Honor Roll deadline and days remaining from `terms.deadlineAt`; handle no deadline and expired deadlines explicitly.
7. Preserve the existing mobile behavior. The timeline and flag details should stack above correction controls on narrow screens.

**Verification:**

- Student sees the correct semester's flags and timeline.
- Student cannot edit verified, escalated, or unrelated applications through the correction UI.
- A successful resubmission refreshes only the target application's status and timeline.
- Deadline display matches the configured term timezone/date behavior.

### Task 9: Wire Routes, Query Caches, and Role Guards

**Files:**
- Modify: `backend/src/app.ts`
- Modify: `frontend/app/routes.ts`
- Modify: `frontend/app/shared/services/queries/representative.ts` if shared invalidation is needed
- Modify: `frontend/app/admin/AdminSidebar.tsx` only if role switching needs a president target
- Modify: `docs/requirements.md` for newly implemented API/status actions

**Implementation details:**

1. Register governance, Honor Roll, resubmission, timeline, and expanded audit routes in `buildApp`.
2. Ensure all president routes use `requireRole("PRESIDENT")` and all student correction routes use the authenticated owner check.
3. Update application/status response types to include all Sprint 4 actions and statuses used by the UI.
4. Add query keys for overview, colleges, escalations, Honor Roll preview, generated rolls, audit report, flags, and timelines.
5. Invalidate applications, audit reports, escalation queue, timelines, and Honor Roll preview after each relevant mutation.
6. Update the SRS API summary and data-model action list to include `UNVERIFIED`, `RE_SUBMITTED`, `APPROVED_ESCALATION`, and `RETURNED_ESCALATION` where applicable.

**Verification:**

- `GET /president` and all president API paths reject non-presidents.
- Student routes do not expose president aggregates or cross-student audit data.
- Query caches do not display stale escalation or status data after a mutation.

### Task 10: Add Service and Endpoint Coverage

**Files:**
- Extend: `backend/src/modules/terms/term.service.test.ts`
- Create: `backend/src/modules/governance/governance.service.test.ts`
- Create: `backend/src/modules/governance/escalation.service.test.ts`
- Create: `backend/src/modules/honor-roll/honor-roll.service.test.ts`
- Create: `backend/src/modules/audit-log/audit-report.service.test.ts`
- Create: `backend/src/modules/applications/resubmission.service.test.ts`
- Create: `backend/src/modules/governance/governance.routes.test.ts` or the repository's established app-injection test location

**Coverage requirements:**

- President overview aggregates independent semester rows correctly.
- College representatives cannot cross department boundaries.
- Escalation approve/return is transactional, role-protected, note-aware, and status-safe.
- Honor Roll preview excludes non-verified rows.
- Honor Roll generation snapshots data and export reads only the snapshot.
- Audit report filters and CSV escaping work for notes containing commas, quotes, and newlines.
- Flagged resubmission resolves flags, writes `RE_SUBMITTED`, changes only the target application, and rejects incomplete documents.
- Timeline fallback handles legacy applications with no `SUBMITTED` audit entry.
- Term deadlines validate and persist correctly.

**Commands:**

```bash
cd backend
pnpm typecheck
pnpm test
```

Add endpoint tests using Fastify injection for role checks, response codes, and content-disposition/content-type headers. Avoid tests that require a live email provider or R2 bucket.

### Task 11: Frontend Verification and Acceptance Walkthrough

**Files:**
- Modify: `frontend/README.md` only if local setup or route documentation changes
- No new production files unless discovered during implementation

**Commands:**

```bash
cd frontend
pnpm typecheck
pnpm build
```

**Manual acceptance walkthrough:**

1. Log in as a president and confirm the president workspace chooser routes to `/president`.
2. Confirm overview totals, deadline, college progress, and escalation badge.
3. Return an escalation with a note and verify the application returns to the representative queue.
4. Approve a clean escalation and verify it appears in the Honor Roll preview.
5. Attempt to approve a disqualified escalation and confirm a visible `422` error with no status change.
6. Generate an Honor Roll, mutate an underlying application, and confirm the exported snapshot is unchanged.
7. Filter and export the president audit report.
8. Log in as a student, inspect a flagged application, correct one semester, resubmit it, and confirm the paired semester remains unchanged.
9. Verify deadline and expired-deadline states on mobile and desktop widths.

## Acceptance Criteria

### President Governance

- [ ] President overview shows system-wide per-semester totals, processed percentage, deadline countdown, and escalation count.
- [ ] Colleges view shows department/college progress and assigned administrators.
- [ ] President escalation queue lists notes and supports approve/return with audit entries.
- [ ] Approval cannot bypass grade, GWA, or document verification hard-blocks.
- [ ] President audit report filters by term, semester, college, and action and exports CSV.

### Honor Roll

- [ ] Preview lists only verified applications for the selected term and semester.
- [ ] Generate creates an immutable snapshot with roll reference, term, semester, generated timestamp, and president.
- [ ] PDF export contains all required applicant fields and reads only snapshot data.

### Flagged Resubmission

- [ ] Student sees flag reasons, notes, and timestamps per semester application.
- [ ] Student can correct grades and replace required documents for a flagged application.
- [ ] Resubmission sets only the target application to `UNDER_REVIEW`, resolves active flags, and writes `RE_SUBMITTED`.
- [ ] Student sees the configured deadline and days remaining.

### Security and Quality

- [ ] President-only resources reject other roles.
- [ ] College representative resources are scoped to the assigned department.
- [ ] Audit log remains append-only.
- [ ] Backend typecheck and tests pass.
- [ ] Frontend typecheck and production build pass.

## Deferred Beyond Sprint 4

- Automated OCR or grade matching against scans.
- Email notifications for escalation, flag, resubmission, or Honor Roll publication.
- Honor Roll publishing/unpublishing workflow beyond immutable generation.
- Multiple simultaneous active terms.
- New college/campus master-data management beyond existing department/campus tables.
- Native mobile application.
