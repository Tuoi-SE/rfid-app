---
phase: 04-customer-management
plan: "04"
subsystem: backend
tags: [customer-management, outbound-flow, schema, transfer]
dependency_graph:
  requires:
    - phase-02-workshop-management
    - phase-03-warehouse-transfer
  provides:
    - CUSTOMER-01
    - TAGS-05
  affects:
    - backend/prisma/schema.prisma
    - backend/src/transfers/transfers.service.ts
    - backend/prisma/seed.ts
tech_stack:
  added:
    - LocationType: HOTEL, RESORT, SPA
    - TransferType: WAREHOUSE_TO_CUSTOMER
  patterns:
    - 2-step transfer workflow (PENDING -> COMPLETED)
    - Location-based type filtering
    - OUT_OF_STOCK for customer-issued tags
key_files:
  created: []
  modified:
    - backend/prisma/schema.prisma
    - backend/src/transfers/transfers.service.ts
    - backend/prisma/seed.ts
decisions:
  - id: D-17
    description: Added HOTEL, RESORT, SPA to LocationType enum for customer locations
  - id: D-18
    description: Added WAREHOUSE_TO_CUSTOMER to TransferType enum for Phase 5 outbound flow
  - id: D-19
    description: Tags transferred to customer get status=OUT_OF_STOCK on COMPLETED
metrics:
  duration: "~3 min"
  completed: 2026-03-26
  tasks: 3
  files: 3
---

# Phase 04 Plan 04: Customer Management Summary

## One-liner

Customer management foundation with HOTEL/RESORT/SPA location types and WAREHOUSE_TO_CUSTOMER transfer ready for Phase 5 outbound flow.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update LocationType and TransferType enums | edb019e | backend/prisma/schema.prisma |
| 2 | Update TransfersService for WAREHOUSE_TO_CUSTOMER | 39dc6d6 | backend/src/transfers/transfers.service.ts |
| 3 | Seed customer locations | cf1e85f | backend/prisma/seed.ts |

## Changes Made

### Task 1: LocationType and TransferType Enum Updates

**Files Modified:** `backend/prisma/schema.prisma`

- Added `HOTEL`, `RESORT`, `SPA` to `LocationType` enum (D-17)
- Kept `CUSTOMER` for backward compatibility
- Added `WAREHOUSE_TO_CUSTOMER` to `TransferType` enum (D-18)
- Prisma client regenerated successfully

### Task 2: TransfersService WAREHOUSE_TO_CUSTOMER Validation

**Files Modified:** `backend/src/transfers/transfers.service.ts`

**create() validation:**
- Added `WAREHOUSE_TO_CUSTOMER` type validation block
- Validates `source.type === WAREHOUSE`
- Validates `destination.type === HOTEL || RESORT || SPA || 'CUSTOMER'` (backward compat)

**confirm() tag update:**
- Tags transferred to customer get `status = OUT_OF_STOCK` (D-19)
- Other transfers continue to use `status = IN_STOCK`
- Fixed null check for user role validation

### Task 3: Seed Customer Locations

**Files Modified:** `backend/prisma/seed.ts`

Seeded 4 customer locations:
| Code | Name | Type | Address |
|------|------|------|---------|
| KS-HN-01 | Khach San Ha Noi 1 | HOTEL | 123 Nguyen Chi Thanh, Hanoi |
| RS-HN-01 | Resort Ha Noi 1 | RESORT | 456 West Lake, Hanoi |
| SPA-HN-01 | Spa Ha Noi 1 | SPA | 789 Truc Bach, Hanoi |
| KS-HCM-01 | Khach San Ho Chi Minh 1 | HOTEL | 1 Dong Khoi, HCMC |

## Verification Results

| Check | Result |
|-------|--------|
| `npx prisma validate` | PASSED - Schema is valid |
| `npx prisma generate` | PASSED - Client generated |
| TypeScript compilation | PASSED - No errors in modified files |
| Acceptance criteria | All 13 criteria met |

## Success Criteria Status

- [x] LocationType has HOTEL, RESORT, SPA
- [x] TransferType has WAREHOUSE_TO_CUSTOMER
- [x] TransfersService validates WAREHOUSE_TO_CUSTOMER: source=WAREHOUSE, destination=HOTEL/RESORT/SPA
- [x] TransfersService confirm() sets Tag.status=OUT_OF_STOCK for WAREHOUSE_TO_CUSTOMER
- [x] Seed has 4 customer locations (2 HOTEL, 1 RESORT, 1 SPA)

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None - no authentication gates encountered.

## Known Stubs

None.

## Notes

- Phase boundary respected: Only backend changes (schema, transfer service, seed)
- No new UI/API endpoints required - existing Location API with type filter used
- WAREHOUSE_TO_CUSTOMER follows same 2-step workflow as WORKSHOP_TO_WAREHOUSE
- Tags at customer locations tracked via Tag.locationId pointing to customer Location

---

*Plan 04 of Phase 04-customer-management executed successfully*
