# Phase 13: backend-quality-improvement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 13-backend-quality-improvement
**Areas discussed:** BusinessException Consistency, Performance Fixes, Missing Indexes, Env Vars, JWT Re-verify, Testing Strategy, Magic Strings, Location Cache

---

## Area 1: BusinessException Consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Replace all trong TransfersService | Thay thế tất cả raw exceptions bằng BusinessException trong TransfersService | ✓ |
| Tạo centralized error registry | Tạo error code registry trong common/exceptions/ trước, rồi migrate tất cả services | |
| Chỉ critical flows | Chỉ standardize trong các flows quan trọng (transfer create, confirm, cancel) | |

**User's choice:** Replace all trong TransfersService
**Notes:** Muốn consistency ngay, không cần registry phức tạp

---

## Area 2: Performance Fixes Priority

| Option | Description | Selected |
|--------|-------------|----------|
| buildStockSummary trước | Query aggregation optimization + cache TTL increase | ✓ |
| processBulkScan trước | Batch update với $executeRaw thay vì Promise.all | |
| Parallel execution | Cả hai cùng làm - không có dependency | |

**User's choice:** buildStockSummary trước
**Notes:** buildStockSummary là CRITICAL với 12+ queries, ưu tiên fix trước

---

## Area 3: Missing Indexes Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ User table | Thêm indexes cho User (4 fields) — fast, low risk | ✓ |
| Tất cả tables | Audit toàn bộ schema, thêm indexes cho tất cả foreign keys và filtered fields | |
| Defer indexes | Chỉ add khi có performance metrics cho thấy cần | |

**User's choice:** Chỉ User table
**Notes:** Fast win, low risk — phù hợp với scope phase này

---

## Area 4: Env Variable Alignment

| Option | Description | Selected |
|--------|-------------|----------|
| Align env.validation với auth.service | Đồng bộ env.validation.ts để match với auth.service.ts sử dụng | ✓ |
| Align auth.service với env.validation | Đổi auth.service.ts để dùng env vars đã định nghĩa trong env.validation.ts | |
| Bỏ qua env.validation | env.validation.ts không cần thiết, chỉ dùng ConfigService đọc trực tiếp | |

**User's choice:** Align env.validation với auth.service
**Notes:** auth.service.ts là source of truth, env.validation nên follow

---

## Area 5: JWT Re-verify Elimination

| Option | Description | Selected |
|--------|-------------|----------|
| Dùng client.user đã attach | Lấy user từ (client as any).user thay vì verify lại | ✓ |
| Chỉ verify khi cần | Verify lại chỉ khi cần refresh payload, cached user dùng lâu hơn | |
| Giữ nguyên | Security-first: verify mỗi message để đảm bảo freshness | |

**User's choice:** Dùng client.user đã attach
**Notes:** Đã verify trong handleConnection rồi, không cần verify lại

---

## Area 6: Test Coverage Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| TransfersService + UsersService | Viết tests cho 2 core services trước | ✓ |
| Tất cả services | Coverage cho mọi service, chấp nhận thời gian lâu hơn | |
| Defer testing | Không làm trong phase này, infrastructure trước | |

**User's choice:** TransfersService + UsersService
**Notes:** Core business logic cần coverage trước

---

## Area 7: Magic Strings Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Extract constants | Tạo constants cho tất cả magic strings — maintainability | ✓ |
| Enum cho types | Chỉ tạo enums cho device types, transfer prefixes, event types | |
| Bỏ qua | Không cần thiết, không ảnh hưởng functionality | |

**User's choice:** Extract constants
**Notes:** DRY principle — tất cả magic strings nên được extract

---

## Area 8: Location ID Caching

| Option | Description | Selected |
|--------|-------------|----------|
| Request-scoped cache | Cache trong request context cho location IDs | ✓ |
| Decorator-based injection | Tạo decorator để inject authorized location IDs vào service | |
| Để nguyên | Không cần thiết, query nhanh và có cache layer | |

**User's choice:** Request-scoped cache
**Notes:** Tránh duplicate queries khi gọi nhiều methods trong same request

---

## Deferred Ideas

- **processBulkScan batch update** — deferred sau buildStockSummary refactor (D-11)
- **TransferItem parallel queries** — deferred cùng processBulkScan (D-12)
- **Pagination max limit** — LOW priority, out of scope

---

*Context gathered: 2026-04-08*
