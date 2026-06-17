# Software Requirements Specification
## NEUST Honor Society Verification System (NHSVS)

**Document ID:** NHSVS-SRS-001  
**Version:** 1.1.0  
**Standard:** ISO/IEC/IEEE 29148:2018  
**Status:** Approved for Development  
**Date:** 2026-06-17  
**Prepared by:** NEUST Honor Society — Design Team  

---

## 1. Introduction

### 1.1 Purpose

This SRS defines the functional and non-functional requirements for the NEUST Honor Society Verification System (NHSVS) — a centralized, web-based internal platform for managing Honor Society membership applications across all colleges and campuses of Nueva Ecija University of Science and Technology (NEUST). It is intended as the authoritative specification for any developer, AI agent, or development team building the system.

### 1.2 Scope

NHSVS replaces the current Google Forms and Google Sheets workflow with a role-gated, database-backed application. It covers the full lifecycle of a membership application: student submission, grade digitization, automated GWA computation, admin split-screen auditing, presidential oversight, and Final Honor Roll generation. 

The system utilizes a unified application wizard that automatically splits "Both Semesters" submissions into separate, independent database records. Eligibility and GWA are calculated strictly on a per-semester basis.

**In scope:** Student portal, college admin audit workspace, president governance dashboard, authentication and role management, document repository, automated per-semester GWA engine, audit trail, Honor Roll export.

**Out of scope:** Integration with the NEUST Registrar SIS API, scholarship processing, alumni tracking, payment/fee collection, native mobile application.

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| GWA | Grade Weighted Average — computed as Σ(grade × units) ÷ Σ(units) |
| COG | Certificate of Grades — official sealed document from the Registrar |
| COR | Certificate of Registration — proof of enrollment and unit load |
| GMC | Good Moral Certificate — character clearance from the Registrar |
| Disqualifier | Any condition that makes an applicant ineligible: INC grade, 5.0 grade, or underloading |
| Threshold | GWA of 1.75 or better (lower numeric value = higher grade in Philippine grading) |
| Honor Roll | The final published list of verified Honor Society members for a given term |
| Term | One academic semester within a school year |
| Applicant | A student who has initiated an NHSVS application for a given term and semester |

### 1.4 Roles

| Role | Description |
|------|-------------|
| `STUDENT` | Self-registered applicant. Submits grades and documents, tracks status. |
| `COLLEGE_ADMIN` | Provisioned by president. Reviews and verifies applicants within one assigned college. |
| `PRESIDENT` | Top-level officer. Manages admins, oversees all colleges, generates Honor Roll. |

### 1.5 Assumptions and Constraints

- No direct Registrar API exists. All grade verification is based on student-uploaded sealed document scans compared visually by admins.
- Because NEUST does not issue official student email addresses, students self-register using personal email addresses (e.g., Gmail, Yahoo).
- Student number formats vary across different NEUST campuses; validation must remain flexible.
- The system is internal to NEUST and not publicly accessible.
- Philippine grading scale applies: 1.0 (highest) to 5.0 (lowest). INC denotes incomplete.
- A student must maintain a full academic load (minimum units as defined per term by the president in system settings).

---

## 2. System Overview

NHSVS follows a **Digitized Audit Model**:

1. Students self-enroll and enter their grades manually from sealed COG documents.
2. The UI allows selection of 1st Semester, 2nd Semester, or Both Semesters. If "Both" is selected, the system UI collects details for both semesters in separate steps and automatically splits them into independent backend records.
3. The system computes GWA per semester and flags disqualifiers in real time.
4. Students upload scans (COG, COR, GMC).
5. College admins verify each semester's application independently using a split-screen interface showing the uploaded scan alongside the system-computed data.
6. Admins verify, flag (with reason codes), or escalate to the president.
7. The president monitors cross-campus progress and generates the Final Honor Roll from verified records.

### 2.1 System Architecture (High-Level)

