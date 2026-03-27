---
phase: 11-service-boundary-cleanup
plan: 01
subsystem: backend
tags: [service-boundary,DI,EventEmitter2,circular-dependency]
dependency_graph:
  requires: []
  provides:
    - ScanningModule with BatchScanService
    - @app/common/interfaces/scan.interface.ts with shared types
  affects:
    - EventsModule
    - InventoryModule
    - EventsGateway
tech_stack:
  added:
    - "@nestjs/event-emitter (EventEmitter2 for decoupled events)"
  patterns:
    - EventEmitter2 pub/sub for real-time updates
    - ScanningModule as dedicated module for batch scanning
    - Clean DI boundaries with unidirectional dependencies
key_files:
  created:
    - backend/src/common/interfaces/scan.interface.ts
    - backend/src/scanning/scanning.module.ts
  modified:
    - backend/src/inventory/inventory.module.ts
    - backend/src/inventory/inventory.service.ts
    - backend/src/events/events.module.ts
    - backend/src/events/events.gateway.ts
    - backend/src/app.module.ts
decisions:
  - "InventoryService emits TAGS_UPDATED_EVENT via EventEmitter2 instead of calling EventsGateway directly"
  - "EventsGateway subscribes to TAGS_UPDATED_EVENT in afterInit() lifecycle hook"
  - "ScanningModule imports InventoryModule (not the reverse) to break circular dependency"
  - "EventsModule imports ScanningModule instead of InventoryModule"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-27T15:22:00Z"
---

# Phase 11 Plan 01 Summary: Service Boundary Cleanup

Breaking circular dependency between EventsModule and InventoryModule using EventEmitter2 pub/sub pattern.

## What Was Built

**Shared EPC/Scan Types** (`backend/src/common/interfaces/scan.interface.ts`):
- `EPCData` - EPC data stored in batch scan buffer
- `ScanPayload` - Scan payload received from WebSocket client
- `EPCScanResult` - Enriched scan result returned to WebSocket clients
- `TAGS_UPDATED_EVENT` - Event name constant for EventEmitter2

**ScanningModule** (`backend/src/scanning/scanning.module.ts`):
- Encapsulates BatchScanService
- Imports InventoryModule (for processBulkScan access)
- Exports BatchScanService for use by EventsModule

**Refactored Dependency Flow**:
```
EventsModule → ScanningModule → InventoryModule
                    ↓
            BatchScanService
                    ↓
           InventoryService.processBulkScan()
```

**EventEmitter2 Wiring**:
- InventoryService emits `TAGS_UPDATED_EVENT` via EventEmitter2
- EventsGateway subscribes to `TAGS_UPDATED_EVENT` in `afterInit()` and calls `emitTagsUpdated()` internally

## Verification Results

| Check | Result |
|-------|--------|
| Circular dependency check (`nest deps`) | PASS - No circular dependencies |
| ScanningModule in EventsModule | PASS |
| EventEmitter2 emit in InventoryService | PASS |
| EventEmitter2 subscribe in EventsGateway | PASS |
| EventEmitterModule registered in AppModule | PASS |

## BOUND Requirements Status

| Requirement | Status |
|-------------|--------|
| BOUND-01 (ScanningService extracted) | COMPLETE |
| BOUND-02 (@app/common module) | COMPLETE |
| BOUND-03 (Clean DI boundaries) | COMPLETE |

## Commits

| Hash | Message |
|------|---------|
| e21d39f | feat(11-service-boundary-cleanup): create scan.interface.ts with shared EPC types |
| a37f3ad | feat(11-service-boundary-cleanup): create ScanningModule with BatchScanService |
| fd28745 | refactor(11-service-boundary-cleanup): remove EventsModule import from InventoryModule |
| 9d93fc6 | refactor(11-service-boundary-cleanup): replace EventsGateway with EventEmitter2 in InventoryService |
| 5483978 | refactor(11-service-boundary-cleanup): EventsModule imports ScanningModule instead of InventoryModule |
| 69a0e00 | refactor(11-service-boundary-cleanup): EventsGateway subscribes to EventEmitter2 |
| 380f1d9 | fix(11-service-boundary-cleanup): register EventEmitterModule and fix afterInit method |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Installed @nestjs/event-emitter package**
- **Found during:** Task 4 verification
- **Issue:** Package was missing from dependencies
- **Fix:** Ran `npm install @nestjs/event-emitter --save`
- **Files modified:** package.json, package-lock.json
- **Commit:** 380f1d9

**2. [Rule 3 - Blocking] EventEmitterModule not registered**
- **Found during:** Build verification
- **Issue:** EventEmitter2 requires EventEmitterModule.forRoot() in AppModule
- **Fix:** Added EventEmitterModule.forRoot() to AppModule imports
- **Files modified:** backend/src/app.module.ts
- **Commit:** 380f1d9

**3. [Rule 3 - Blocking] Wrong lifecycle method name**
- **Found during:** Build verification
- **Issue:** OnGatewayInit interface requires `afterInit()` not `onModuleInit()`
- **Fix:** Renamed method from `onModuleInit()` to `afterInit()`
- **Files modified:** backend/src/events/events.gateway.ts
- **Commit:** 380f1d9

## Self-Check: PASSED

All must_haves verified:
- [x] InventoryService uses EventEmitter2 (not EventsGateway injection)
- [x] ScanningModule exists with clean DI boundaries
- [x] @app/common contains shared EPC/Scan DTOs and interfaces
- [x] EventsModule imports ScanningModule (not InventoryModule)
- [x] `nest deps` shows no circular dependency warnings
