# Architecture: v1.1 Performance & Scale Preparation

**Project:** RFID Inventory System
**Milestone:** v1.1 - Redis cache, connection pooling, batch scan buffer, service boundaries
**Researched:** 2026-03-27
**Confidence:** MEDIUM (WebSearch unavailable; based on training data + code analysis)

---

## Executive Summary

The v1.1 milestone adds infrastructure-layer improvements to handle scan-heavy workloads (<100 users, hundreds of tags per session). This document specifies **where** new components integrate, **what** changes vs stays the same, **how** data flows through the modified system, and **in what order** to build.

**Key architectural decisions:**
1. **Redis cache** via `@nestjs/cache-manager` + `ioredis` -- integrated at service layer, not controller
2. **Connection pooling** via `pg` driver tuning + optional PgBouncer -- configured at PrismaService level
3. **Batch scan buffer** via in-memory `BatchScanService` with flush interval -- integrated into EventsGateway scan path
4. **Service boundaries** via domain module restructuring -- no new modules, just internal organization

---

## 1. Integration Points

### 1.1 Redis Cache Integration

**Integration point:** Service layer (TagsService, InventoryService)
**Why not controller:** Cache-aside pattern works best when services decide caching strategy; controllers remain thin

```
Current:  Controller → Service → PrismaService → PostgreSQL
After:    Controller → Service → [Cache] → PrismaService → PostgreSQL
                      ↓
                  Cache miss → PrismaService → PostgreSQL → Cache.set()
```

**Cache keys by domain:**

| Domain | Cache Key Pattern | TTL | Invalidation Trigger |
|--------|------------------|-----|---------------------|
| Tags | `tag:epc:{epc}` | 5 min | Tag update/delete |
| Inventory Summary | `inventory:summary:all` | 30 sec | Any tag status change |
| Product | `product:{id}` | 30 min | Product update |
| Location | `location:{id}:count` | 1 min | Tag location change |

### 1.2 Batch Scan Buffer Integration

**Integration point:** EventsGateway.handleScanStream()
**Why here:** scanStream already receives arrays of scans; buffering happens before DB write

```
Current:  Mobile → handleScanStream() → [for each epc] → Prisma findMany → emit
After:    Mobile → handleScanStream() → BatchScanService.add() → [buffered] → flush() on interval/threshold
                                                    ↓
                                              emit immediately (optimistic)
```

**Buffer flush triggers:**
1. Time-based: Every 5 seconds
2. Size-based: When buffer reaches 500 EPCs
3. Shutdown-based: On SIGTERM/SIGINT

### 1.3 Connection Pooling Integration

**Integration point:** PrismaService constructor
**Why here:** Single point to configure all DB connections

```
Current:  PrismaPg({ connectionString: DATABASE_URL })
After:    PrismaPg({ connectionString: DATABASE_URL, max: 20, idleTimeout: 30, connectionTimeout: 10 })
```

### 1.4 Service Boundary Integration

**Integration point:** Module imports/exports
**Why here:** NestJS DI container handles dependency resolution

```
Current:  InventoryModule → EventsModule
After:    InventoryModule → [ScanningModule (new)] → EventsModule
                      ↓
              ScanningService (extracted)
```

---

## 2. New vs Modified Components

### 2.1 New Components

| Component | Location | Purpose | Complexity |
|-----------|----------|---------|------------|
| CacheModule | `src/cache/cache.module.ts` | Redis cache container | Low |
| CacheService | `src/cache/cache.service.ts` | Centralized cache operations | Low |
| BatchScanService | `src/scanning/batch-scan.service.ts` | Buffer and flush EPCs | Medium |
| ScanningModule | `src/scanning/scanning.module.ts` | DI boundary for scanning | Low |
| ScanningService | `src/scanning/scanning.service.ts` | Scan processing logic | Medium |
| InventoryCacheService | `src/inventory/inventory.cache.ts` | Inventory-specific caching | Low |

### 2.2 Modified Components

| Component | Change | Risk |
|-----------|--------|------|
| `PrismaService` | Add pool config to PrismaPg constructor | Low |
| `TagsService` | Add @CacheInterceptor or manual cache calls | Low |
| `InventoryService` | Add processBulkScan(), integrate cache invalidation | Medium |
| `EventsGateway` | Delegate to BatchScanService instead of direct processing | Medium |
| `AppModule` | Import CacheModule, ScanningModule; add Redis env vars | Low |

