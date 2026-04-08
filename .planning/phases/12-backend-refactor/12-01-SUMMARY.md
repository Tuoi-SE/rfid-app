---
phase: 12-backend-refactor
plan: '01'
subsystem: backend
tags: [event-emitter, decoupling, architecture, refactor]
dependency_graph:
  requires: []
  provides: []
  affects:
    - backend/src/orders/orders.service
    - backend/src/transfers/transfers.service
    - backend/src/sessions/sessions.service
    - backend/src/events/events.gateway
tech_stack:
  added: []
  patterns: [EventEmitter2 domain events, dependency inversion]
key_files:
  created: []
  modified:
    - backend/src/common/interfaces/scan.interface.ts
    - backend/src/events/events.gateway.ts
    - backend/src/orders/orders.service.ts
    - backend/src/orders/orders.module.ts
    - backend/src/transfers/transfers.service.ts
    - backend/src/transfers/transfers.module.ts
    - backend/src/sessions/sessions.service.ts
    - backend/src/sessions/sessions.module.ts
    - backend/src/orders/orders.service.spec.ts
decisions:
  - "Use EventEmitter2 pattern - domain services emit events via EventEmitter2, EventsGateway subscribes and forwards to WebSocket"
  - "Remove EventsModule imports from Orders/Transfers/Sessions modules since EventEmitter2 is globally available via EventEmitterModule.forRoot()"
metrics:
  duration: ~5 minutes
  completed: 2026-04-08
  tasks_completed: 6
  files_modified: 9
  commits: 6
---

# Phase 12 Plan 01 Summary: EventsGateway Decoupling

**One-liner:** Decouple EventsGateway from domain services using EventEmitter2 pattern

## What Was Built

Decoupled domain services (OrdersService, TransfersService, SessionsService) from EventsGateway by introducing EventEmitter2 as the intermediary. Domain services now emit domain events via `EventEmitter2.emit()` instead of directly calling `EventsGateway.server.emit()`. EventsGateway subscribes to these events in `afterInit()` and forwards to WebSocket rooms.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add event constants | 776f0d5 | scan.interface.ts |
| 2 | EventsGateway subscriptions | e0d250a | events.gateway.ts |
| 3 | OrdersService refactor | 1ff8591 | orders.service.ts, orders.module.ts |
| 4 | TransfersService refactor | b3cfe53 | transfers.service.ts, transfers.module.ts |
| 5 | SessionsService refactor | 295b6c1 | sessions.service.ts, sessions.module.ts |
| 6 | Test fix | aa6a1af | orders.service.spec.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Test Infrastructure] Fixed OrdersService tests for EventEmitter2 dependency**
- **Found during:** Task 6 verification
- **Issue:** Test failed with "Nest can't resolve dependencies - EventEmitter at index [1]"
- **Fix:** Replaced EventsGateway mock with EventEmitter2 mock, updated test data to pass proper user objects instead of string IDs, added missing location.findFirst mock for create test
- **Files modified:** orders.service.spec.ts
- **Commit:** aa6a1af

## Verification

- `npm run build` - PASSED
- `npm test -- --testPathPatterns="orders|transfers|sessions"` - 7/7 tests PASSED

## Threat Flags

None - refactoring internal architecture without changing external API contracts or introducing new attack surface.

## Known Stubs

None.