```
┌─────────────────────────────────────────────────┐
│                   Web Client                     │
│   Student Portal │ Admin Workspace │ Pres. Dashboard │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│               Application Server                 │
│  Auth │ GWA Engine │ Role Guard │ Audit Logger   │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│            Relational Database (3NF)             │
│  users │ applications │ grades │ documents │     │
│  flags │ audit_log │ terms │ honor_rolls         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              File Storage Service                │
│         COG / COR / GMC scan uploads             │
└─────────────────────────────────────────────────┘
```

---

## 3. Stakeholder Requirements

| ID | Stakeholder | Need |
|----|-------------|------|
| STK-01 | Student | Know that applications were received, track status, understand flag reasons per semester |
| STK-02 | College Admin | Verify applicants without tab-switching; trust per-semester GWA calculation; have a defensible decision record |
| STK-03 | President | Monitor all colleges in real time; enforce rules uniformly; produce a tamper-evident Honor Roll |
| STK-04 | NEUST Administration | Receive an auditable, institutional-grade record of verified members |

---

## 4. Functional Requirements

### 4.1 Authentication and Access Control

| ID | Requirement |
|----|-------------|
| AUTH-01 | The system shall provide a public landing page with separate entry paths for student registration and officer login. |
| AUTH-02 | Students shall self-register using any valid personal email address and their campus-assigned student number. The student number input field shall accept alphanumeric characters, hyphens, and slashes of varying lengths (5 to 25 characters) without rigid format matching. |
| AUTH-03 | Email verification via an OTP or registration activation link shall be required before a student account is activated. |
| AUTH-04 | `COLLEGE_ADMIN` and `PRESIDENT` accounts shall only be created by a `PRESIDENT` via the admin provisioning interface. Self-registration for these roles is not permitted. |
| AUTH-05 | The system shall send a password-setup invite link to provisioned officer accounts. |
| AUTH-06 | On login, the system shall route the authenticated user to the correct dashboard based on their role: student portal, admin workspace, or president dashboard. |
| AUTH-07 | Sessions shall expire after 30 minutes of inactivity. The user shall be shown a session-expiry screen and redirected to the login page. |
| AUTH-08 | The system shall return a 403 Unauthorized screen if a user attempts to access a route outside their role's permission scope. |
| AUTH-09 | Forgot-password recovery shall be available via a reset link sent to the registered email. |
| AUTH-10 | The system shall enforce password minimum requirements: 8+ characters, containing at least one letter and one number. |

### 4.2 Term Configuration

| ID | Requirement |
|----|-------------|
| TERM-01 | The `PRESIDENT` shall be able to configure the active academic term, including school year, semesters open for application (1st, 2nd, or Both), GWA threshold, minimum unit load, and Honor Roll deadline. |
| TERM-02 | Students shall only be able to submit applications when an active term is configured. If no active term exists, the portal shall display an "Applications are closed" screen. |
| TERM-03 | Term settings shall take effect immediately upon save. |

### 4.3 Student — Application Submission

| ID | Requirement |
|----|-------------|
| STU-01 | A student shall complete application in a sequential step-by-step wizard: Profile → Semester selection → Grade entry → Document upload. |
| STU-02 | Students shall select whether they are applying for the 1st semester, 2nd semester, or both semesters of the active school year. |
| STU-03 | The system shall prevent a student from submitting a duplicate application for the same semester within the active term. If an application for that specific semester already exists, the system shall redirect the student to the status tracking screen. |
| STU-04 | The grade entry interface shall accept: subject name, unit count (integer 1–6), and grade value. The UI shall strictly limit the grade selection dropdown to the following valid grades: 1.0, 1.25, 1.50, 1.75, 2.00, 5.0, INC. Grades lower than 2.00 (e.g. 2.25, 2.50, 2.75, 3.00) are blocked at the UI level. |
| STU-05 | GWA shall be computed and displayed in real time per semester as grades are entered, using the formula: `GWA = Σ(grade × units) / Σ(units)`. GWA values are calculated and tracked independently per semester; there is no cumulative GWA calculation. |
| STU-06 | If the student selects "both semesters," the UI shall present separate grade entry tabs for each semester. Upon submission, the system's backend API shall automatically split this unified submission into **two separate, independent application records** (one for the 1st semester and one for the 2nd semester). |
| STU-07 | If a grade of `5.0` or `INC` is entered, the system shall immediately display a disqualifier warning banner. The submission may still proceed (to allow the admin to review), but the warning shall persist. |
| STU-08 | If total enrolled units in a semester fall below the configured minimum unit load, the system shall flag underloading and display a warning. |
| STU-09 | The document upload step shall require: one COR (valid for both), one COG per applied semester (COG_1ST and/or COG_2ND), and one GMC (valid for both). For "both semesters" submissions, the backend shall link the single uploaded COR and GMC records to both generated application entries. |
| STU-10 | The system shall display a sealed document notice at the point of upload: documents must bear the Registrar's official dry seal or wet signature. |
| STU-11 | Upon successful submission, the system shall generate and display a unique application reference number for each created application record in the format `HS-[YY][SEM]-[STUDENT_NO]`. |

