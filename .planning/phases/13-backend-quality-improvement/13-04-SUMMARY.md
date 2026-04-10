---
phase: "13"
plan: "04"
subsystem: backend
tags: [unit-tests, transfers, users, D-08]
dependency_graph:
  requires: ["13-03"]
  provides: ["D-08 unit test coverage for TransfersService and UsersService"]
  affects: ["backend/src/transfers/transfers.service", "backend/src/users/users.service"]
tech_stack:
  added: [Jest, NestJS Testing Module, ts-jest]
  patterns: [Mock-driven unit testing, BusinessException assertion, Prisma mock isolation]
key_files:
  created:
    - backend/src/transfers/transfers.service.spec.ts
    - backend/src/users/users.service.spec.ts
decisions:
  - "Used BusinessException with TRANSFER_ERROR_CODES (not NestJS exceptions) to match the refactored service from Plans 01-03"
  - "Used findById instead of findOne for UsersService (matching actual method name)"
  - "Added transferItem.updateMany to Prisma mock for confirm() tests"
  - "Used Role.SUPER_ADMIN for last-admin guard tests"
metrics:
  duration: "~26 minutes"
  tests_written: 47
  test_suites: 2
  files_created: 2
  completed_date: "2026-04-08"
---

# Phase 13 Plan 04: Unit Tests for TransfersService & UsersService (D-08) Summary

## One-liner

Added 47 unit tests covering TransfersService (create, findOne, findAll, cancel, confirm, updateDestination) and UsersService (findByUsername, findById, findAll, create, update, remove, restore) — all passing.

## What Was Done

### Task 1: TransfersService unit tests
- **File:** `backend/src/transfers/transfers.service.spec.ts`
- **Tests:** 27 tests across 6 describe blocks
- **Coverage:**
  - `create`: source/dest not found (BusinessException SOURCE_NOT_FOUND/DEST_NOT_FOUND), invalid type (INVALID_TYPE), invalid source type (INVALID_REQUEST), successful ADMIN_TO_WORKSHOP transfer, WAREHOUSE_TO_CUSTOMER as COMPLETED
  - `findOne`: not found (NOT_FOUND), ADMIN success, WAREHOUSE_MANAGER ACCESS_DENIED, WAREHOUSE_MANAGER authorized access
  - `findAll`: pagination, WAREHOUSE_MANAGER location filter (OR clause), status/type filters
  - `cancel`: ACCESS_DENIED for non-admin, NOT_FOUND, INVALID_STATUS (CANCELLED status), workshop source tag revert (IN_WORKSHOP), warehouse source tag revert (IN_WAREHOUSE)
  - `updateDestination`: ACCESS_DENIED for non-SUPER_ADMIN, NOT_FOUND, INVALID_STATUS (not PENDING), DEST_NOT_FOUND for invalid new location, SUPER_ADMIN success
  - `confirm`: NOT_FOUND, INVALID_STATUS (not PENDING), manual confirm bypass (all items scanned), partial scans (missing tags separate updateMany call)

### Task 2: UsersService unit tests
- **File:** `backend/src/users/users.service.spec.ts`
- **Tests:** 20 tests across 6 describe blocks
- **Coverage:**
  - `findByUsername`: returns user, returns null for missing
  - `findById`: returns user, throws USER_NOT_FOUND BusinessException
  - `findAll`: default filters, search filter (insensitive), role filter, include_deleted, only_deleted
  - `create`: success, USER_USERNAME_EXISTS on duplicate
  - `update`: success, USER_NOT_FOUND, USER_USERNAME_EXISTS on conflict
  - `remove`: success (soft delete), USER_NOT_FOUND, USER_LAST_ADMIN_DELETE_FORBIDDEN (last SUPER_ADMIN guard)
  - `restore`: success, USER_NOT_FOUND, USER_NOT_DELETED (already active)

## Verification

| Check | Result |
|-------|--------|
| TransfersService 27 tests | PASS |
| UsersService 20 tests | PASS |
| Combined test run | 47/47 PASS |
| TypeScript compilation | Pre-existing errors in DTOs (out of scope) |

## Test Execution

```bash
npx jest --testPathPatterns="(transfers|users).service.spec.ts" --no-coverage
# Test Suites: 2 passed, 2 total
# Tests: 47 passed, 47 total
```

## Deviations from Plan

**1. [Rule 2 - Auto-add] Matched actual BusinessException usage instead of NestJS exceptions**
- **Found during:** Task 1 implementation
- **Issue:** The plan referenced NestJS exceptions (NotFoundException, BadRequestException, ForbiddenException) but the actual transfers.service.ts uses `BusinessException` with `TRANSFER_ERROR_CODES` (a result of the D-01 BusinessException refactoring from Plans 01-03)
- **Fix:** Updated all test assertions to use `rejects.toMatchObject({ response: { error: { code: TRANSFER_ERROR_CODES.XYZ } } })` pattern
- **Files modified:** backend/src/transfers/transfers.service.spec.ts

**2. [Rule 2 - Auto-add] Added missing Prisma mock for transferItem.updateMany**
- **Found during:** Running confirm() tests
- **Issue:** confirm() calls `this.prisma.transferItem.updateMany` but mock only had `findMany`/`createMany`
- **Fix:** Added `transferItem: { updateMany: jest.fn() }` to mockPrismaService
- **Files modified:** backend/src/transfers/transfers.service.spec.ts

**3. [Rule 1 - Bug] Fixed destination mock in source-type validation test**
- **Found during:** Test run
- **Issue:** Test passed same ID for sourceId and destinationId but mock only returned one location
- **Fix:** Added second mockResolvedValueOnce for destination lookup
- **Files modified:** backend/src/transfers/transfers.service.spec.ts

**4. [Rule 1 - Bug] Mocked SUPER_ADMIN count in remove test**
- **Found during:** Running remove() tests
- **Issue:** mockUser has Role.SUPER_ADMIN, remove() checks `adminCount <= 1` — un-mocked count returns 0, triggering false last-admin guard
- **Fix:** Added `mockPrismaService.user.count.mockResolvedValue(2)` before the remove call
- **Files modified:** backend/src/users/users.service.spec.ts

## Threat Flags

None — test files only add mock-based unit test coverage with no new runtime surface.

## Self-Check

| Item | Path | Status |
|------|------|--------|
| TransfersService spec | backend/src/transfers/transfers.service.spec.ts | FOUND |
| UsersService spec | backend/src/users/users.service.spec.ts | FOUND |
| Tests run & pass | Jest (47 tests) | PASS |
| TypeScript compilation | Pre-existing errors only | N/A |