### 2.3 Unchanged Components

These components are NOT modified in v1.1:
- AuthModule (authentication works as-is)
- UsersModule (no scaling pressure)
- TransfersModule (workflow unchanged)
- OrdersModule (no scaling pressure)
- SessionsModule (scan storage unchanged)
- DashboardModule (reads from cache, not modified)
- EventsModule (WebSocket only; logic moves to ScanningService)

---

## 3. Data Flow Changes

### 3.1 Tag Lookup Flow (Cache Hit)

```
1. Mobile: GET /api/tags/epc/{epc}
2. TagsController: tagsService.findByEpc(epc)
3. TagsService:
   a. Check cache: cacheService.get(`tag:epc:${epc}`)
   b. Cache HIT → return cached tag
4. Response: Tag with product (from cache)
```

**Latency:** ~5-10ms (cache hit) vs ~50-100ms (DB query)

### 3.2 Tag Lookup Flow (Cache Miss)

```
1. Mobile: GET /api/tags/epc/{epc}
2. TagsController: tagsService.findByEpc(epc)
3. TagsService:
   a. Check cache: cacheService.get(`tag:epc:${epc}`)
   b. Cache MISS → PrismaService.tag.findUnique(epc)
   c. Cache set: cacheService.set(`tag:epc:${epc}`, tag, 300_000)
4. Response: Tag with product (from DB)
```

### 3.3 Scan Stream Flow (With Batch Buffer)

```
1. Mobile: socket.emit('scanStream', [{ epc, rssi }, ...])
2. EventsGateway.handleScanStream():
   a. Extract EPCs from payload
   b. Emit 'scanDetected' immediately (optimistic - clients see instant feedback)
   c. For each EPC: batchScanService.addToBuffer(epc, userId)
3. BatchScanService:
   a. Add to in-memory Map (idempotent by EPC)
   b. If size >= 500 OR timer fires (5s): flush()
4. BatchScanService.flush():
   a. Extract all buffered EPCs
   b. Call inventoryService.processBulkScan(epcs)
   c. Clear buffer
5. InventoryService.processBulkScan():
   a. Prisma findMany for all EPCs
   b. Create missing tags
   c. Update lastSeenAt for existing
   d. Invalidate inventory:summary cache
   e. Emit 'inventoryUpdate' summary
```

**Key property:** Step 2b emits immediately; steps 3-5 happen asynchronously

### 3.4 Stock Summary Flow (Cached)

```
1. Dashboard: GET /api/inventory/summary
2. InventoryController: inventoryService.getStockSummary()
3. InventoryService:
   a. Check cache: cacheService.get('inventory:summary:all')
   b. Cache HIT → return cached summary
   c. Cache MISS → compute aggregation → cache.set(..., 30_000) → return
```

### 3.5 Tag Status Change Flow (With Cache Invalidation)

```
1. Admin: POST /api/inventory/operation { action: CHECK_IN, tagIds: [...] }
2. InventoryService.processOperation():
   a. Prisma updateMany for tag status
   b. Create activity log
   c. Invalidate cache:
      - For each tag: cacheService.del(`tag:epc:${epc}`)
      - cacheService.del('inventory:summary:all')
   d. Emit eventsGateway.emitTagsUpdated()
3. EventsGateway: emit 'tagsUpdated' to scan:live room
4. Web/Mobile: Receive tagsUpdated → refetch (cache miss → fresh data)
```

---

## 4. Build Order (Dependency-Aware)

Build in this order to minimize integration risk:

### Phase 1: Connection Pooling (1 day)
**Why first:** Foundation that everything else uses; no code changes to services

```
1.1 Modify PrismaService constructor
1.2 Add DATABASE_URL connection parameters
1.3 Test with existing scanStream handler
1.4 Verify no connection leaks under load
```

### Phase 2: Redis Infrastructure (1 day)
**Why second:** Cache layer needed by subsequent phases

