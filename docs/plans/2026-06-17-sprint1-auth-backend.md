# Sprint 1 — Backend Auth: Implementation Plan

**Project:** NEUST Honor Society Verification System (NHSVS)
**Sprint:** 1 (Backend - Authentication & Authorization)
**Date:** 2026-06-17
**Status:** Implemented — see notes for deviations

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Fastify 5 |
| ORM | Drizzle ORM + node-postgres (`drizzle-orm/node-postgres`) |
| Auth | better-auth (Drizzle adapter, email/password) |
| Validation | Zod 4 |
| Language | TypeScript 6 (ESM, `module: "preserve"`) |
| Runner | tsx (dev + production, no build step) |
| Typecheck | `tsc --noEmit` (with `allowImportingTsExtensions: true`) |
| Testing | Vitest (unit tests only so far) |

**Deps installed:** `better-auth`, `@fastify/cookie`, `fastify-plugin`, `pg`, `dotenv`, `zod`, `drizzle-orm`, `@fastify/cors`, `drizzle-kit`, `tsx`, `typescript`, `vitest`, `@biomejs/biome`

---

## Directory Structure

```
backend/
├── .env.example
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── src/
    ├── index.ts                        # Load env, start Fastify + graceful shutdown
    ├── app.ts                          # Build Fastify, register all plugins + error handler
    │
    ├── config/
    │   └── env.ts                      # Zod-validated env loader (includes BETTER_AUTH_SECRET entropy regex)
    │
    ├── db/
    │   ├── index.ts                    # Drizzle client (node-postgres pool → drizzle)
    │   ├── schema/
    │   │   ├── index.ts                # Barrel export
    │   │   ├── departments.ts
    │   │   ├── campus.ts
    │   │   ├── users.ts
    │   │   ├── sessions.ts             # better-auth internal
    │   │   ├── accounts.ts             # better-auth internal
    │   │   └── verifications.ts        # better-auth internal
    │   └── seed.ts                     # NOT YET IMPLEMENTED
    │
    ├── lib/
    │   ├── email.ts                    # Mock email logger
    │   └── errors.ts                   # AppError class hierarchy (401/403/404/409/422)
    │
    ├── auth/
    │   ├── index.ts                    # betterAuth({...}) config
    │   ├── plugin.ts                   # Fastify → better-auth Web API handler bridge
    │   └── guards.ts                   # async requireRole() preHandler + session decorator
    │
    └── modules/
        ├── users/
        │   ├── user.service.ts         # provisionAdmin (inserts user + accounts, duplicate check)
        │   ├── user.service.test.ts    # 3 unit tests (happy + duplicate email + role variant)
        │   ├── user.routes.ts          # POST /api/admin/provision, GET /api/me
        │   └── user.schema.ts          # Zod schemas
        ├── departments.ts              # GET /api/departments (own module for cohesion)
        └── campus.ts                   # GET /api/campus (own module for cohesion)
```

---

## Database Schema

### departments

```sql
id        serial PK
code      text NOT NULL UNIQUE
name      text NOT NULL
```

### campus

```sql
id        serial PK
name      text NOT NULL UNIQUE
```

### users (better-auth base + additional fields)

```sql
id                    uuid PK     default gen_random_uuid()
name                  text NOT NULL              -- computed client-side from components
email                 text NOT NULL UNIQUE
email_verified        boolean     default false
image                 text
created_at            timestamptz default now()
updated_at            timestamptz default now()

first_name            text NOT NULL
middle_name           text                       -- nullable
middle_initial        text                       -- nullable
last_name             text NOT NULL
extension             text                       -- nullable
student_number        text UNIQUE                -- nullable, flexible format
role                  text NOT NULL default 'STUDENT'
campus_id             integer FK → campus.id     -- nullable
department_id         integer FK → departments.id -- nullable
status                text NOT NULL default 'ACTIVE'
```

