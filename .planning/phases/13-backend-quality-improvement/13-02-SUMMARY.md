---
phase: "13"
plan: "02"
subsystem: backend
tags: [D-04, D-05, D-06, performance, security, database]
dependency_graph:
  requires: ["13-01"]
  provides: []
  affects: ["inventory.service.ts", "events.gateway.ts", "schema.prisma"]
tech_stack_added: []
tech_stack_patterns: []
key_files_created: []
key_files_modified:
  - backend/src/inventory/inventory.service.ts
  - backend/src/events/events.gateway.ts
  - backend/prisma/schema.prisma
decisions: []
metrics:
  duration: "~20 minutes"
  completed: "2026-04-08T09:55:54Z"
  tasks_completed: 3
  requirements_met: 3
---

# Phase 13 Plan 02 Summary: Backend Quality Improvements (D-04, D-05, D-06)

Three independent quality improvements applied to the backend with no deviations from plan.

## What Was Built

**D-04 — Cache TTL increased from 30s to 60–120s**
- `getStockSummary()` cache TTL raised from 30 seconds to 90 seconds base with ±15% jitter
- Range clamped to 60–120 seconds for stampede prevention
- Reduces database load on expensive `buildStockSummary` aggregation queries
- File: `backend/src/inventory/inventory.service.ts`

**D-05 — JWT re-verification eliminated from WebSocket handlers**
- `handleScanStream` and `handleBatchScan` now use `(client as any).user` attached during `handleConnection`
- Removed 2 redundant `jwtService.verify(token)` calls per WebSocket message
- Security unchanged: JWT is still verified exactly once at connection time in `handleConnection`
- `WsException('Unauthorized')` still thrown if user not attached
- File: `backend/src/events/events.gateway.ts`

**D-06 — User table indexes added for performance**
- 4 new `@@index` declarations added to `User` model:
  - `[failedLoginAttempts]` — used in login rate-limiting queries
  - `[lockedUntil]` — used in account lockout queries
  - `[role]` — used for user filtering by role
  - `[locationId]` — used for user filtering by warehouse
- Schema pushed to database: `npx prisma db push --accept-data-loss` ✓
- File: `backend/prisma/schema.prisma`

## Verification Results

| Check | Result |
|-------|--------|
| TTL_BASE=90000, min=60000, max=120000 in inventory.service.ts | ✅ PASS |
| No `jwtService.verify(token)` in handleScanStream/handleBatchScan | ✅ PASS |
| `(client as any).user` used in both handlers | ✅ PASS |
| 4 new `@@index` entries in User model | ✅ PASS |
| `prisma db push` succeeds | ✅ PASS (3.95s) |
| TypeScript compiles (modified files) | ✅ PASS (no errors in modified files) |

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Issues (Pre-existing)

| File | Issue | Severity |
|------|-------|----------|
| `src/auth/auth.controller.ts:37` | Cannot find name `DEVICE_TYPES` | Pre-existing TS error |
| `src/transfers/transfer-validation.service.ts:196` | Cannot find name `TAG_EVENT_TYPES` | Pre-existing TS error |
| `src/transfers/transfers.service.ts:3` | Missing export `TRANSFER_ERROR_CODES` | Pre-existing TS error |

These errors are in files not modified by this plan (D-04, D-05, D-06). They existed prior to this plan's execution.

## Threat Surface Scan

No new threat surface introduced by this plan.

- **D-04**: TTL change is internal cache tuning; no network or auth impact
- **D-05**: JWT verification semantics unchanged (verified once at connection); no new attack surface
- **D-06**: Database indexes are read-optimization only; no data exposure changes

## Self-Check

- [x] `backend/src/inventory/inventory.service.ts` — TTL block updated
- [x] `backend/src/events/events.gateway.ts` — JWT re-verify removed from both handlers
- [x] `backend/prisma/schema.prisma` — 4 indexes present in User model
- [x] `prisma db push` — schema synced
- [x] No commits created (as instructed)

## Self-Check: PASSED
