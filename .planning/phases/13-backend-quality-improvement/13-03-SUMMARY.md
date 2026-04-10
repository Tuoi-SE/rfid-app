# Phase 13 Plan 03: Backend Quality Improvement — Summary

**Plan:** 13-03
**Phase:** 13 — Backend Quality Improvement
**Status:** Complete (no commit per user instruction)
**TypeScript compile:** Clean — zero errors

---

## Objective

Three independent technical debt fixes executed in parallel:
- **D-07:** Align env.validation.ts with auth.service.ts env vars
- **D-09:** Extract magic strings to constants
- **D-10:** Cache getAuthorizedLocationIds in request context

---

## Tasks Executed

### Task 1 — D-07: Env Validation Alignment ✅

**File:** `backend/src/common/config/env.validation.ts`

**Change:** Replaced mismatched env var names with the names `auth.service.ts` actually reads:

| Removed (wrong) | Added (correct) |
|-----------------|-----------------|
| `JWT_EXPIRES_IN` | `JWT_ACCESS_EXPIRATION` |
| `JWT_REFRESH_EXPIRES_IN` | `JWT_REFRESH_EXPIRATION_DAYS` |

**Verification:** `grep` confirms new names present, old names absent. TypeScript compiles clean.

---

### Task 2 — D-09: Magic Strings Extraction ✅

**New file:** `backend/src/common/constants/error-codes.ts`

Exports four constant groups:
- `DEVICE_TYPES.WEB`, `DEVICE_TYPES.MOBILE`
- `TRANSFER_CODE_PREFIX = 'TRF-'`
- `TAG_EVENT_TYPES.RECALLED`
- `TAG_CONDITIONS.GOOD`
- `TRANSFER_ERROR_CODES` (added to support existing usage in `transfers.service.ts` from a prior plan)

**Files updated:**

| File | Change |
|------|--------|
| `backend/src/auth/auth.service.ts` | `deviceType: string = 'WEB'` → `deviceType: string = DEVICE_TYPES.WEB` |
| `backend/src/auth/auth.controller.ts` | `dto.deviceType \|\| 'WEB'` → `dto.deviceType \|\| DEVICE_TYPES.WEB` |
| `backend/src/transfers/transfers.service.ts` | `'TRF-'` → `TRANSFER_CODE_PREFIX`, `'GOOD'` → `TAG_CONDITIONS.GOOD` |
| `backend/src/transfers/transfer-validation.service.ts` | `'RECALLED'` → `TAG_EVENT_TYPES.RECALLED` |

**Verification:** All 5 magic string grep checks return 0 matches. TypeScript compiles clean.

---

### Task 3 — D-10: Request-Scoped Location Cache ✅

**File:** `backend/src/transfers/transfer-location.service.ts`

**Change:**
1. Added `Scope` to `@Injectable` decorator: `@Injectable({ scope: Scope.REQUEST })`
2. Added private field `private authorizedLocationIdsCache?: string[]`
3. Modified `getAuthorizedLocationIds()` to check cache first, populate it on first call

```typescript
@Injectable({ scope: Scope.REQUEST })
export class TransferLocationService {
  private authorizedLocationIdsCache?: string[];

  async getAuthorizedLocationIds(locationId?: string): Promise<string[]> {
    if (this.authorizedLocationIdsCache !== undefined) {
      return this.authorizedLocationIdsCache;
    }
    const result = await getAuthorizedLocationIds(this.prisma, locationId);
    this.authorizedLocationIdsCache = result;
    return result;
  }
}
```

**How it works:** NestJS REQUEST scope creates a fresh DI instance per HTTP request. The private field lives for the duration of that request — automatically cleared when the request ends. This means `findAll()`, `findOne()`, and `confirm()` (all call `getAuthorizedLocationIds()`) now share the same DB query result within a single request.

**Verification:** `grep authorizedLocationIdsCache` confirms. TypeScript compiles clean.

---

## Deviations from Plan

### Auto-fixed Issues

**[Rule 2 - Missing Critical Functionality] Missing imports discovered during TypeScript compile**

- **Found during:** TypeScript compilation after initial edits
- **Issue:** Three files (`auth.controller.ts`, `transfer-validation.service.ts`) used constants (`DEVICE_TYPES`, `TAG_EVENT_TYPES`) without adding the import. Also, `transfers.service.ts` already used `TRANSFER_ERROR_CODES` from a prior plan, which didn't exist in the new `error-codes.ts`.
- **Fix:** Added the three missing import lines and added `TRANSFER_ERROR_CODES` to `error-codes.ts`
- **Files modified:** `auth.controller.ts`, `transfer-validation.service.ts`, `error-codes.ts`
- **Result:** Clean TypeScript compile — zero errors

---

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| None | — | No new security surface introduced. Changes are refactoring-only (constants, caching). |

---

## Key Files Modified

| File | Plan | Change |
|------|------|--------|
| `backend/src/common/config/env.validation.ts` | D-07 | Renamed 2 env var fields |
| `backend/src/common/constants/error-codes.ts` | D-09 | Created with 5 constant groups |
| `backend/src/auth/auth.service.ts` | D-09 | Replaced `'WEB'` with `DEVICE_TYPES.WEB` |
| `backend/src/auth/auth.controller.ts` | D-09 | Replaced `'WEB'` fallback with `DEVICE_TYPES.WEB` |
| `backend/src/transfers/transfers.service.ts` | D-09 | Replaced `'TRF-'`, `'GOOD'` with constants |
| `backend/src/transfers/transfer-validation.service.ts` | D-09 | Replaced `'RECALLED'` with `TAG_EVENT_TYPES.RECALLED` |
| `backend/src/transfers/transfer-location.service.ts` | D-10 | Added REQUEST scope + per-request cache |

---

## Verification Results

| Check | Result |
|-------|--------|
| `tsc --noEmit --skipLibCheck` | ✅ Zero errors |
| `grep JWT_ACCESS_EXPIRATION` in env.validation.ts | ✅ Found |
| `grep JWT_REFRESH_EXPIRATION_DAYS` in env.validation.ts | ✅ Found |
| `grep JWT_EXPIRES_IN` in env.validation.ts | ✅ Not found (removed) |
| `grep 'WEB'` defaults in auth files | ✅ Not found |
| `grep 'TRF-'` in transfers.service.ts | ✅ Not found |
| `grep 'RECALLED'` in transfer-validation.service.ts | ✅ Not found |
| `grep authorizedLocationIdsCache` | ✅ Found |

---

## Self-Check

- [x] All 7 files created/modified exist on disk
- [x] TypeScript compilation passes with zero errors
- [x] All success criteria from PLAN.md verified
- [x] Deviations documented above
- [x] No untracked files left behind
- [x] No stubs introduced
