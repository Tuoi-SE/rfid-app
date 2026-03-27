# Roadmap

## Phase 1: Location Infrastructure

**Goal:** Tạo Location model — nền tảng cho mọi tracking

**Requirement IDs:** INVENTORY-01 (Location foundation)

**Plans:** 1 plan

Plans:
- [x] 01-PLAN.md — Thêm Location model với LocationType enum, cập nhật Tag với locationId FK, seed 5 locations (ADMIN, 2 WAREHOUSE, 2 WORKSHOP)

## Phase 2: Workshop Management

**Goal:** CRUD xưởng + Transfer Admin→Workshop

**Requirement IDs:** WORKSHOP-01, TAGS-02

**Plans:** 3 plans

Plans:
- [x] 02-PLAN.md — Transfer model và API (2-step workflow: Admin tạo PENDING → Workshop confirm COMPLETED)
- [x] 02-02-PLAN.md — Location CRUD API với filter type=WORKSHOP (Workshop management)

## Phase 3: Warehouse Transfer

**Goal:** Transfer Workshop→Warehouse với scan verify

**Requirement IDs:** TAGS-03, TAGS-04, INVENTORY-01

**Plans:** 1 plan

Plans:
- [x] 03-PLAN.md — Them WORKSHOP_TO_WAREHOUSE type, validate source/destination, kiem tra scanned count truoc COMPLETED

## Phase 4: Customer Management

**Goal:** CRUD khách hàng (khách sạn/resort) + chuẩn bị Outbound Flow

**Requirement IDs:** CUSTOMER-01, TAGS-05

**Plans:** 1 plan

Plans:
- [x] 04-PLAN.md — Them HOTEL/RESORT/SPA vao LocationType, WAREHOUSE_TO_CUSTOMER vao TransferType, cap nhat transfer service, seed customer locations

## Phase 5: Outbound Flow

**Goal:** Xuất kho → khách hàng, workflow 1-step (tạo = COMPLETED ngay), không cần customer confirm

**Requirement IDs:** TAGS-05

**Plans:** 1 plan

Plans:
- [x] 05-PLAN.md — Sửa WAREHOUSE_TO_CUSTOMER: tạo = COMPLETED ngay (D-20), stock limit validation (D-22), tags OUT_OF_STOCK

---

## v1.1: Performance & Scale Preparation

**Goal:** Chuẩn bị kiến trúc để scale — Redis cache, connection pooling, batch scan, service boundaries

**Target features:**
- Redis cache layer cho inventory queries
- Connection pooling tối ưu cho concurrent scans
- Batch scan buffer — gửi nhiều tag cùng lúc
- Service boundaries — tách logic modules rõ ràng

## Phases

- [x] **Phase 06: Connection Pooling Foundation** - Tune Prisma connection pool for concurrent workloads (completed 2026-03-27)
- [x] **Phase 07: Redis Infrastructure** - Redis cache layer setup with @nestjs/cache-manager (completed 2026-03-27)
- [x] **Phase 08: Cache Integration - Tags** - Cache-aside pattern for tag lookups with 5-min TTL (completed 2026-03-27)
- [x] **Phase 09: Cache Integration - Inventory Summary** - Cached stock summary with 30-sec TTL (completed 2026-03-27)
- [ ] **Phase 10: Batch Scan Buffer** - Buffer multiple tags per scan with 500 threshold
- [ ] **Phase 11: Service Boundary Cleanup** - Extract ScanningService with clean DI boundaries

---

## Phase Details

### Phase 06: Connection Pooling Foundation

**Goal:** Prisma connection pool is tuned for concurrent scan workloads

**Depends on:** Nothing (foundation phase)

**Requirements:** POOL-01, POOL-02

**Success Criteria** (what must be TRUE):
1. PrismaService uses connectionLimit: 20 (or configured value from env)
2. Connection limit is configurable via DATABASE_URL or environment variable without code changes
3. Application starts and maintains database connections under concurrent scan load
4. Connection pool does not exhaust under 20+ simultaneous operations

**Plans:** 1/1 plans complete

Plans:
- [x] 06-01-PLAN.md — Update PrismaService with pg Pool config (max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000), add parsePoolSize() helper to extract connection_limit from DATABASE_URL

---

### Phase 07: Redis Infrastructure

**Goal:** Redis cache layer is available and configured for application use

**Depends on:** Phase 06 (PrismaService must be stable before adding cache)

**Requirements:** REDIS-01, REDIS-02, REDIS-03

**Success Criteria** (what must be TRUE):
1. CacheModule globally registered with @nestjs/cache-manager and ioredis store
2. Application connects to Redis using REDIS_HOST and REDIS_PORT environment variables
3. /health endpoint returns Redis connection status (healthy/degraded)
4. Cache operations (get, set, del) work with ioredis store

