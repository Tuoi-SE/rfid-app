# Phase 13: backend-quality-improvement - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Cải thiện backend quality dựa trên backend-evaluation.md findings:
1. BusinessException consistency trong TransfersService
2. Performance fixes: buildStockSummary optimization, processBulkScan batch update, JWT re-verify elimination
3. Missing indexes on User table
4. Env var mismatch alignment
5. Test coverage cho TransfersService và UsersService
6. Magic strings extraction
7. Request-scoped location ID caching

Thứ tự ưu tiên: BusinessException → Performance → Indexes → Env Vars → Testing → Technical Debt

</domain>

<decisions>
## Implementation Decisions

### BusinessException Consistency (P1)
- **D-01:** Replace ALL raw NestJS exceptions (NotFoundException, BadRequestException, ForbiddenException) trong TransfersService bằng BusinessException để đảm bảo error format nhất quán.

### Performance: buildStockSummary (CRITICAL)
- **D-02:** Refactor buildStockSummary() trước processBulkScan — 12+ queries DB trên cache miss là bottleneck lớn nhất.
- **D-03:** Thay `findMany` bằng `groupBy` cho locationTypeCounts (aggregate ở DB thay vì JS memory).
- **D-04:** Tăng cache TTL lên 60-120 giây cho stock summary.

### Performance: JWT Re-verify Elimination
- **D-05:** Dùng `(client as any).user` đã được attach trong handleConnection thay vì verify lại trong handleBatchScan/handleScanStream.

### Missing Indexes
- **D-06:** Thêm indexes chỉ trên User table cho 4 fields: failedLoginAttempts, lockedUntil, role, locationId.

### Env Variable Alignment
- **D-07:** Align env.validation.ts với auth.service.ts — cập nhật env.validation để match với các biến mà auth.service.ts thực sự đọc (JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION_DAYS).

### Test Coverage
- **D-08:** Viết unit tests cho TransfersService và UsersService trước. Ưu tiên các core business logic methods.

### Magic Strings Extraction
- **D-09:** Extract tất cả magic strings thành constants: device types ('WEB', 'MOBILE'), TRF- prefix, 'RECALLED' event type, 'GOOD' condition, role strings.

### Location ID Request Cache
- **D-10:** Cache getAuthorizedLocationIds trong request context — tránh duplicate queries khi WAREHOUSE_MANAGER gọi nhiều methods trong cùng request.

### ProcessBulkScan (deferred sau buildStockSummary)
- **D-11:** Dùng `$executeRaw` batch update thay vì Promise.all cho từng record upsert. Thực hiện SAU buildStockSummary refactor.

### TransferItem Parallel Queries (deferred)
- **D-12:** Parallelize 2 TransferItem queries (pending + completed) với Promise.all. Thực hiện cùng processBulkScan fix.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Review Document
- `reports/backend-evaluation.md` — Source document với tất cả issues và recommendations

### Prior Phase Context
- `.planning/phases/12-backend-refactor/12-CONTEXT.md` — Phase 12 đã fix EventsGateway decoupling và AuthenticatedRequest.locationId
- `.planning/phases/11-service-boundary-cleanup/11-CONTEXT.md` — Phase 11 đã extract ScanningService với EventEmitter2 pattern

### Backend Codebase
- `backend/src/transfers/transfers.service.ts` — Target cho BusinessException replacement
- `backend/src/inventory/inventory.service.ts` — buildStockSummary() target (lines 122-403)
- `backend/src/events/events.gateway.ts` — JWT re-verify target (lines 82-91, 169-182)
- `backend/src/auth/auth.service.ts` — Env vars target
- `backend/prisma/schema.prisma` — Index targets trên User model
- `backend/src/common/exceptions/business.exception.ts` — BusinessException để reuse
- `backend/src/env/env.validation.ts` — Env validation rules

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Established Patterns
- BusinessException đã được dùng nhất quán trong auth.service.ts và users.service.ts
- EventEmitter2 pattern đã được thiết lập trong Phase 11-12
- Prisma $executeRaw available cho raw SQL queries
- Request-scoped caching có thể dùng @InjectScope() hoặc request-level Map

### Integration Points
- TransfersService cần import BusinessException từ common/exceptions/
- buildStockSummary() là private method trong InventoryService
- EventsGateway.handleConnection attach user vào client (line 58)

### Reusable Assets
- BusinessException class đã có trong common/exceptions/
- PaginationHelper, response interceptors đã có trong common/
- Location helper đã được extract trong Phase 12

</codebase_context>

<specifics>
## Specific Ideas

- Không đổi Socket.IO rooms hay event names
- BusinessException replacement giữ nguyên error message content, chỉ thay đổi exception type
- buildStockSummary refactor: giữ nguyên response structure, chỉ tối ưu query execution

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
- processBulkScan batch update — deferred sau buildStockSummary (D-11)
- TransferItem parallel queries — deferred cùng processBulkScan (D-12)
- Pagination max limit enforcement — LOW priority, không trong phase scope này

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-backend-quality-improvement*
*Context gathered: 2026-04-08*