### 4.4 Student — Status Tracking

| ID | Requirement |
|----|-------------|
| STA-01 | The student portal shall display a real-time application timeline for each submitted semester application with the following states: `Submitted → Under Review → Flagged / Verified → Final Honor Roll`. |
| STA-02 | Each timeline state shall include a timestamp when it was entered. |
| STA-03 | If an application is flagged, the student shall see: all reason codes applied, the admin's note for each reason, and an action interface to correct and re-submit the specific semester's details. |
| STA-04 | Flag reason codes shall include at minimum: `DOC-001` (scan unreadable), `GRD-002` (grade mismatch), `DOC-003` (missing document), `GRD-004` (INC grade), `GRD-005` (underloading), `OTH-006` (other). |
| STA-05 | On re-submission after a flag, the target application state shall return to `Under Review` and the admin queue shall be updated. The status of the student's other semester application (if any) shall remain unaffected. |
| STA-06 | The student portal shall display the Honor Roll deadline and days remaining. |

### 4.5 College Admin — Audit Workspace

| ID | Requirement |
|----|-------------|
| ADM-01 | The admin dashboard shall display summary statistics for their assigned college: total applicants, pending, verified, flagged. These counts treat each semester application as an independent unit. |
| ADM-02 | The applicant queue shall support filtering by semester (1st, 2nd) and status (All, Pending, Verified, Flagged). |
| ADM-03 | The audit workspace shall display a persistent split-screen layout: left pane shows the uploaded document scans (with tab selectors for COG, COR, and GMC); right pane shows the system-computed grade table for the selected semester, computed GWA, and document completeness chips. |
| ADM-04 | The right pane shall include a per-subject match indicator (✓/✕) comparing the student's entered grade against the visible scan. |
| ADM-05 | The Verify button shall be disabled (hard-blocked) if any of the following conditions exist: a disqualifying grade (INC or 5.0) is present, required documents for the semester are missing, or unit load is below the minimum threshold. |
| ADM-06 | The Flag action shall open a modal requiring the admin to: select at least one reason code, and enter a mandatory text note before the flag is saved. |
| ADM-07 | The Escalate action shall route the application to the president's escalation queue, with the admin's note attached. |
| ADM-08 | All admin actions (verify, flag, escalate) shall be immediately and automatically recorded in the audit log with actor ID, timestamp, applicant ID, and action type. No separate "save" step is required. |
| ADM-09 | The admin shall only have access to applicants within their assigned college. Cross-college access is not permitted. |

### 4.6 President — Governance Dashboard

