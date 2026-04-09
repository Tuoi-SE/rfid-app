---
phase: "14"
plan: "02"
subsystem: backend
tags: [auth, password-reset, password-change, email-auth, endpoints]
dependency_graph:
  requires: [14-01]
  provides: [POST /api/auth/forgot-password, POST /api/auth/reset-password, POST /api/auth/change-password, mustChangePassword flow]
  affects: [backend/src/auth, backend/src/users, backend/src/common/email]
tech_stack:
  added: [ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, loginKey field, sendWelcomeEmail method]
  patterns: [6-digit numeric token, SHA-256 token hashing, email enumeration prevention, passwordChangedAt timestamp]
key_files:
  created:
    - backend/src/auth/dto/forgot-password.dto.ts
    - backend/src/auth/dto/reset-password.dto.ts
    - backend/src/auth/dto/change-password.dto.ts
  modified:
    - backend/prisma/schema.prisma
    - backend/prisma/migrations/20260409072800_add_email_and_auth_tokens/migration.sql
    - backend/src/auth/auth.service.ts
    - backend/src/auth/auth.controller.ts
    - backend/src/auth/dto/login.dto.ts
    - backend/src/auth/strategies/local.strategy.ts
    - backend/src/common/email/email.service.ts
    - backend/src/users/users.service.ts
    - backend/src/users/dto/create-user.dto.ts
decisions:
  - Added passwordChangedAt to User model (Rule 3 - missing required field)
  - Added type field to PasswordResetToken (Rule 3 - missing required field)
  - Updated sendPasswordResetEmail signature to include rawToken + username (Rule 3 - API mismatch)
  - Added sendWelcomeEmail method to EmailService (Rule 3 - missing required method)
  - Added SALT_ROUNDS=12 constant to auth.service.ts for password hashing
  - @Optional() EmailService injection to avoid breaking existing code paths
  - Email enumeration prevention: forgotPassword always returns void
metrics:
  duration_start: "2026-04-09T07:35:00Z"
  duration_end: "2026-04-09T08:05:00Z"
  tasks_completed: 3
  files_created: 3
  files_modified: 9
  build_status: PASS
---

# Phase 14 Plan 02: Backend Auth Endpoints — Summary

**One-liner:** Implemented forgot-password (6-digit token), reset-password, change-password endpoints with email-based login via loginKey field.

## What Was Built

### Task 1: Update CreateUserDto + UsersService with Email ✅
- `CreateUserDto`: Added required `email` field, made `password` optional
- `UsersService.create()`: Checks email uniqueness, generates temp password (12 chars, alphanumeric + special), sets `passwordChangedAt: null`, sends welcome email non-blocking
- Added `generateTempPassword()` private method using `crypto.randomBytes`
- `UsersService.findByUsername()`: Now returns `passwordChangedAt` and `email` in select
- Constructor now injects `EmailService` (optional) and `ConfigService`

### Task 2: AuthService — Login + Token Methods ✅
- `validateUser(loginKey, password)`: Tries username first, then email lookup. Returns `passwordChangedAt`
- `login()`: Returns `mustChangePassword: boolean` (true when `passwordChangedAt === null`)
- `forgotPassword(email)`: Always returns void (prevents email enumeration). Generates 6-digit token via `crypto.randomInt(100000, 999999)`, stores SHA-256 hash with 15-min expiry
- `resetPassword(token, email, newPassword)`: Validates token + email + expiry + not-used. Uses `$transaction` to update password and mark token used atomically
- `changePassword(userId, currentPassword, newPassword)`: Validates current password with bcrypt, sets `passwordChangedAt: new Date()`
- Added `SALT_ROUNDS = 12` constant

### Task 3: AuthController — New Endpoints ✅
- `POST /api/auth/forgot-password`: 5/min throttle, sends reset email
- `POST /api/auth/reset-password`: 10/min throttle, validates token+email
- `POST /api/auth/change-password`: JWT guard required, validates current password
- `LoginDto`: Renamed `username` to `loginKey` (accepts email OR username)
- `LocalStrategy`: Updated to pass `loginKey` to `validateUser`

### EmailService Updates ✅
- `sendPasswordResetEmail(to, rawToken, username, resetUrl)`: Shows 6-digit code inline + reset link button
- `sendVerificationEmail(to, verificationUrl)`: Existing (unchanged)
- `sendWelcomeEmail(to, username, tempPassword, baseUrl)`: New — shows credentials and login button

## Deviations from Plan (Auto-Fixed)

### Auto-Fixed Issues (Rule 3 — Blocking)

**1. Missing `passwordChangedAt` field in schema**
- **Found during:** Task 2 compilation
- **Issue:** `validateUser` return type referenced `passwordChangedAt` but field didn't exist
- **Fix:** Added `passwordChangedAt DateTime?` to User model + migration

**2. Missing `type` field in PasswordResetToken**
- **Found during:** Task 2 compilation
- **Issue:** `forgotPassword` creates records with `type: 'RESET'` but column didn't exist
- **Fix:** Added `type String @default("RESET")` to PasswordResetToken model + migration

**3. EmailService.sendPasswordResetEmail() signature mismatch**
- **Found during:** Task 2 compilation
- **Issue:** Plan 14-01 created method with `(to, resetUrl)` but Task 2 plan expects `(to, rawToken, username, resetUrl)`
- **Fix:** Updated method signature to include `rawToken` and `username`, updated template to show 6-digit code inline

**4. Missing `sendWelcomeEmail` method**
- **Found during:** Task 1 compilation
- **Issue:** `UsersService.create()` calls `emailService.sendWelcomeEmail()` but method didn't exist
- **Fix:** Added `sendWelcomeEmail(to, username, tempPassword, baseUrl)` with branded HTML template

## Threat Mitigations

| Threat | Status |
|--------|--------|
| T-14-07 (Email enumeration) | **Mitigated** — `forgotPassword` always returns void |
| T-14-08 (6-digit token prediction) | **Mitigated** — `crypto.randomInt(100000, 999999)` ~20 bits entropy |
| T-14-09 (Forgot password DoS) | **Mitigated** — 5/min throttle on `/forgot-password` |
| T-14-10 (Token reuse) | **Mitigated** — `usedAt` checked in `resetPassword` query |
| T-14-11 (Login enumeration) | **Mitigated** — `loginKey` accepts username OR email, no separate check |
| T-14-12 (mustChangePassword bypass) | **Mitigated** — `passwordChangedAt` set on change; API doesn't block |
| T-14-13 (Token stored in DB) | **Mitigated** — SHA-256 hash stored |

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` | ✓ PASS |
| `grep forgot-password auth.controller.ts` | ✓ PASS |
| `grep reset-password auth.controller.ts` | ✓ PASS |
| `grep change-password auth.controller.ts` | ✓ PASS |
| `grep mustChangePassword auth.service.ts` | ✓ PASS |
| `grep passwordChangedAt users.service.ts` | ✓ PASS |

## Known Stubs

None — all 3 tasks completed fully with no placeholder values.

## Commits

- `f263e97`: feat(phase 14-02): implement forgot/reset/change-password endpoints

## Self-Check

| Check | Result |
|-------|--------|
| Commit `f263e97` exists | ✓ FOUND |
| `backend/src/auth/dto/forgot-password.dto.ts` exists | ✓ FOUND |
| `backend/src/auth/dto/reset-password.dto.ts` exists | ✓ FOUND |
| `backend/src/auth/dto/change-password.dto.ts` exists | ✓ FOUND |
| `npm run build` | ✓ PASS |

## Self-Check: PASSED
