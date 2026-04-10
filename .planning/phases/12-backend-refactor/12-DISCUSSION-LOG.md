# Phase 12: backend-refactor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 12-backend-refactor
**Areas discussed:** EventsGateway decoupling, Service splitting strategy, Priority ordering

---

## Area 1: EventsGateway Decoupling (P0)

| Option | Description | Selected |
|--------|-------------|----------|
| A. EventEmitter2 pattern | Domain services emit events, EventsGateway subscribes. Consistent với Phase 11. | ✓ |
| B. Interface abstraction | Tạo IEventEmitter interface, services inject interface | |
| C. Để nguyên như vậy | Chỉ refactor khi cần, tạm thời không đụng | |

**User's choice:** A. EventEmitter2 pattern (Recommended)
**Notes:** Consistent với Phase 11 đã làm với ScanningService

---

## Area 2: Service Splitting Strategy (P1)

| Option | Description | Selected |
|--------|-------------|----------|
| Theo method type (CRUD + Validation) | orders.service → order-crud + order-validation; transfers.service → transfer-crud + transfer-validation | |
| Theo domain (Business logic + Helpers) | Mỗi service tách thành core logic + location/validation helpers riêng | |
| Hybrid (để executor quyết) | Đưa ra guideline chung, để planner/executor quyết split point hợp lý | ✓ |

**User's choice:** Hybrid (để executor quyết)
**Notes:** Executor/planner decide split point hợp lý dựa trên actual code inspection. Guideline: Mỗi service < 300 lines.

---

## Area 3: Priority Ordering (P1 + P2)

| Option | Description | Selected |
|--------|-------------|----------|
| Tất cả cùng lúc (1 phase) | Fix P0 EventsGateway + P1 AuthenticatedRequest + P2 cleanup trong 1 phase | |
| P0 trước, rồi P1+P2 | EventsGateway decoupling → xong trước, rồi mới làm tiếp | ✓ |
| Chỉ P0 + P1, skip P2 | Backend cleanup (bak file, duplicate arrays) để sau | |

**User's choice:** P0 trước, rồi P1+P2
**Notes:** Hoàn thành EventsGateway decoupling trước, sau đó mới làm AuthenticatedRequest fix và service splitting, cuối cùng cleanup items.

---

## Claude's Discretion

- Service split point decisions — left to executor/planner based on actual code inspection
- Specific file structure for split services — executor decides appropriate granularity

## Deferred Ideas

None

---

*Discussion completed: 2026-04-08*