**Role values:** `STUDENT`, `COLLEGE_ADMIN`, `OFFICER`, `PRESIDENT`
**Status values:** `ACTIVE`, `INVITE_PENDING`, `INACTIVE`

### sessions / accounts / verifications

Standard better-auth Drizzle schema. See better-auth docs for exact column definitions.

---

## better-auth Config (`auth/index.ts`) — Actual Implementation

Key deviations from original plan:

1. **`additionalFields.role` and `additionalFields.status`** use `input: false` — these fields are never set by user input. Role is set server-side during provisioning; status defaults to `ACTIVE` from DB column default.
2. **Password policy hook** uses `createAuthMiddleware` (required for proper `ctx` type inference) instead of a plain `handler`. Guards on `ctx.path === "/sign-up/email"` and `typeof password === "string"` to avoid triggering on password reset.
3. **Drizzle adapter** uses `drizzle-orm/node-postgres` with API `drizzle({ client: pool, schema })` — NOT `drizzle-orm/pg`.
4. **No `defaultValue`** for additional fields in JS — defaults come from DB column defaults.

```ts
// Actual implementation pattern (simplified)
import { createAuthMiddleware } from "better-auth/api";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),

  user: {
    additionalFields: {
      first_name:      { type: "string", required: true },
      middle_name:     { type: "string" },
      middle_initial:  { type: "string" },
      last_name:       { type: "string", required: true },
      extension:       { type: "string" },
      student_number:  { type: "string" },
      role:            { type: "string", input: false },
      campus_id:       { type: "number" },
      department_id:   { type: "number" },
      status:          { type: "string", input: false },
    },
  },

  session: {
    expiresIn: 1800,
    updateAge: 300,
    storeSessionInDatabase: true,
    cookieCache: { enabled: true, maxAge: 300 },
  },

  emailAndPassword: { enabled: true, minPasswordLength: 8, requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => { await sendEmail(user.email, "Reset your password", url); },
  },

  emailVerification: { sendOnSignUp: true, autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => { await sendEmail(user.email, "Verify your email", url); },
  },

  hooks: {
    before: {
      signUp: {
        handler: createAuthMiddleware(async (ctx) => {
          if (ctx.path !== "/sign-up/email") return;
          const password = ctx.body?.password;
          if (typeof password !== "string") return;
          if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
            throw new Error("Password must contain at least one letter and one number");
        }),
      },
    },
  },

  trustedOrigins: [env.CORS_ORIGIN],
});
```

---

## Endpoints

| HTTP | Path | Role | Source | Purpose |
|------|------|------|--------|---------|
| POST | `/api/auth/sign-up/email` | Public | better-auth | Register student |
| POST | `/api/auth/sign-in/email` | Public | better-auth | Login → session + user |
| POST | `/api/auth/sign-out` | Any auth | better-auth | Destroy session |
| GET | `/api/auth/session` | Any auth | better-auth | Current session + user |
| POST | `/api/auth/verify-email` | Public | better-auth | Verify with token from email |
| POST | `/api/auth/forgot-password` | Public | better-auth | Send reset email |
| POST | `/api/auth/reset-password` | Public | better-auth | Set new password with token |
| POST | `/api/admin/provision` | PRESIDENT | custom | Create officer account, send invite |
| GET | `/api/me` | Any auth | custom | Current user profile (from `request.user`, no DB round-trip) |
| GET | `/api/departments` | Any auth | custom | List all departments |
| GET | `/api/campus` | Any auth | custom | List all campuses |

---

## Guards & Service Pattern

### Guards (`auth/guards.ts`) — Actual Implementation

```ts
export async function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) return reply.status(401).send({ error: "Unauthorized" });
    if (!roles.includes(request.user.role))
      return reply.status(403).send({ error: "Forbidden" });
  };
}
```

Note: `requireRole` returns `Promise<FastifyReply | void>` — compatible with Fastify `preHandler`. No `done` callback needed.

### Service Pattern — Actual Implementation