| ID | Requirement |
|----|-------------|
| PRE-01 | The president's overview page shall display system-wide statistics: total applicants, pending, verified, flagged — aggregated across all colleges (measured per individual semester application). |
| PRE-02 | The colleges page shall display a per-college breakdown showing college name, assigned admin, pending count, verified count, flagged count, and a visual progress bar. |
| PRE-03 | The overview shall include a deadline tracker showing days remaining and overall percentage of applicants processed. |
| PRE-04 | The escalation queue shall list all applicants escalated by college admins, with the admin's attached note, and options to Approve or Return to admin. |
| PRE-05 | The Honor Roll page shall display all verified applicants across all colleges with their student number, college, semester, system GWA, and the admin who verified them. |
| PRE-06 | The president shall be able to generate a Final Honor Roll export containing all verified applicants for a given semester/term, with a system-generated timestamp, term identifier, and president name as approver. |
| PRE-07 | The audit report page shall display a full cross-college, cross-admin action log filterable by term, semester, college, and action type, and shall be exportable. |

### 4.7 Admin Provisioning

| ID | Requirement |
|----|-------------|
| PROV-01 | The president shall be able to create officer accounts from Settings → Admin management by providing: full name, NEUST officer email (`@neust.edu.ph`), assigned college, and role (`COLLEGE_ADMIN` or `CO_PRESIDENT`). |
| PROV-02 | Upon creation, the system shall send a password-setup invite link to the officer's email. The account shall remain in `INVITE_PENDING` state until activated. |
| PROV-03 | The president shall be able to resend an invite for accounts in `INVITE_PENDING` state. |
| PROV-04 | The president shall be able to edit an officer's assigned college or role. |
| PROV-05 | The president shall be able to deactivate an officer account, immediately revoking their login access. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement |
|----|-------------|
| PER-01 | GWA shall be recalculated and displayed within 200ms of a grade entry event. |
| PER-02 | Page load time for all dashboard views shall not exceed 2 seconds under normal load. |
| PER-03 | Document uploads shall support files up to 5 MB. Accepted formats: PDF, JPG, PNG. |

### 5.2 Security

| ID | Requirement |
|----|-------------|
| SEC-01 | All HTTP traffic shall be served over HTTPS (TLS 1.2 minimum). |
| SEC-02 | Passwords shall be stored as salted hashes (bcrypt, minimum cost factor 12). |
| SEC-03 | All API endpoints shall enforce role-based access control (RBAC). A `STUDENT` token shall never return admin-scoped data. |
| SEC-04 | Document storage URLs shall be non-guessable and access-controlled. Direct URL access without an authenticated session shall return 403. |
| SEC-05 | The audit log shall be append-only. No role, including `PRESIDENT`, shall be able to modify or delete audit entries. |
| SEC-06 | Input fields accepting grade values shall be validated server-side against the allowed value set: `['1.0', '1.25', '1.50', '1.75', '2.00', '5.0', 'INC']`. If any grade numerically greater than `2.00` (except the explicit `5.0` and `INC` tokens) is supplied, the server shall return a `422 Unprocessable Entity` response. |

### 5.3 Reliability and Data Integrity

| ID | Requirement |
|----|-------------|
| REL-01 | The database schema shall enforce 3NF to prevent data anomalies. |
| REL-02 | GWA computation shall be performed server-side. Client-side display values are for preview only; the server value is authoritative. |
| REL-03 | The system shall enforce unique constraints on `(student_id, term_id, semester)` in the applications table to prevent duplicate applications for any single semester per term. |
| REL-04 | Honor Roll exports shall be generated as read-only snapshots. Post-export edits to underlying records shall not retroactively alter a generated roll. |

### 5.4 Usability

| ID | Requirement |
|----|-------------|
| USE-01 | The student portal shall function on modern mobile browsers (iOS Safari 15+, Android Chrome 100+). |
| USE-02 | All form validation errors shall display inline, adjacent to the offending field, with human-readable messages. |
| USE-03 | The audit workspace split-screen shall render correctly at viewport widths of 1024px and above. |
| USE-04 | Status transitions visible to the student shall update without requiring a page refresh. |

---

## 6. Data Model

### 6.1 Core Tables