```
2.1 Install @nestjs/cache-manager, ioredis, cache-manager-ioredis-yet
2.2 Create CacheModule with Redis store
2.3 Create CacheService wrapper
2.4 Add REDIS_HOST, REDIS_PORT, REDIS_PASSWORD to .env
2.5 Health check includes Redis connectivity
```

### Phase 3: Cache Integration - Tags (1-2 days)
**Why third:** High-frequency reads, clear invalidation points

```
3.1 Add cache.get/set to TagsService.findByEpc()
3.2 Add cache.del to TagsService.update()
3.3 Add cache.del to TagsService.create() (if auto-create)
3.4 Verify cache invalidation on tag updates
```

### Phase 4: Cache Integration - Inventory Summary (1-2 days)
**Why fourth:** Expensive aggregation, clear invalidation triggers

```
4.1 Add cache.get/set to InventoryService.getStockSummary()
4.2 Add cache.del to InventoryService.processOperation()
4.3 Test cache invalidation timing
```

### Phase 5: Batch Scan Buffer (2 days)
**Why fifth:** Affects scan path; needs reliable cache invalidation first

```
5.1 Create BatchScanService with Map buffer
5.2 Create ScanningModule
5.3 Integrate into EventsGateway.handleScanStream()
5.4 Add processBulkScan() to InventoryService
5.5 Test with 500+ tag burst
5.6 Verify graceful shutdown flush
```

### Phase 6: Service Boundary Cleanup (2-3 days)
**Why last:** Organizational refactor; everything else should be stable

```
6.1 Extract ScanningService from EventsGateway logic
6.2 Move scanning types to scanning.types.ts
6.3 Create @app/common for shared DTOs
6.4 Verify no circular dependencies
```

---

## 5. Redis Cache Invalidation Strategy

### 5.1 Invalidation Patterns by Operation