Services import `db` and `auth` via module-level imports (not dependency injection). This simplifies the signature at the cost of harder module mocking in tests (solved via `vi.mock`):

```ts
// modules/users/user.service.ts
import { db } from "@/db";
import { accounts, users } from "@/db/schema/index.ts";
import { ConflictError } from "@/lib/errors.ts";

export async function provisionAdmin(input: ProvisionAdminInput) {
  // 1. Check duplicate email → ConflictError
  // 2. Insert users row
  // 3. Insert accounts row (providerId: "credential")
  // 4. Return { id, email }
}

// modules/users/user.routes.ts — thin HTTP layer
fastify.post("/api/admin/provision",
  { preHandler: requireRole("PRESIDENT") },
  async (request, reply) => {
    const input = provisionAdminSchema.parse(request.body);
    const result = await provisionAdmin(input);
    try {
      await auth.api.requestPasswordReset({ body: { email: input.email, redirectTo: ... } });
    } catch (error) {
      request.log.error(error, "Failed to send invite email");
      return reply.status(201).send({ ...result, inviteEmailFailed: true });
    }
    return reply.status(201).send(result);
  },
);
```

Key implementation details:
- Invite email failure is **non-fatal** — user is created, but `inviteEmailFailed: true` is returned
- `GET /api/me` returns `request.user` directly (populated by session hook) — no DB query
- `setErrorHandler` maps: `ZodError` → 422, `AppError` → status code, unknown → 500

---

## Registration Body

Client computes `name` and sends alongside decomposed components:

```json
{
  "email": "juan@email.com",
  "password": "Secure1pass",
  "name": "Juan M. Dela Cruz Jr.",
  "first_name": "Juan",
  "middle_name": "Martinez",
  "middle_initial": "M.",
  "last_name": "Dela Cruz",
  "extension": "Jr.",
  "student_number": "20-12345"
}
```

**Name computation (client-side):**
```
name = [firstName, middleInitial || middleName, lastName, extension]
  .filter(Boolean)
  .join(" ")
```

---

## Environment Variables

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/honsoc
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## Implementation Order

| # | Step | Files | Status |
|---|------|-------|--------|
| 1 | Scaffold: tsconfig, env, install deps | `tsconfig.json`, `.env.example` | ✅ Done |
| 2 | Config loader | `src/config/env.ts` | ✅ Done |
| 3 | DB schema + Drizzle config | `src/db/schema/*`, `drizzle.config.ts` | ✅ Done |
| 4 | DB connection + seed | `src/db/index.ts`, `src/db/seed.ts` | ⏳ DB connection done; seed not implemented |
| 5 | better-auth instance | `src/auth/index.ts` | ✅ Done |
| 6 | Fastify → better-auth bridge | `src/auth/plugin.ts` | ✅ Done |
| 7 | RBAC guards | `src/auth/guards.ts` | ✅ Done |
| 8 | Email + errors | `src/lib/email.ts`, `src/lib/errors.ts` | ✅ Done |
| 9 | User module | `src/modules/users/*.ts`, `src/modules/departments.ts`, `src/modules/campus.ts` | ✅ Done |
| 10 | App builder + entry | `src/app.ts`, `src/index.ts` | ✅ Done |
| 11 | Unit tests | `src/modules/users/user.service.test.ts` | ✅ Done (3 tests) |
| 12 | Integration tests | `tests/auth.test.ts` | ❌ Not yet started |

---

## Acceptance Criteria

### Verified by Unit Tests (passing)

- [x] `provisionAdmin` inserts user + accounts record, returns `{ id, email }`, `INVITE_PENDING` status
- [x] `provisionAdmin` with duplicate email → `ConflictError`, insert not called
- [x] `provisionAdmin` creates `COLLEGE_ADMIN` when that role specified

### Verified by Typecheck (zero errors)

