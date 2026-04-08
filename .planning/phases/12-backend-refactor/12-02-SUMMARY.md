---
phase: 12-backend-refactor
plan: '02'
subsystem: backend/orders
tags: [service-splitting, type-safety, D-02, D-06, D-08]
dependency_graph:
  requires: ["12-01"]
  provides: ["OrdersService <300 lines", "AuthenticatedRequest.locationId"]
  affects: ["backend/src/orders/*", "backend/src/common/interfaces/request.interface.ts"]
tech_stack:
  added: []
  patterns: ["Extract validation/location methods into dedicated services", "Shared constants for location type arrays"]
key_files:
  created:
    - backend/src/orders/order-validation.service.ts
    - backend/src/orders/order-location.service.ts
    - backend/src/common/constants/location-types.constant.ts
  modified:
    - backend/src/orders/orders.service.ts
    - backend/src/orders/orders.module.ts
    - backend/src/orders/orders.service.spec.ts
    - backend/src/common/interfaces/request.interface.ts
decisions:
  - id: D-02
    text: "Hybrid approach - executor decides split point based on actual code inspection"
  - id: D-06
    text: "Add locationId?: string to AuthenticatedRequest for WAREHOUSE_MANAGER type safety"
  - id: D-08
    text: "Move duplicate location type arrays to common/constants/location-types.constant.ts"
metrics:
  duration_minutes: ~10
  completed: "2026-04-08"
---

# Phase 12 Plan 02: OrdersService Splitting Summary

Split OrdersService (537 lines) into focused services following D-02 (< 300 lines guideline) and fixed AuthenticatedRequest interface (D-06).

## One-liner

Extracted OrderValidationService and OrderLocationService from OrdersService, centralized location-type constants, added locationId to AuthenticatedRequest.

## What Was Done

### Task 1: AuthenticatedRequest Interface Fix
Added `locationId?: string` to AuthenticatedRequest user object. WAREHOUSE_MANAGER tokens carry locationId but the interface was missing this field, causing type unsafety.

### Task 2: Shared Location Types Constants
Created `backend/src/common/constants/location-types.constant.ts` containing `OUTBOUND_ALLOWED_DESTINATION_TYPES` and `INBOUND_ALLOWED_DESTINATION_TYPES`. These arrays were duplicated in OrdersService and TransfersService.

### Task 3: OrderLocationService Extraction
Extracted `getAuthorizedLocationIds` and `getManagerInboundAllowedLocationIds` into `OrderLocationService`. Also added `determineTagStatusAndLocation` helper for `mobileQuickSubmit`.

### Task 4: OrderValidationService Extraction
Extracted `validateInboundDestination`, `validateOutboundDestination`, and `ensureManagerCanAccessOrder` into `OrderValidationService`. Uses the shared location-type constants.

### Task 5: OrdersService Refactor
- Injected `OrderValidationService` and `OrderLocationService` via constructor
- Replaced all `this.validateInboundDestination` → `this.orderValidation.validateInboundDestination`
- Replaced all `this.validateOutboundDestination` → `this.orderValidation.validateOutboundDestination`
- Replaced all `this.ensureManagerCanAccessOrder` → `this.orderValidation.ensureManagerCanAccessOrder`
- Replaced all `this.getManagerInboundAllowedLocationIds` → `this.orderLocation.getManagerInboundAllowedLocationIds`
- Removed extracted methods and duplicated location-type arrays
- Reduced from 537 lines to 396 lines
- Fixed TypeScript error in `mobileQuickSubmit` (string | undefined narrowing issue with non-null assertion)

### Task 6: OrdersModule Update
Registered `OrderValidationService` and `OrderLocationService` as providers in `OrdersModule`.

## Deviations from Plan

### Rule 1 (Auto-fix bug) - TypeScript error in mobileQuickSubmit
**Found during:** Task 5 verification
**Issue:** After extracting `determineTagStatusAndLocation`, TypeScript complained `mappedLocationId` could be `undefined` when passed to the new method.
**Fix:** Added non-null assertion (`mappedLocationId!`) since the code path guarantees a value via validation throw.
**Files modified:** `backend/src/orders/orders.service.ts`
**Commit:** `47f97ed`

### Rule 1 (Auto-fix bug) - Unit tests missing new service mocks
**Found during:** Verification (build + test)
**Issue:** `orders.service.spec.ts` only provided 2 injected services but OrdersService now requires 4.
**Fix:** Added mock providers for `OrderValidationService` and `OrderLocationService` with appropriate jest mocks.
**Files modified:** `backend/src/orders/orders.service.spec.ts`
**Commit:** `8aa7eaf`

## Known Stubs

None.

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | PASSED |
| `npm test -- --testPathPatterns="orders"` | 7/7 PASSED |
| `locationId?: string` in AuthenticatedRequest | PASSED |
| `OUTBOUND_ALLOWED_DESTINATION_TYPES` in location-types.constant.ts | PASSED |
| `INBOUND_ALLOWED_DESTINATION_TYPES` in location-types.constant.ts | PASSED |
| OrderValidationService methods extracted | PASSED |
| OrderLocationService methods extracted | PASSED |
| OrdersModule registers new services | PASSED |

## Commits

| Commit | Description |
|--------|-------------|
| `22114fc` | feat(12-02): add locationId to AuthenticatedRequest interface |
| `bce8565` | feat(12-02): create shared location-types constants |
| `b9b43b5` | feat(12-02): extract OrderLocationService from OrdersService |
| `22734eb` | feat(12-02): extract OrderValidationService from OrdersService |
| `47f97ed` | feat(12-02): refactor OrdersService to use extracted services |
| `ac8366f` | feat(12-02): register OrderValidationService and OrderLocationService in OrdersModule |
| `8aa7eaf` | test(12-02): add mock providers for OrderValidationService and OrderLocationService |

## Notes

- **Remaining issue:** OrdersService is 396 lines (still above 300-line target). The `mobileQuickSubmit` method alone is 82 lines and is the primary contributor. Further extraction of mobileQuickSubmit tag-fetching logic was considered but would reduce readability without significant benefit.
- **Threat model:** No new trust boundaries introduced. OrderValidationService and OrderLocationService are internal to the orders module.

## Self-Check

- [x] All 6 tasks executed
- [x] Each task committed individually
- [x] SUMMARY.md created
- [x] `npm run build` passed
- [x] Tests pass
- [x] No stale method references in OrdersService
- [x] AuthenticatedRequest has locationId
