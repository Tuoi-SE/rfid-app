# Phase 12: backend-refactor - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor backend architecture dựa trên backend-structure-review.md findings:
1. P0: Decouple EventsGateway khỏi domain services (OrdersService, TransfersService, SessionsService)
2. P1: Split oversized services (OrdersService 533 lines, TransfersService ~900 lines)
3. P1: Fix AuthenticatedRequest interface type safety
4. P2: Cleanup items (stale .bak file, duplicate location type arrays)

Thứ tự ưu tiên: P0 → P1 → P2

</domain>

<decisions>
## Implementation Decisions

### EventsGateway Decoupling (P0)
- **D-01:** Use EventEmitter2 pattern — domain services emit events via EventEmitter2, EventsGateway subscribes và forward ra socket. Consistent với Phase 11 (ScanningService extraction).

### Service Splitting Strategy (P1)
- **D-02:** Hybrid approach — đưa ra guideline chung, executor/planner quyết split point hợp lý dựa trên actual code inspection.
- Guideline: Mỗi service nên < 300 lines. Tách validation/helper methods thành separate files nếu cần.

### Priority Ordering (P1 + P2)
- **D-03:** P0 EventsGateway decoupling → hoàn thành trước
- **D-04:** Sau đó P1 (AuthenticatedRequest type + service splitting)
- **D-05:** Cuối cùng P2 (cleanup: .bak file, duplicate arrays)

### AuthenticatedRequest Fix (P1)
- **D-06:** Add `locationId?: string` vào AuthenticatedRequest interface. Vấn đề: WAREHOUSE_MANAGER có locationId trong token nhưng interface không khai báo.

### Cleanup Items (P2)
- **D-07:** Xóa stale `backend/src/casl/casl-ability.factory.ts.bak`
- **D-08:** Move duplicate location type arrays vào `common/constants/location-types.ts`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Review Document
- `reports/backend-structure-review.md` — Source document cho tất cả issues và recommendations

### Prior Phase Context
- `.planning/phases/11-service-boundary-cleanup/11-CONTEXT.md` — Phase 11 đã extract ScanningService với EventEmitter2 pattern, Phase 12 tiếp tục pattern này

### Backend Codebase
- `backend/src/orders/orders.service.ts` — OrdersService (533 lines, cần split)
- `backend/src/transfers/transfers.service.ts` — TransfersService (~900 lines, cần split)
- `backend/src/events/events.gateway.ts` — EventsGateway (target cho decoupling)
- `backend/src/common/interfaces/request.interface.ts` — AuthenticatedRequest interface (thiếu locationId)
- `backend/src/casl/casl-ability.factory.ts.bak` — Stale file cần xóa

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- Phase 11 đã dùng EventEmitter2 để decouple ScanningService khỏi EventsGateway
- NestJS EventEmitterModule.forRoot() đã được configure global trong app.module.ts
- common/ folder đã có constants/ structure (có thể thêm location-types.ts)

### Integration Points
- OrdersService, TransfersService, SessionsService đều inject EventsGateway
- EventsGateway emit ra socket rooms: `scan:live`, `admin:dashboard`
- Real-time events: `tagsUpdated`, `liveScan`, `scanDetected`, `inventoryUpdate`, `sessionCreated`, `orderUpdate`, `transferUpdate`

### Reusable Assets
- EventEmitter2 đã import và dùng trong Phase 11
- PaginationHelper, BusinessException, HttpExceptionFilter — all in common/ folder

</code_context>

<specifics>
## Specific Ideas

- EventsGateway vẫn giữ nguyên interface — chỉ thay đổi cách services gọi nó (qua EventEmitter2 thay vì direct inject)
- Không đổi Socket.IO rooms hay event names
- Service splitting nhắm đến maintainability, không thay đổi public API contracts

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
- Stale backup file và duplicate arrays — được fold vào P2 của phase này

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-backend-refactor*
*Context gathered: 2026-04-08*
