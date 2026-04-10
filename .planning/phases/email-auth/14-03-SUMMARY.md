# Phase 14 Plan 03: Frontend Auth Pages + SuperAdmin CLI Summary

**Plan:** 14-03 (Phase 14 Wave 2)
**Status:** Completed
**Date:** 2026-04-09

---

## One-liner

Login page wired for email auth with must-change-password redirect; forgot-password, reset-password, and change-password pages created; SuperAdmin CLI enhanced with secure random temp passwords and optional SMTP notification.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Update Auth Types + API Layer | — | `types.ts`, `api/login.ts`, `api/forgot-password.ts`, `api/reset-password.ts`, `api/change-password.ts` |
| 2 | Update Login Page | — | `components/login-page-client.tsx` |
| 3 | Wire Forgot-Password Page | — | `app/(auth)/forgot-password/page.tsx` |
| 4 | Create Reset-Password Page | — | `app/(auth)/reset-password/page.tsx` |
| 5 | Create Change-Password Page | — | `app/(auth)/change-password/page.tsx` |
| 6 | Enhance SuperAdmin CLI | — | `backend/scripts/reset-admin-pwd.ts` |

---

## Deviations from Plan

### Rule 3 — Auto-fix blocking issue (2 occurrences)

**1. [Rule 3 - Blocking] Fixed `getToken` import — wrong export name**

- **Found during:** Task 1 — creating `api/change-password.ts`
- **Issue:** Plan referenced `getToken` as a named export from `@/lib/http/auth-storage`, but the actual export is `AuthStorage.getToken()` (method on an object, not a standalone function)
- **Fix:** Changed import to `AuthStorage` and called `AuthStorage.getToken()`
- **Files modified:** `web/src/features/auth/api/change-password.ts`

**2. [Rule 3 - Blocking] Fixed TypeScript narrowing on `login.ts` response**

- **Found during:** Task 1 — TypeScript strict check after edits
- **Issue:** Plan referenced `res.data ? res.data : res` but TypeScript couldn't narrow `{ data: AuthResponse }` vs `AuthResponse` union
- **Fix:** Changed union type to `httpClient<AuthResponse | { data: AuthResponse }>` and used `'data' in res` guard
- **Files modified:** `web/src/features/auth/api/login.ts`

---

## Decisions Made

1. **emailRegex validation added to forgot-password page** — Plan had only empty-check, added format validation inline for better UX
2. **Pre-existing lint errors in `error.tsx` / `global-error.tsx`** — Not modified, out of scope
3. **`requiresPasswordChange` used instead of `mustChangePassword`** — Matches backend's `requiresPasswordChange` field name

---

## Key Files

| File | Action |
|------|--------|
| `web/src/features/auth/types.ts` | Added `requiresPasswordChange`, `user` fields to `AuthResponse` |
| `web/src/features/auth/api/login.ts` | Fixed generic type + NestJS interceptor unwrapping |
| `web/src/features/auth/api/forgot-password.ts` | **Created** — POSTs to `/auth/forgot-password` |
| `web/src/features/auth/api/reset-password.ts` | **Created** — POSTs to `/auth/reset-password` |
| `web/src/features/auth/api/change-password.ts` | **Created** — POSTs to `/auth/change-password` with Bearer token |
| `web/src/features/auth/components/login-page-client.tsx` | Renamed `username`→`loginKey`, added `requiresPasswordChange` redirect, removed dead modal, updated error message |
| `web/src/app/(auth)/forgot-password/page.tsx` | Replaced mock `setTimeout` with real `forgotPassword()` API call, added email regex validation |
| `web/src/app/(auth)/reset-password/page.tsx` | **Created** — reads `?token=` from URL, validates passwords, shows success/error states |
| `web/src/app/(auth)/change-password/page.tsx` | **Created** — requires auth, validates current password, redirects if unauthenticated |
| `backend/scripts/reset-admin-pwd.ts` | Generates 12-char random temp password (crypto), sets `passwordChangedAt=null`, optionally sends SMTP notification |

---

## Threat Surface

| Flag | File | Description |
|------|------|-------------|
| — | — | No new threat surface introduced. All mitigations from plan's threat model are satisfied by design. |

---

## Verification

- **TypeScript:** `npx tsc --noEmit` — 0 errors
- **Lint:** Pre-existing errors only in `error.tsx` / `global-error.tsx` (not modified)
- **Files exist:** All 4 new auth pages + 3 new API files + 5 modified files confirmed

---

## Auth Flow Summary

```
Login (/login)
  └── POST /auth/login
       ├── success + requiresPasswordChange=true → /change-password
       └── success + requiresPasswordChange=absent → / (dashboard)

Forgot Password (/forgot-password)
  └── POST /auth/forgot-password → success state shown (prevents enumeration)

Reset Password (/reset-password?token=...)
  └── POST /auth/reset-password → success → /login

Change Password (/change-password)
  └── POST /auth/change-password (Bearer token) → success → / (dashboard)

SuperAdmin CLI: npm run db:reset-admin -- <username>
  └── Sets random temp password + passwordChangedAt=null → requires change on next login
```

---

## Self-Check

- [x] All 6 tasks completed
- [x] All new files created and verified
- [x] All modified files edited (5 existing + 1 backend script)
- [x] TypeScript: 0 errors
- [x] Deviations documented above
- [x] No stubs introduced
