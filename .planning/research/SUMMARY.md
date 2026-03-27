# Project Research Summary

**Project:** RFIDInventory
**Domain:** RFID inventory management for garment supply chain
**Milestone:** v1.1 - Performance & Scale Preparation
**Researched:** 2026-03-27
**Confidence:** MEDIUM

## Executive Summary

The v1.1 milestone adds infrastructure-layer improvements to handle scan-heavy workloads (<100 concurrent users, hundreds of tags per scan session). The current Prisma/PostgreSQL stack works for development but will bottleneck under load due to lack of caching, inefficient bulk operations, and no connection pooling strategy beyond Prisma defaults. The recommended approach layers Redis caching for high-frequency tag lookups, configurable connection pooling for PostgreSQL, an in-memory batch scan buffer to reduce N+1 queries, and service boundary cleanup to improve maintainability.

**Key architectural decisions:** Redis cache integrated at the service layer (not controller) via `@nestjs/cache-manager` + `ioredis`; connection pooling via PrismaPg adapter configuration; batch scan buffer as an in-memory `BatchScanService` with 5-second flush intervals; and service boundaries via domain module restructuring rather than microservices. The build order follows dependency constraints: connection pooling first (foundational), then Redis infrastructure, then cache integration for Tags and Inventory Summary, then batch scan buffer (needs cache invalidation first), then service boundary cleanup.

**Key risks:** Cache stampede on inventory summary when TTL is too short; stale cache when scans bypass invalidation; connection pool exhaustion during peak scans; unbounded batch buffer memory growth; circular module dependencies during boundary refactoring. All have documented prevention strategies in PITFALLS.md.

---

## Key Findings

### Recommended Stack