- [x] `tsc --noEmit` passes with zero errors
- [x] `allowImportingTsExtensions` works with tsx
- [x] `module: "preserve"` resolves `@/` path alias
- [x] Drizzle schema types match better-auth requirements

### Not Yet Verified (need integration tests + DB)

- [ ] Student registers → session returned, `email_verified = false`, all name components stored correctly
- [ ] `name` in DB = computed correctly from components
- [ ] Password `abc123` → rejected (no number)
- [ ] Password `12345678` → rejected (no letter)
- [ ] Password `ab1` → rejected (min 8)
- [ ] Duplicate email → 409
- [ ] Duplicate student_number → unique constraint error
- [ ] Email verification link logged to console
- [ ] Login before verification → blocked
- [ ] Login after verification → session with role, department_id, name components, student_number
- [ ] `/api/me` without token → 401
- [ ] `/api/me` with token → full user profile
- [ ] `/api/admin/provision` as STUDENT → 403
- [ ] `/api/admin/provision` as PRESIDENT → 201, user created with `INVITE_PENDING` status
- [ ] Forgot password → email logged → reset works
- [ ] GET `/api/departments` → returns seeded department list
- [ ] GET `/api/campus` → returns seeded campus list
- [ ] All custom fields present in session and user profile
- [ ] Integration tests pass via `fastify.inject()`

---

## What's NOT in Sprint 1 (still deferred)

- Frontend UI (login/register pages, dashboards) — Sprint 2
- Document upload / file storage
- GWA computation engine
- Student application wizard
- Admin audit workspace
- President governance dashboard
- Honor roll generation
- `GET /api/campus` and `GET /api/departments` data (requires seed)
- Integration tests (`tests/auth.test.ts`)

---

## Implementation Notes & Deviations

| Original Plan | Actual Implementation |
|---------------|----------------------|
| Drizzle driver: `drizzle-orm/pg` | `drizzle-orm/node-postgres` API: `drizzle({ client: pool, schema })` |
| Build step: `tsc` (build) | No build step. tsx for dev + production. `tsc --noEmit` for typecheck |
| `module: "nodenext"` | `module: "preserve"` with `allowImportingTsExtensions: true` |
| Services receive `db` + `auth` as params | Services use module-level imports from `@/db` and `@/auth` |
| `departments.ts` lives in `modules/users/` | Extracted to `modules/departments.ts` (separate module) |
| `campus` routes not planned | Added `modules/campus.ts` and `campus` DB schema |
| Password hook: plain handler | Uses `createAuthMiddleware` with `ctx.path` guard |
| `role`/`status` fields: `input: true` | `input: false` — never set by user |
| Dead `getProfile` function | Removed (was unused) |
| Signal handler: simple | Re-entrancy guard with `closing` flag |
| `BETTER_AUTH_SECRET`: `min(32)` | Added entropy regex (upper + lower + digit) |
| JWT auth | Cookie-based session auth (better-auth default) |

---

## Principle Compliance

| Principle | How the plan delivers |
|-----------|----------------------|
| **KISS** | No unnecessary abstraction layers. No `services/`, `repositories/`, `middleware/`. Flat domain structure |
| **Modular** | Each domain in its own folder. `auth/` is fully self-contained — swappable without touching other code |
| **Flexible** | Adding a domain = adding a folder. No existing code changes. Email can swap mock→real in one file |
| **Maintainable** | One responsibility per file. Service + routes + schema + test per domain |
| **DRY** | `requireRole()` is one reusable preHandler. Zod schemas are single source of truth for validation |
| **Loose coupling** | Services depend on `db` and `auth` — both stable, narrow interfaces. Routes are thin HTTP layers |
| **High cohesion** | All user logic in `modules/users/`. A user change requires opening only that folder |
| **Robust** | Zod crashes fast on misconfiguration. 401 vs 403 semantics. DB constraints enforce uniqueness. Signal re-entrancy guard |
| **Not overengineered** | Departments and campus each get own file. No DI container or abstract interfaces |
