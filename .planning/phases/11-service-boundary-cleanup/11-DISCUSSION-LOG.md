# Phase 11: Service Boundary Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 11-service-boundary-cleanup
**Areas discussed:** Circular dependency resolution, @app/common scope, ScanningService scope

---

## Circular Dependency

| Option | Description | Selected |
|--------|-------------|----------|
| EventEmitter2 | InventoryService emit event thay vì inject EventsGateway | ✓ |
| Tách EventsModule | Tách thành EventsModule (routing) + NotificationService | |
| ScanningModule owns | ScanningModule + EventEmitter2 cho notifications | |

**User's choice:** Bạn quyết định
**Notes:** User delegated to Claude — EventEmitter2 selected (loose coupling, testable, NestJS best practice)

---

## @app/common Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ scanning-related | ScanDtos, EPC interfaces — shared giữa EventsModule và InventoryModule | ✓ |
| Tất cả cross-module DTOs | Bất kỳ DTO/interface nào được dùng bởi >1 module | |
| Bạn quyết định | Để Claude phân tích codebase | |

**User's choice:** Bạn quyết định
**Notes:** User delegated to Claude — scanning-related only, keeps @app/common focused

---

## ScanningService Scope

| Option | Description | Selected |
|--------|-------------|----------|
| BatchScanService thôi | Đổi tên BatchScanService → ScanningService, scanning/ thành module riêng | ✓ |
| Mở rộng thêm | ScanningService chứa buffer + EPC validation + location tracking | |
| Bạn quyết định | Để Claude phân tích | |

**User's choice:** Bạn quyết định
**Notes:** User delegated to Claude — BatchScanService already complete from Phase 10, no need to expand scope

---

## Claude's Discretion

- Circular dependency: EventEmitter2 pattern (loose coupling, testable)
- @app/common: scanning-related items only (aligned with phase scope)
- ScanningService: BatchScanService with ScanningModule wrapper
- No need to move processBulkScan — stays in InventoryService

## Deferred Ideas

None — discussion stayed within phase scope.