**Plans:** 1/1 plans complete

Plans:
- [x] 07-01-PLAN.md — Redis cache layer setup: install @nestjs/cache-manager + ioredis, docker-compose Redis service, global CacheModule, /health with Redis status

---

### Phase 08: Cache Integration - Tags

**Goal:** Tag lookups use cache-aside pattern with 5-minute TTL

**Depends on:** Phase 07 (Redis infrastructure must be ready)

**Requirements:** CACHE-01, CACHE-02, CACHE-03

**Success Criteria** (what must be TRUE):
1. TagsService.findByEpc() returns cached result if EPC exists in cache
2. Cache miss triggers database lookup and populates cache with 5-min TTL
3. TagsService.update() immediately invalidates cache for the updated EPC
4. Cache key pattern `tag:epc:{epc}` is used consistently for tag lookups
5. Repeated scans of same EPC hit cache instead of database

**Plans:** 1/1 plans complete

Plans:
- [x] 08-01-PLAN.md — Add cache-aside pattern to TagsService: inject CacheService, findByEpc() checks cache first then DB with 5-min TTL, update() invalidates cache

---

### Phase 09: Cache Integration - Inventory Summary

**Goal:** Inventory summary queries are cached with 30-second TTL and stampede prevention

**Depends on:** Phase 08 (Tag cache patterns must be stable)

**Requirements:** CACHE-04, CACHE-05, CACHE-06

**Success Criteria** (what must be TRUE):
1. InventoryService.getStockSummary() returns cached result within 30-sec window
2. Cache invalidation occurs inside database transaction on processOperation()
3. TTL includes jitter to prevent stampede when cache expires
4. Dashboard loads stock summary from cache without direct DB aggregation
5. Real-time requirement maintained: inventory updates reflect immediately after transaction commit

**Plans:** 1/1 plans complete

Plans:
- [x] 09-01-PLAN.md — Add cache-aside pattern to InventoryService: getStockSummary() cached with 30-sec TTL + jitter, processOperation() invalidates cache

---

### Phase 10: Batch Scan Buffer

**Goal:** Multiple EPCs can be submitted together and processed efficiently

**Depends on:** Phase 09 (Cache invalidation must work correctly)

**Requirements:** BATCH-01, BATCH-02, BATCH-03, BATCH-04, BATCH-05, BATCH-06

**Success Criteria** (what must be TRUE):
1. BatchScanService buffers EPCs in memory Map up to 500 threshold
2. Buffer flushes automatically when 500 EPCs accumulated OR 5 seconds elapsed
3. Memory limits enforced: MAX_BUFFER_SIZE=500, MAX_BUFFER_AGE=5000ms
4. /scan/batch endpoint accepts array of EPCs and returns processed count
5. InventoryService.processBulkScan() handles bulk upsert efficiently
6. Duplicate EPCs in same batch are handled idempotently (no duplicate TagEvents)

**Plans:** 1/1 plans

Plans:
- [ ] 10-01-PLAN.md — BatchScanService with Map buffer (500 threshold, 5-sec flush), /scan/batch endpoint, processBulkScan() for bulk upsert

---

### Phase 11: Service Boundary Cleanup

**Goal:** Scanning logic is extracted into dedicated module with clean boundaries

**Depends on:** Phase 10 (Batch buffer must be stable)

**Requirements:** BOUND-01, BOUND-02, BOUND-03

**Success Criteria** (what must be TRUE):
1. ScanningService is extracted from InventoryService and EventsGateway
2. @app/common module contains shared DTOs and interfaces used across modules
3. ScanningModule has clean dependency injection boundaries (no circular deps)
4. `nest deps` shows no circular dependency warnings
5. All scanning-related logic routes through ScanningModule

**Plans:** 0/1 plans (pending Phase 10)

Plans:
- [ ] 11-01-PLAN.md — TBD (depends on Phase 10)

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Location Infrastructure | 1/1 | Done | 2026-03-26 |
| 2. Workshop Management | 3/3 | Done | 2026-03-26 |
| 3. Warehouse Transfer | 1/1 | Done | 2026-03-26 |
| 4. Customer Management | 1/1 | Done | 2026-03-26 |
| 5. Outbound Flow | 1/1 | Done | 2026-03-26 |
| 6. Connection Pooling Foundation | 1/1 | Done | 2026-03-27 |
| 7. Redis Infrastructure | 1/1 | Done | 2026-03-27 |
| 8. Cache Integration - Tags | 1/1 | Complete   | 2026-03-27 |
| 9. Cache Integration - Inventory Summary | 1/1 | Pending | - |
| 10. Batch Scan Buffer | 1/1 | Pending | - |
| 11. Service Boundary Cleanup | 0/1 | Pending | - |