```sql
users (
  id             UUID PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL, -- personal email for students
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  student_number TEXT UNIQUE,          -- alphanumeric format (campus-agnostic)
  role           ENUM('STUDENT','COLLEGE_ADMIN','PRESIDENT','CO_PRESIDENT'),
  college_id     INT REFERENCES colleges(id),
  status         ENUM('ACTIVE','INVITE_PENDING','INACTIVE'),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)

departments (
  id    SERIAL PRIMARY KEY,
  code  TEXT UNIQUE NOT NULL,          -- e.g. 'CEIT'
  name  TEXT NOT NULL
)

terms (
  id              SERIAL PRIMARY KEY,
  school_year     TEXT NOT NULL,        -- e.g. '2024-2025'
  semester        ENUM('1ST','2ND','BOTH'), -- semesters currently accepting applications
  gwa_threshold   NUMERIC(4,2) DEFAULT 1.75,
  min_units       INT DEFAULT 18,
  deadline        DATE NOT NULL,
  is_active       BOOLEAN DEFAULT FALSE
)

applications (
  id            UUID PRIMARY KEY,
  student_id    UUID REFERENCES users(id),
  term_id       INT REFERENCES terms(id),
  semester      ENUM('1ST','2ND'),      -- split independently
  status        ENUM('SUBMITTED','UNDER_REVIEW','FLAGGED','VERIFIED','REJECTED'),
  reference_no  TEXT UNIQUE NOT NULL,   -- unique reference per semester
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by   UUID REFERENCES users(id),
  UNIQUE(student_id, term_id, semester)
)

grades (
  id             SERIAL PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  subject_name   TEXT NOT NULL,
  units          INT NOT NULL CHECK (units BETWEEN 1 AND 6),
  grade          TEXT NOT NULL         -- '1.00', '1.25', '1.50', '1.75', '2.00', '5.0', 'INC'
)

documents (
  id             SERIAL PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  doc_type       ENUM('COR','COG_1ST','COG_2ND','GMC'),
  file_url       TEXT NOT NULL,
  file_size_kb   INT,
  uploaded_at    TIMESTAMPTZ DEFAULT NOW()
)

flags (
  id             SERIAL PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  reason_code    TEXT NOT NULL,
  note           TEXT NOT NULL,
  flagged_by     UUID REFERENCES users(id),
  flagged_at     TIMESTAMPTZ DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
)

audit_log (
  id             SERIAL PRIMARY KEY,
  actor_id       UUID REFERENCES users(id),
  application_id UUID REFERENCES applications(id),
  action         ENUM('SUBMITTED','REVIEWED','VERIFIED','FLAGGED','ESCALATED','RE_SUBMITTED','APPROVED_ESCALATION','RETURNED_ESCALATION'),
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)

honor_rolls (
  id             SERIAL PRIMARY KEY,
  term_id        INT REFERENCES terms(id),
  semester       ENUM('1ST','2ND'),
  generated_by   UUID REFERENCES users(id),
  generated_at   TIMESTAMPTZ DEFAULT NOW(),
  roll_reference TEXT UNIQUE NOT NULL,
  snapshot_json  JSONB NOT NULL        -- immutable copy of verified applicants for this semester
)
```

### 6.2 Computed Field: GWA

GWA is never stored directly. It is computed on demand from the `grades` table for each application record:

```sql
SELECT
  application_id,
  ROUND(
    SUM(
      CASE WHEN grade ~ '^[0-9.]+$'
      THEN CAST(grade AS NUMERIC) * units
      ELSE NULL END
    ) /
    NULLIF(
      SUM(CASE WHEN grade ~ '^[0-9.]+$' THEN units ELSE 0 END), 0
    ),
    2
  ) AS gwa
FROM grades
WHERE application_id = $1
GROUP BY application_id;
```

Any row with grade `INC` or `5.0` triggers the disqualifier flag regardless of GWA value.

---

## 7. API Surface (Summary)

All endpoints require a valid JWT bearer token. Role constraints are noted per route.

