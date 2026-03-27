# Requirements: RFID Inventory System

**Defined:** 2026-03-27
**Core Value:** Quản lý chính xác số lượng RFID tag tại mỗi điểm trong chuỗi cung ứng — từ xưởng may đến tay khách hàng.

## v1.1 Requirements (Performance & Scale Preparation)

Requirements for v1.1 milestone. Each maps to roadmap phases.

### Connection Pooling

- [x] **POOL-01**: PrismaService configured with tuned connection pool size (connectionLimit: 20)
- [x] **POOL-02**: Connection limit configurable via DATABASE_URL or environment variable

### Redis Infrastructure

- [x] **REDIS-01**: CacheModule created with @nestjs/cache-manager + ioredis store
- [x] **REDIS-02**: REDIS_HOST and REDIS_PORT environment variables configured
- [x] **REDIS-03**: Redis health check endpoint added

### Cache Integration - Tags

- [x] **CACHE-01**: TagsService.findByEpc() uses cache-aside pattern with 5-min TTL
- [x] **CACHE-02**: TagsService.update() invalidates cache immediately on write
- [x] **CACHE-03**: Cache key pattern `tag:epc:{epc}` for tag lookups

### Cache Integration - Inventory Summary

- [ ] **CACHE-04**: InventoryService.getStockSummary() cached with 30-sec TTL
- [ ] **CACHE-05**: Cache invalidation on processOperation() inside DB transaction
- [ ] **CACHE-06**: Stampede prevention with jitter on TTL

### Batch Scan Buffer

- [ ] **BATCH-01**: BatchScanService with in-memory Map buffer
- [ ] **BATCH-02**: Buffer flush at 500 EPC threshold OR 5-second interval
- [ ] **BATCH-03**: Memory limit enforcement (MAX_BUFFER_SIZE=500, MAX_BUFFER_AGE=5000ms)
- [ ] **BATCH-04**: /scan/batch endpoint accepting array of EPCs
- [ ] **BATCH-05**: InventoryService.processBulkScan() for bulk DB operations
- [ ] **BATCH-06**: Idempotency guard for batch operations (upsert with idempotency key)

### Service Boundaries

- [ ] **BOUND-01**: ScanningService extracted from InventoryService/EventsGateway
- [ ] **BOUND-02**: @app/common module for shared DTOs and interfaces
- [ ] **BOUND-03**: ScanningModule with clean dependency injection boundaries

## v1.0 Validated Requirements

These requirements shipped in v1.0 and are complete.

### Infrastructure

- ✓ Location infrastructure (ADMIN, WAREHOUSE, WORKSHOP, HOTEL/RESORT/SPA)

### Authentication

- ✓ JWT authentication for Admin and Warehouse Manager

### Transfer Workflow

- ✓ Transfer Admin→Workshop (2-step: PENDING → COMPLETED)
- ✓ Transfer Workshop→Warehouse (WORKSHOP_TO_WAREHOUSE)
- ✓ Transfer Warehouse→Customer (WAREHOUSE_TO_CUSTOMER, 1-step)

### Workshop Management

- ✓ Location CRUD API with type filter
- ✓ Soft delete with tag check

### Customer Management

- ✓ HOTEL, RESORT, SPA location types
- ✓ Customer location seeding

## v2 Requirements (Future)

### Performance

- **DIST-01**: Distributed rate limiting via Redis (when multi-instance)
- **DIST-02**: Redis pub/sub for EventsGateway scaling
- **PG-01**: PgBouncer integration for multi-instance deployments

### Monitoring

- **MON-01**: Cache hit/miss metrics
- **MON-02**: Buffer memory pressure monitoring
- **MON-03**: Connection pool utilization dashboard

## Out of Scope

| Feature | Reason |
|---------|--------|
| Database-per-service | Real-time requirement demands shared DB; defer to >1000 users |
| Eventual consistency | Inventory must be accurate immediately |
| Message queue (BullMQ) | In-memory buffer sufficient for <100 users |
| Read replicas | Single instance sufficient for current scale |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| POOL-01 | Phase 06 | Complete |
| POOL-02 | Phase 06 | Complete |
| REDIS-01 | Phase 07 | Complete |
| REDIS-02 | Phase 07 | Complete |
| REDIS-03 | Phase 07 | Complete |
| CACHE-01 | Phase 08 | Complete |
| CACHE-02 | Phase 08 | Complete |
| CACHE-03 | Phase 08 | Complete |
| CACHE-04 | Phase 09 | Pending |
| CACHE-05 | Phase 09 | Pending |
| CACHE-06 | Phase 09 | Pending |
| BATCH-01 | Phase 10 | Pending |
| BATCH-02 | Phase 10 | Pending |
| BATCH-03 | Phase 10 | Pending |
| BATCH-04 | Phase 10 | Pending |
| BATCH-05 | Phase 10 | Pending |
| BATCH-06 | Phase 10 | Pending |
| BOUND-01 | Phase 11 | Pending |
| BOUND-02 | Phase 11 | Pending |
| BOUND-03 | Phase 11 | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after v1.1 roadmap created*
