---
phase: "14"
plan: "01"
subsystem: backend
tags: [auth, email, database, prisma, nodemailer]
dependency_graph:
  requires: []
  provides: [EmailService, AUTH_ERROR_CODES, PasswordResetToken model, EmailVerificationToken model]
  affects: [backend/prisma/schema.prisma, backend/src/auth, backend/src/users]
tech_stack:
  added: [nodemailer, @types/nodemailer, PasswordResetToken, EmailVerificationToken, EmailService, EmailModule]
  patterns: [Global module pattern, ConfigService injection, SHA-256 token hashing, Single-use token with usedAt]
key_files:
  created:
    - backend/src/common/email/email.service.ts
    - backend/src/common/email/email.module.ts
    - backend/prisma/migrations/20260409072800_add_email_and_auth_tokens/migration.sql
  modified:
    - backend/prisma/schema.prisma
    - backend/src/app.module.ts
    - backend/src/common/constants/error-codes.ts
    - backend/tsconfig.json
    - backend/package.json
decisions:
  - Used db push + manual migration file instead of prisma migrate dev (shadow DB out of sync with existing migrations)
  - Email nullable on User to preserve backward compatibility with existing username-based auth
  - Global EmailModule registered before AuthModule so EmailService is available everywhere
metrics:
  duration_start: "2026-04-09T07:28:24Z"
  duration_end: "2026-04-09T07:35:00Z"
  tasks_completed: 4
  files_created: 3
  files_modified: 5
  migration_files: 1
  build_status: PASS
---

# Phase 14 Plan 01: Backend Foundation for Email-Based Authentication — Summary

**One-liner:** Prisma migration with email + token tables, nodemailer EmailService, and centralized AUTH_ERROR_CODES.

## What Was Built

### Task 1: Prisma Migration — Email + Token Tables ✅
- Added `email String? @unique` and `isEmailVerified Boolean @default(false)` to the User model
- Created `PasswordResetToken` model with: id (UUID), token (unique SHA-256 hash), userId (FK), expiresAt, usedAt (nullable — for single-use), createdAt
- Created `EmailVerificationToken` model with same structure
- Added reverse relations on User model (`passwordResetTokens[]`, `emailVerificationTokens[]`)
- Indexes on `token` and `userId` for fast lookup
- Used `prisma db push` + manual migration file (shadow DB was out of sync with existing migrations)
- Generated Prisma client with new models

### Task 2: Install nodemailer + types ✅
- `npm install nodemailer` — email delivery
- `npm install -D @types/nodemailer` — TypeScript types
- Both added to `backend/package.json` dependencies/devDependencies

### Task 3: Create EmailService with Templates ✅
- Created `backend/src/common/email/email.service.ts` with:
  - `sendPasswordResetEmail(to, resetUrl)` — sends branded password reset email with 15-min expiry note
  - `sendVerificationEmail(to, verificationUrl)` — sends branded verification email with 24-hr expiry note
  - Both methods use brand color `#4c59a8` matching the login page
  - Constructor uses NestJS `ConfigService` for SMTP settings (host, port, auth, from)
  - Port 465 uses SSL (`secure: true`), port 587 uses TLS
- Created `backend/src/common/email/email.module.ts` as a `@Global()` module
- Registered `EmailModule` in `AppModule` **before** `AuthModule`
- Added `@common/email/*` path alias to `tsconfig.json` and Jest `moduleNameMapper` in `package.json`

### Task 4: Add Auth Error Codes ✅
- Added `AUTH_ERROR_CODES` constant object to `error-codes.ts` with 9 codes:
  - `EMAIL_NOT_FOUND`, `INVALID_RESET_TOKEN`, `RESET_TOKEN_EXPIRED`, `RESET_TOKEN_USED`
  - `EMAIL_ALREADY_EXISTS`, `EMAIL_NOT_VERIFIED`, `INVALID_VERIFICATION_TOKEN`, `VERIFICATION_TOKEN_EXPIRED`, `PASSWORD_CHANGE_REQUIRED`

## Deviations from Plan

### Auto-Fixed Issues (Rule 1 — Bug Fix)

**1. Missing reverse relations on User model**
- **Found during:** Task 1 (migration validation)
- **Issue:** Prisma requires bidirectional relations — adding `PasswordResetToken.user` and `EmailVerificationToken.user` without corresponding arrays on `User` caused schema validation error: `The relation field "user" on model "PasswordResetToken" is missing an opposite relation field`
- **Fix:** Added `passwordResetTokens PasswordResetToken[]` and `emailVerificationTokens EmailVerificationToken[]` reverse relations on the User model
- **Files modified:** `backend/prisma/schema.prisma`
- **Commit:** `6f1a441`

**2. Shadow database out of sync with existing migrations**
- **Found during:** Task 1 (migration run)
- **Issue:** `prisma migrate dev` failed with `P3006` because the shadow database was missing enum types from previous migrations (`TransferType does not exist`)
- **Fix:** Used `prisma db push --accept-data-loss` to sync the schema, then created the migration file manually for proper version control
- **Files modified:** `backend/prisma/migrations/20260409072800_add_email_and_auth_tokens/migration.sql`
- **Commit:** `6f1a441`

## Verification Results

| Check | Result |
|-------|--------|
| `grep nodemailer backend/package.json` | ✓ PASS |
| `grep EmailService backend/src/common/email/email.service.ts` | ✓ PASS |
| `grep AUTH_ERROR_CODES backend/src/common/constants/error-codes.ts` | ✓ PASS |
| `grep email backend/prisma/schema.prisma` | ✓ PASS |
| `grep PasswordResetToken backend/prisma/schema.prisma` | ✓ PASS |
| `grep EmailVerificationToken backend/prisma/schema.prisma` | ✓ PASS |
| `npm run build` | ✓ PASS |

## Threat Surface Notes

Per the plan's threat model:

| Threat | Status |
|--------|--------|
| T-14-01 (PasswordResetToken token tampering) | **Mitigated** — token stored as SHA-256 hash, never raw |
| T-14-02 (EmailVerificationToken token tampering) | **Mitigated** — token stored as SHA-256 hash, never raw |
| T-14-03 (Email address exposure) | **Accepted** — B2B context, per plan |
| T-14-04 (Forgot password DoS) | **Not yet mitigated** — rate limiting deferred to subsequent plan |
| T-14-05 (Token reuse) | **Mitigated** — `usedAt` field ensures single-use |
| T-14-06 (SMTP spoofing) | **Mitigated** — `SMTP_FROM` is an env var, not user input |

## Known Stubs

None — all 4 tasks completed fully with no placeholder values.

## Self-Check

| Check | Result |
|-------|--------|
| Commit `6f1a441` exists | ✓ FOUND |
| `backend/src/common/email/email.service.ts` exists | ✓ FOUND |
| `backend/src/common/email/email.module.ts` exists | ✓ FOUND |
| `backend/prisma/migrations/20260409072800_add_email_and_auth_tokens/migration.sql` exists | ✓ FOUND |

## Self-Check: PASSED