```
AUTH
  POST   /auth/register              Public — student registration
  POST   /auth/login                 Public — returns JWT + role
  POST   /auth/verify-email          Public — email token confirmation
  POST   /auth/forgot-password       Public
  POST   /auth/reset-password        Public

TERMS
  GET    /terms/active               STUDENT, COLLEGE_ADMIN, PRESIDENT
  PUT    /terms/:id                  PRESIDENT

APPLICATIONS
  POST   /applications               STUDENT — accepts single or split-both payloads
  GET    /applications/mine          STUDENT — own applications only
  GET    /applications/:id           STUDENT (own) | COLLEGE_ADMIN (own college) | PRESIDENT
  PATCH  /applications/:id/status    COLLEGE_ADMIN, PRESIDENT

GRADES
  POST   /applications/:id/grades    STUDENT
  GET    /applications/:id/grades    COLLEGE_ADMIN (own college), PRESIDENT
  GET    /applications/:id/gwa       All authenticated roles

DOCUMENTS
  POST   /applications/:id/documents STUDENT — multipart upload
  GET    /applications/:id/documents COLLEGE_ADMIN (own college), PRESIDENT

FLAGS
  POST   /applications/:id/flags     COLLEGE_ADMIN
  GET    /applications/:id/flags     STUDENT (own), COLLEGE_ADMIN, PRESIDENT

AUDIT LOG
  GET    /audit-log                  PRESIDENT — all; COLLEGE_ADMIN — own college only

ADMIN MANAGEMENT
  GET    /users/officers             PRESIDENT
  POST   /users/officers             PRESIDENT
  PUT    /users/officers/:id         PRESIDENT
  DELETE /users/officers/:id         PRESIDENT — deactivates, does not delete

HONOR ROLL
  GET    /honor-roll/preview         PRESIDENT
  POST   /honor-roll/generate        PRESIDENT — creates immutable snapshot
  GET    /honor-roll/:id/export      PRESIDENT
```

---

## 8. User Interface Requirements

The following screens shall be implemented. Prototype references are noted for design guidance.

| Screen | Role | Key Behaviour |
|--------|------|---------------|
| Landing page | Public | Two CTAs: Register (student) and Log in. Officer invite link entry point. |
| Registration (3-step) | Public | Profile → Password → Email confirmation. Alphanumeric, flexible student ID field. |
| Login | Public | Email + password. Role-based routing on success. Forgot password link. |
| Forgot / reset password | Public | Email-based reset link flow. |
| Admin invite activation | Officer | Pre-filled email (read-only). Password set. Activates account on submit. |
| Student portal — Apply | STUDENT | 4-step wizard: Profile → Semester Selection (1st, 2nd, Both) → Grades (Split tabs if "Both" is selected) → Documents (COR, GMC, plus relevant COG uploads). Live per-semester GWA strip. Disqualifier banner. |
| Student portal — Status | STUDENT | Timeline view displaying separate independent statuses and timeline tracks if "Both" semesters were submitted. Flagged state shows reason codes, admin note, and re-submission interface for the flagged semester. |
| Admin dashboard | COLLEGE_ADMIN | Stat cards (total/pending/verified/flagged). Recent activity feed. Deadline tracker. |
| Admin applicant queue | COLLEGE_ADMIN | Sortable/filterable table. Status pills. Filter by specific semester. Quick review button. |
| Admin audit workspace | COLLEGE_ADMIN | Left-right split: document scan viewer (COG/COR/GMC tabs) + computed data panel for the selected semester application. Verify / Flag / Escalate actions. Flag modal with required reason code and note. |
| Admin flagged cases | COLLEGE_ADMIN | List of flagged semester applications with reason and date. |
| Admin audit log | COLLEGE_ADMIN | Timestamped log of own actions only. |
| President overview | PRESIDENT | Cross-campus stat cards (tracked per semester application). Per-college progress table. Deadline tracker. Escalation badge. |
| President colleges | PRESIDENT | Per-college detail: admin, pending, verified, flagged, progress bar. |
| President escalations | PRESIDENT | Queue of escalated cases with admin notes. Approve / Return actions. |
| President honor roll | PRESIDENT | Verified applicant table. Filter by semester. Preview and Export PDF. Timestamped on generation. |
| President audit report | PRESIDENT | Full cross-admin log. Exportable. |
| President settings — Term | PRESIDENT | Configure GWA threshold, deadline, semester, min units. |
| President settings — Admins | PRESIDENT | Admin table with status (Active / Invite pending). Add, edit, deactivate. Provisioning form with live invite preview. |
| 403 Unauthorized | All | Role-mismatch screen with return-to-portal action. |
| Session expired | All | Inactivity timeout screen with re-login action. |
| Email unverified | STUDENT | Resend verification link. |
| No active term | STUDENT | Applications closed screen with next-period note. |

