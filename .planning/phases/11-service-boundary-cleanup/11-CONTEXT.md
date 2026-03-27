# Phase 11: Service Boundary Cleanup - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Tách scanning logic thành dedicated ScanningModule với clean DI boundaries, tạo @app/common cho shared DTOs/interfaces, phá vỡ circular dependency giữa EventsModule và InventoryModule.

</domain>

<decisions>
## Implementation Decisions

### Circular Dependency Resolution
- **D-01:** EventEmitter2 pattern — InventoryService emit event thay vì inject EventsGateway trực tiếp
- **D-02:** EventsModule chỉ đảm nhận WebSocket routing, không có business logic inventory
- **D-03:** Notification events (tagsUpdated) được emit qua EventEmitter2, không có circular import

### @app/common Module
- **D-04:** @app/common chỉ chứa scanning-related shared items (ScanDtos, EPC interfaces)
- **D-05:** AuthenticatedRequest đã tồn tại trong @app/common/interfaces — không cần thay đổi
- **D-06:** Tạo shared interfaces cho EPC data trong @app/common/interfaces/

### ScanningModule Structure
- **D-07:** BatchScanService đổi tên thành ScanningService (or keep BatchScanService name, module là ScanningModule)
- **D-08:** ScanningModule chứa BatchScanService và processBulkScan integration
- **D-09:** EventsModule imports ScanningModule thay vì InventoryModule (để BatchScanService)
- **D-10:** InventoryModule không còn import EventsModule — EventEmitter2 thay thế

### Service Extraction
- **D-11:** InventoryService.processBulkScan() vẫn giữ nguyên, không di chuyển
- **D-12:** BatchScanService(ScanningService) gọi InventoryService.processBulkScan() qua module imports
- **D-13:** ScanningModule imports InventoryModule để access processBulkScan()

### Dependency Flow After Cleanup
```
ScanningModule ─── imports ───► InventoryModule
      │                              │
      └── BatchScanService           │
              │                      │
              └── processBulkScan ───┘

EventsModule ─── imports ───► ScanningModule
      │                              │
      └── WebSocket routing          └── BatchScanService
```

### Verification
- **D-14:** `nest deps` phải không có circular dependency warnings
- **D-15:** `nest start` chạy không lỗi với DI boundaries mới

### Files to Create/Modify
- `backend/src/scanning/scanning.module.ts` (new — replaces current scanning/ structure)
- `backend/src/common/interfaces/scan.interface.ts` (new — shared EPC types)
- Modify: `backend/src/events/events.module.ts` (remove InventoryModule import, add ScanningModule)
- Modify: `backend/src/inventory/inventory.module.ts` (remove EventsModule import)
- Modify: `backend/src/inventory/inventory.service.ts` (EventEmitter2 instead of EventsGateway)
- Modify: `backend/src/events/events.gateway.ts` (ScanningModule provider)

### Claude's Discretion
- EventEmitter2 approach selected (loose coupling, testable, aligns with NestJS best practices)
- ScanningModule scope: chỉ BatchScanService + processBulkScan integration
- @app/common: chỉ scanning-related shared items (không expand scope)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` § Phase 11 — Success criteria and requirements BOUND-01, BOUND-02, BOUND-03
- `.planning/REQUIREMENTS.md` § Service Boundaries
- `.planning/phases/10-batch-scan-buffer/10-CONTEXT.md — Phase 10 decisions (BatchScanService, EventsModule structure)
- `.planning/phases/07-redis-infrastructure/07-CONTEXT.md — CacheModule global registration pattern
- `.planning/phases/09-cache-integration-inventory-summary/09-CONTEXT.md — InventoryService patterns

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Current Circular Dependency
EventsModule imports InventoryModule (BatchScanService → InventoryService)
InventoryModule imports EventsModule (InventoryService → EventsGateway.emitTagsUpdated)

### Current @app/common Structure
`backend/src/common/` — có config, decorators, entities, exceptions, filters, helpers, interceptors, interfaces
`@app/common/interfaces/request.interface.ts` — AuthenticatedRequest đã tồn tại

### EventsGateway Current Responsibilities
- handleScanStream (WebSocket scan stream)
- handleBatchScan (batch endpoint)
- handleConnection/handleDisconnect
- emitTagsUpdated (gọi từ InventoryService — cần thay bằng EventEmitter2)

### InventoryService Current Responsibilities
- processOperation (check-in/check-out)
- getStockSummary (cached)
- processBulkScan (batch — cần giữ nguyên)
- getHistory

### BatchScanService Current Location
`backend/src/scanning/batch-scan.service.ts` — đã exists từ Phase 10

### NestJS Patterns to Follow
- Module exports what it provides
- EventEmitter2 for cross-module events
- Interface-based DI for testability

</codebase_context>

<specifics>
## Specific Ideas

No specific references — all decisions made during discussion based on code analysis.

</specifics>

<deferred>
## Deferred Ideas

None — all service boundary decisions made within phase scope.

</deferred>

---

*Phase: 11-service-boundary-cleanup*
*Context gathered: 2026-03-27*