| Operation | Cache Keys Invalidated | Strategy |
|-----------|----------------------|----------|
| Tag.create() | None (lazy population) | Let cache miss on next read |
| Tag.update() | `tag:epc:{epc}` | Immediate delete |
| Tag.delete() | `tag:epc:{epc}` | Immediate delete |
| Tag.assignTags() | `tag:epc:{epc}` for each | Bulk delete |
| processOperation() (CHECK_IN/OUT) | `tag:epc:{epc}` for each + `inventory:summary:all` | Bulk delete |
| processBulkScan() | `inventory:summary:all` | Single delete (scans don't change summary much) |

### 5.2 Invalidation Implementation

```typescript
// inventory.service.ts
async processOperation(dto: InventoryOperationDto, userId: string) {
  // ... existing logic ...

  // Batch update statuses
  await this.prisma.tag.updateMany({ ... });

  // Invalidate cache
  const cacheKeys = toUpdate.map(t => `tag:epc:${t.epc}`);
  cacheKeys.push('inventory:summary:all');
  await this.cacheService.delMany(cacheKeys);

  // Emit real-time update
  this.eventsGateway.emitTagsUpdated();
}
```

### 5.3 Cache Stampede Prevention

**Problem:** When cache expires, multiple requests hit DB simultaneously

**Solution:** Probabilistic early expiration (PER) with lock

```typescript
async getStockSummary() {
  const cacheKey = 'inventory:summary:all';
  let summary = await this.cache.get(cacheKey);

  if (!summary) {
    // Use lock to prevent stampede
    const lockKey = `${cacheKey}:lock`;
    const acquired = await this.cache.set(lockKey, '1', { ttl: 5000, nx: true });

    if (acquired) {
      try {
        summary = await this.computeStockSummary();
        await this.cache.set(cacheKey, summary, 30_000);
      } finally {
        await this.cache.del(lockKey);
      }
    } else {
      // Wait and retry
      await new Promise(r => setTimeout(r, 100));
      return this.cache.get(cacheKey);
    }
  }
  return summary;
}
```

### 5.4 TTL Strategy Summary

| Cache Key | TTL | Rationale |
|-----------|-----|-----------|
| `tag:epc:{epc}` | 5 min | Tags rarely change; 5min freshness OK |
| `inventory:summary:all` | 30 sec | Dashboard needs relatively fresh data |
| `product:{id}` | 30 min | Product data is static |
| `location:{id}:count` | 1 min | Location counts change during transfers |

---

## 6. Module Structure (Post-v1.1)

```
src/
├── app.module.ts                    # Root module

├── prisma/                          # Database access (UNCHANGED)
│   ├── prisma.module.ts
│   └── prisma.service.ts            # MODIFIED: pool config

├── cache/                           # NEW: Cache infrastructure
│   ├── cache.module.ts              # Global CacheModule
│   └── cache.service.ts             # Cache operations wrapper

├── common/                          # SHARED: Types, DTOs
│   ├── filters/
│   ├── interceptors/
│   └── types/

├── auth/                            # UNCHANGED
├── users/                           # UNCHANGED
├── products/                        # UNCHANGED
├── categories/                     # UNCHANGED
├── locations/                       # UNCHANGED
├── orders/                          # UNCHANGED
├── sessions/                        # UNCHANGED
├── transfers/                        # UNCHANGED
├── dashboard/                       # UNCHANGED (reads from cache)
├── casl/                            # UNCHANGED
├── activity-log/                    # UNCHANGED

├── tags/                            # MODIFIED: +cache integration
│   ├── tags.module.ts
│   ├── tags.service.ts              # MODIFIED: cache get/set
│   └── tags.controller.ts

├── inventory/                       # MODIFIED: +cache +bulk scan
│   ├── inventory.module.ts
│   ├── inventory.service.ts         # MODIFIED: cache invalidation
│   ├── inventory.controller.ts
│   └── inventory.cache.ts          # NEW: inventory-specific cache

├── scanning/                        # NEW: Bounded context
│   ├── scanning.module.ts
│   ├── scanning.service.ts         # Scan processing logic
│   ├── scanning.controller.ts      # Batch endpoint
│   ├── batch-scan.service.ts       # Buffer management
│   └── scanning.types.ts

├── events/                          # MODIFIED: delegate to scanning
│   ├── events.module.ts
│   └── events.gateway.ts           # MODIFIED: use BatchScanService
```

---

## 7. Environment Variables (Additions)

```env
# Redis (NEW in v1.1)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database pooling (v1.1 - optional PgBouncer for multi-instance)
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
```

---

## 8. Risk Assessment

| Component | Risk | Mitigation |
|-----------|------|-----------|
| Cache invalidation timing | Medium | Unit tests verify invalidation on each mutation |
| Batch buffer memory pressure | Medium | Hard limit 500 EPCs; flush on interval |
| Redis connection failure | Low | Fallback to direct DB queries; circuit breaker |
| Cache stampede on summary | Medium | Implement lock pattern for stock summary |
| Circular module dependencies | Low | NestJS catches at compile; verify with `nest deps` |

---

## 9. Testing Strategy

| Layer | Test Type | What to Verify |
|-------|-----------|----------------|
| Cache | Unit | Cache hit/miss, TTL expiration, invalidation |
| BatchScanService | Unit | Buffer add, flush triggers, idempotency |
| PrismaService | Integration | Connection pool behavior under load |
| EventsGateway | Integration | Scan stream with buffer; graceful shutdown |
| Full flow | E2E | Scan → buffer → flush → cache invalidation → emit |

---

## 10. Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Integration points | HIGH | Clear from code analysis |
| New vs modified components | HIGH | Explicit enumeration from codebase |
| Data flow changes | MEDIUM | Pattern is standard; specific timing TBD |
| Build order | MEDIUM | Dependency-aware; actual sprint may vary |
| Cache invalidation strategy | MEDIUM | PER pattern from training data; needs validation |

---

## 11. Gaps to Address

- [ ] Verify `@nestjs/cache-manager` API for NestJS 11.x
- [ ] Confirm `cache-manager-ioredis-yet` compatibility
- [ ] Test Redis failover behavior (what happens when Redis is down)
- [ ] Validate batch buffer memory limits under extreme load
- [ ] Benchmark current scanStream performance baseline

---

## Sources

- **Direct code analysis:** `/Users/heymac/Desktop/Project/RFIDInventory/backend/src/`
- **Prisma docs:** Connection pooling via WebFetch (verified)
- **Training data:** NestJS caching patterns, batch processing, module boundaries
- **FEATURES.md:** `.planning/research/FEATURES.md` (feature-level detail)