**Core technologies for v1.1:**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@nestjs/cache-manager` | 3.1.0 | NestJS cache abstraction | Official package, works with NestJS 11.x, provides decorators |
| `@tirke/node-cache-manager-ioredis` | 3.6.0 | ioredis store for cache-manager | Actively maintained, TypeScript types included |
| `ioredis` | 5.10.1 | Redis client | Connection pooling, cluster support, pub/sub |
| `@nestjs/bullmq` | 11.0.4 | NestJS BullMQ integration | Official package, reliable job queue, backpressure handling |
| `bullmq` | 5.71.1 | Underlying queue engine | Redis-based, supports streams, priority, delays, retries |
| `pg` (via Prisma) | 8.x+ | Connection pooling | Already included via @prisma/adapter-pg, tune via connection_limit |

**NOT recommended:** `cache-manager-ioredis-yet` (older than @tirke variant), `Bull` (deprecated, use BullMQ), `node-cache-manager-ioredis-store` (abandoned), standalone `pg-pool` (redundant).

**Anti-patterns to avoid:**
- Write-through cache for all operations (cache reads only, invalidate on writes)
- Full tag history caching (memory explosion)
- Per-tag webhook/endpoint (extreme network overhead)
- Separate microservices (overkill for <100 users)
- Massive Prisma pool size (50+) without PgBouncer

### Expected Features

**Must have (table stakes):**
- **Tag EPC cache** — scan sessions repeatedly hit same tags, 5-min TTL with EPC key pattern
- **Stock summary cache** — expensive aggregation called frequently, 30-sec TTL, invalidate on scans
- **Cache invalidation on writes** — prevent stale reads that violate real-time requirement
- **Server-side batch endpoint** — accept array of EPCs, single DB query via processBulkScan
- **Buffer with debounce** — 500 EPC threshold or 5-second interval flush
- **Configurable pool size** — add `connection_limit` to DATABASE_URL or Prisma config

**Should have (competitive differentiators):**
- **Real-time sync via Redis pub/sub** — if EventsGateway becomes bottleneck
- **Distributed rate limiting** — prevent scan floods across instances
- **Session progress cache** — resume interrupted scan sessions
- **PgBouncer integration** — external connection pooling for multi-instance deployments

**Defer to v1.2:**
- Redis-backed distributed buffer (only if single-server bottleneck)
- PgBouncer integration (only if multi-instance)
- Real-time sync via Redis pub/sub (EventsGateway sufficient)
- Read replicas for read-heavy分流
- CQRS separation for read/write

### Architecture Approach

The architecture integrates new components at well-defined points: Redis cache at the service layer (not controller) using cache-aside pattern; batch scan buffer integrated into EventsGateway.handleScanStream() with optimistic emission then async flush; connection pooling configured at PrismaService constructor via PrismaPg adapter; service boundaries via domain module restructuring (no new services, just internal organization).

**Major new components:**
1. **CacheModule** (`src/cache/`) — centralized Redis/cache configuration, registered globally
2. **BatchScanService** (`src/scanning/`) — in-memory Map buffer with 500 EPC threshold and 5s flush interval
3. **ScanningModule** (`src/scanning/`) — DI boundary for scan processing, extracted from InventoryService
4. **InventoryCacheService** (`src/inventory/inventory.cache.ts`) — inventory-specific cache operations

**Modified components:** PrismaService (pool config), TagsService (cache wrapper), InventoryService (cache invalidation + processBulkScan), EventsGateway (delegate to BatchScanService).

**Unchanged components:** AuthModule, UsersModule, TransfersModule, OrdersModule, SessionsModule, DashboardModule, EventsModule (WebSocket only).

### Critical Pitfalls

1. **Cache invalidation stampede** — short TTL on high-traffic inventory data causes simultaneous DB hits. Prevention: 30-sec TTL + jitter, probabilistic early expiration with lock.

2. **Stale cache for real-time inventory** — scans update Prisma directly without invalidating cache, violating real-time requirement. Prevention: invalidate cache inside DB transaction, emit WebSocket after commit.

3. **Prisma connection pool exhaustion** — multiple PrismaClient instances or long-running sessions hold connections. Prevention: singleton PrismaClient, `connectionLimit: 20`, PgBouncer for multi-instance.

4. **Batch scan buffer memory leak** — unbounded buffer grows during long sessions until OOM. Prevention: MAX_BUFFER_SIZE=500, MAX_BUFFER_AGE=5000ms, memory pressure monitoring.

5. **Circular module dependencies** — splitting modules creates circular imports. Prevention: extract CommonModule for shared types, prefer event-driven boundaries over direct imports.

6. **Batch idempotency failure** — retry after partial flush creates duplicate TagEvent records. Prevention: upsert with idempotency key on TagEvent.

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Connection Pooling Foundation
**Rationale:** Foundational infrastructure that everything else uses. No new dependencies, no risk to existing services. PrismaService is a single point of change.
**Delivers:** Tuned PrismaPg adapter with `connectionLimit: 20`, configurable via DATABASE_URL.
**Addresses:** FEATURES.md connection pooling table stakes (configurable pool size, connection timeout handling).
**Avoids:** PITFALLS.md Pitfall 3 (Prisma connection pool exhaustion).
**Stack:** Prisma/pg (existing), no new packages.

### Phase 2: Redis Infrastructure
**Rationale:** Cache layer needed by subsequent phases. Establishes patterns that cache integration will follow.
**Delivers:** CacheModule with ioredis store, CacheService wrapper, REDIS_HOST/REDIS_PORT env vars, Redis health check.
**Addresses:** STACK.md Redis core stack.
**Avoids:** Infrastructure gaps before adding cache to services.
**Stack:** @nestjs/cache-manager, @tirke/node-cache-manager-ioredis, ioredis.
**Research flag:** Verify @nestjs/cache-manager API for NestJS 11.x (WebSearch unavailable during research).

### Phase 3: Cache Integration - Tags
**Rationale:** High-frequency reads, clear invalidation points. Low risk, immediate performance benefit for every scan.
**Delivers:** TagsService.findByEpc() with cache get/set, TagsService.update() with cache.del, 5-min TTL on `tag:epc:{epc}` keys.
**Addresses:** FEATURES.md Tag EPC cache (table stakes).
**Avoids:** PITFALLS.md Pitfall 1 (cache stampede on tags — low frequency, lower risk than summary).
**Stack:** Uses Phase 2 CacheModule.

### Phase 4: Cache Integration - Inventory Summary
**Rationale:** Expensive aggregation, clear invalidation triggers. Highest impact for dashboard but highest risk (stampede, invalidation timing).
**Delivers:** InventoryService.getStockSummary() with cache get/set and 30-sec TTL, cache invalidation on processOperation().
**Addresses:** FEATURES.md Stock summary cache (table stakes).
**Avoids:** PITFALLS.md Pitfall 1 (stampede — needs lock pattern), Pitfall 2 (stale cache — invalidate inside transaction).
**Stack:** Uses Phase 2 CacheModule, Phase 1 PrismaService.
**Research flag:** Cache invalidation timing needs unit tests.

### Phase 5: Batch Scan Buffer
**Rationale:** Affects scan path; needs reliable cache invalidation first so scans don't leave stale data. Depends on InventoryService.processBulkScan().
**Delivers:** BatchScanService with Map buffer (500 threshold, 5s interval, memory monitoring), /scan/batch endpoint, InventoryService.processBulkScan() method.
**Addresses:** FEATURES.md server-side batch endpoint and buffer with debounce (table stakes).
**Avoids:** PITFALLS.md Pitfall 4 (memory leak — bounded buffer), Pitfall 6 (stale + WebSocket race — invalidate inside transaction), Pitfall 7 (idempotency — upsert guard).
**Stack:** Uses Phase 2 Redis (optional for distributed), Phase 4 cache invalidation.
**Research flag:** Benchmark current scanStream baseline before implementation.

### Phase 6: Service Boundary Cleanup
**Rationale:** Organizational refactor; everything else should be stable. No new functionality, just improved maintainability.
**Delivers:** ScanningService extracted from InventoryService/EventsGateway, @app/common for shared DTOs, ScanningModule with clean DI boundaries.
**Addresses:** STACK.md service boundaries (CacheModule, QueueModule for future).
**Avoids:** PITFALLS.md Pitfall 5 (circular dependencies — verify with `nest deps`).
**Stack:** Uses Phase 2-5 modules.

### Phase Ordering Rationale

1. **Connection pooling first** — no new dependencies, foundational for everything else, low risk
2. **Redis infrastructure** — establish patterns, needed by cache integration phases
3. **Cache tags** — lower risk than summary cache, clear invalidation, immediate benefit
4. **Cache summary** — highest impact but highest risk (stampede, invalidation timing), needs tags phase patterns
5. **Batch buffer** — depends on cache invalidation working correctly, affects scan hot path
6. **Service boundaries** — last because it's a refactor with many touch points; everything else must be stable

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Redis Infrastructure):** Verify `@nestjs/cache-manager` API for NestJS 11.x; WebSearch was unavailable during research
- **Phase 4 (Cache Summary):** Complex invalidation timing with race condition prevention; needs unit test strategy
- **Phase 5 (Batch Buffer):** Benchmark current scanStream performance baseline before sizing buffer

Phases with standard patterns (skip research-phase):
- **Phase 1 (Connection Pooling):** Well-documented Prisma pool config, just constructor changes
- **Phase 3 (Cache Tags):** Standard cache-aside pattern, well-documented

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | npm registry data verified; limited third-party verification; WebSearch unavailable for NestJS caching docs |
| Features | MEDIUM | Training data + code analysis; WebSearch unavailable to verify latest patterns |
| Architecture | MEDIUM | Clear integration points from code analysis; specific timing/data flow TBD |
| Pitfalls | MEDIUM-HIGH | Prisma connection info from official docs (verified via WebFetch); NestJS patterns from training data |

**Overall confidence:** MEDIUM

### Gaps to Address

- **NestJS cache package API:** Verify `@nestjs/cache-manager` + `@tirke/node-cache-manager-ioredis` integration against current NestJS 11.x documentation before Phase 2
- **Redis failover behavior:** What happens when Redis is down — need fallback to direct DB queries
- **Buffer memory validation:** Test batch buffer memory limits under extreme load (500+ EPC bursts)
- **Current baseline:** No performance benchmarks captured for scanStream handler before changes
- **PgBouncer compatibility:** Transaction mode + Prisma Migrate conflict needs separate DATABASE_URL for migrate vs app

---

## Sources

### Primary (HIGH confidence)
- **npm registry** — @nestjs/cache-manager, @tirke/node-cache-manager-ioredis, @nestjs/bullmq, ioredis, bullmq (direct package metadata)
- **Prisma official docs (WebFetch)** — Connection pool basics, multiple instances, PgBouncer config

### Secondary (MEDIUM confidence)
- **Direct code analysis** — `/Users/heymac/Desktop/Project/RFIDInventory/backend/src/` integration points, component inventory
- **Training data** — NestJS caching patterns, batch processing patterns, module boundaries
- **RFID inventory domain patterns (training)** — Batch scan behavior, real-time requirements

### Tertiary (LOW confidence)
- **cache-manager-ioredis-yet** — Referenced in FEATURES.md as alternative; compatibility needs verification
- **PER (probabilistic early expiration) pattern** — From training data; needs validation in production load test

---

*Research completed: 2026-03-27*
*Ready for roadmap: yes*