---

## 9. Constraints and Implementation Notes

1. **No Registrar API.** The system operates on a trust-but-verify model. Grade accuracy depends on admin visual matching of scans. The system provides the tooling; it cannot automate grade confirmation.

2. **Design A Split-Submission Implementation.** When a student submits an application for "Both Semesters", the API endpoint must perform a transactional batch insert. It creates:
   * Two separate rows in the `applications` table: one for `1ST` semester and one for `2ND` semester.
   * Two sets of `grades` records, linked to their corresponding applications.
   * Relevant `documents` records. The system links the physical storage URLs of the shared `COR` and `GMC` files to both applications to optimize storage space and upload bandwidth.

3. **GWA is server-authoritative.** Client-side GWA display is for UX only. All eligibility decisions are based on server-computed values calculated independently per semester application.

4. **Audit log is immutable.** Implement as append-only at the application layer. The database user executing audit inserts shall not have UPDATE or DELETE privileges on the `audit_log` table.

5. **Honor Roll snapshots are frozen.** When a roll is generated, a JSON snapshot of all included applicants (name, student number, college, semester, GWA, verified by, verified at) is stored in `honor_rolls.snapshot_json`. Future edits to `applications` or `grades` do not affect previously generated rolls.

6. **Disqualifier enforcement is hard-blocked at the API.** `PATCH /applications/:id/status` with `status: VERIFIED` shall return `422 Unprocessable Entity` if any disqualifying condition exists for that application. This cannot be bypassed via direct API calls.

7. **Document access is scoped.** A student may only retrieve document URLs for their own applications. A college admin may only retrieve documents for applicants in their assigned college. The president may retrieve any document.

8. **Role provisioning is top-down only.** There is no public endpoint to assign `COLLEGE_ADMIN` or `PRESIDENT` roles. These can only be set by an authenticated `PRESIDENT` via `/users/officers`.

---

## 10. Acceptance Criteria

The system is considered complete when all of the following pass:

- [ ] A student can register with a personal email, a flexible alphanumeric student number, verify email, and submit a single application representing both semesters with independent grades and documents.
- [ ] On a "Both Semesters" submission, the database creates two independent applications, allowing each semester's status to update and progress in real time independent of the other.
- [ ] Selecting or POSTing a grade numerically greater than 2.00 (except for the explicit `5.0` and `INC` disqualifiers) is blocked in the UI and rejected on the API server with a 422 error.
- [ ] Duplicate applications for the same student, term, and semester are rejected at the database constraint level.
- [ ] A college admin can open the audit workspace, view the COG scan and computed GWA side-by-side, and independently Verify, Flag (with reason + note), or Escalate any semester application.
- [ ] A flagged student sees the reason codes and admin note, can re-upload documents and correct grades, and re-submit the specific flagged application.
- [ ] The president can view cross-campus statistics without any manual data aggregation.
- [ ] The president can provision a new college admin via invite, and the invited admin can activate their account via the emailed link.
- [ ] The president can generate a Final Honor Roll PDF that includes all verified applicants, is timestamped, and is not retroactively modified by subsequent data changes.
- [ ] The full audit log records every verify, flag, and escalation action with actor and timestamp.
- [ ] Accessing an admin route as a student returns 403. Expired sessions redirect to login.

---

*End of document — NHSVS-SRS-001 v1.1.0*