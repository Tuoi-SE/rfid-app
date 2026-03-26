---
phase: "02-workshop-management"
plan: "02-02"
subsystem: "locations"
tags:
  - "location-crud"
  - "workshop-management"
  - "nestjs"
  - "prisma"
key_files:
  - "backend/src/locations/locations.module.ts"
  - "backend/src/locations/locations.service.ts"
  - "backend/src/locations/locations.controller.ts"
  - "backend/src/locations/dto/create-location.dto.ts"
  - "backend/src/locations/dto/update-location.dto.ts"
  - "backend/src/locations/dto/query-locations.dto.ts"
tech_stack:
  added:
    - "LocationsModule (NestJS)"
    - "LocationsService (CRUD)"
    - "LocationsController (REST)"
  patterns:
    - "CRUD with soft delete"
    - "Role-based access (ADMIN, WAREHOUSE_MANAGER)"
    - "Type filter for workshop listing (D-06)"
dependency_graph:
  requires:
    - "Location model (Phase 1)"
    - "Tag model (Phase 1)"
    - "User model with Role enum"
  provides:
    - "LocationsModule"
    - "Location CRUD API"
  affects:
    - "Location management for WORKSHOP-01"
decisions:
  - "D-03: Only name and address editable, type fixed after creation"
  - "D-04: Cannot delete location that has tags (soft delete only)"
  - "D-06: Filter type=WORKSHOP returns only workshops"
metrics:
  duration: "4 min"
  completed: "2026-03-26"
  tasks: 3
  files: 6
  commits: 1
---

# Phase 02 Plan 02: Location CRUD API - Summary

## Objective

Tạo Location CRUD API với filter type=WORKSHOP (per D-06). Quản lý danh sách xưởng may - CRUD trên Location model với filter type=WORKSHOP.

## One-liner

Location CRUD API with type filter, soft delete, and role-based access control.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create LocationsModule | 16b61cc | backend/src/locations/locations.module.ts |
| 2 | Implement LocationsService | 16b61cc | backend/src/locations/locations.service.ts |
| 3 | Create DTOs and Controller | 16b61cc | backend/src/locations/dto/*.ts, backend/src/locations/locations.controller.ts |

## Artifacts Created

### Backend Module
- `backend/src/locations/locations.module.ts` - Module with LocationsService and LocationsController
- `backend/src/locations/locations.service.ts` - CRUD operations with type filter and soft delete
- `backend/src/locations/locations.controller.ts` - REST endpoints with JWT and role guards
- `backend/src/locations/dto/create-location.dto.ts` - code, name, type, address
- `backend/src/locations/dto/update-location.dto.ts` - name, address only (D-03)
- `backend/src/locations/dto/query-locations.dto.ts` - page, limit, search, type filters

### API Endpoints
- `GET /api/locations` - List with pagination, search, type filter (ADMIN, WAREHOUSE_MANAGER)
- `GET /api/locations/:id` - Get single location with tag count (ADMIN, WAREHOUSE_MANAGER)
- `POST /api/locations` - Create location (ADMIN only)
- `PATCH /api/locations/:id` - Update name/address only (ADMIN only)
- `DELETE /api/locations/:id` - Soft delete if no tags (ADMIN only)

## Truths Verified

- LocationsModule exists and is registered in AppModule
- Prisma schema validates successfully
- TypeScript compiles without errors
- findAll returns only non-deleted locations (deletedAt: null)
- findAll supports type filter (D-06)
- create validates code uniqueness
- update restricts to name/address only (D-03)
- remove soft-deletes and blocks if location has tags (D-04)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed dead code in update() method**
- **Found during:** TypeScript compilation check
- **Issue:** `dto.code !== undefined` and `dto.type !== undefined` caused TS2339 errors because UpdateLocationDto doesn't have these properties
- **Fix:** Removed the explicit checks since UpdateLocationDto only defines `name` and `address` fields. Class-validator decorators already prevent code/type from being passed.
- **Files modified:** backend/src/locations/locations.service.ts

## Commits

- 16b61cc: feat(02-workshop-management): create LocationsModule with CRUD and type filter

## Self-Check

- [x] File backend/src/locations/locations.module.ts exists
- [x] Module registered in app.module.ts
- [x] LocationsService has findAll(), findOne(), create(), update(), remove()
- [x] All DTOs created with proper validation decorators
- [x] Controller has correct endpoints with @Roles() decorators
- [x] Prisma schema validates successfully
- [x] TypeScript compiles without locations errors
- [x] WORKSHOP-01: Quản lý danh sách xưởng may được implement
