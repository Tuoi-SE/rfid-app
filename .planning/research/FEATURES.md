# Feature Landscape: v1.1 Performance & Scale Preparation

**Project:** RFID Tag Inventory System
**Domain:** RFID inventory management for garment supply chain
**Focus:** Redis cache, connection pooling, batch scan buffer, service boundaries
**Researched:** 2026-03-27
**Confidence:** MEDIUM (based on training data; WebSearch unavailable for verification)

---

## Executive Summary

The v1.1 milestone adds infrastructure-layer improvements to handle the scan-heavy workload (<100 users, hundreds of tags per session). The current Prisma/PostgreSQL stack works for development but will bottleneck under load due to lack of caching, inefficient bulk operations, and no connection pooling strategy beyond Prisma's default.

**Key decisions:**
1. **Redis cache** using `@nestjs/cache-manager` + `ioredis` -- NOT `redis` (node-redis) due to ioredis's superior cluster support and streaming API
2. **Connection pooling** via `pg` driver directly + PgBouncer for <100 user scale -- NOT increasing Prisma pool size (expensive connections)
3. **Batch scan buffer** using in-memory queue with Redis fallback -- NOT BullMQ (overkill for <100 users, adds Redis dependency)
4. **Service boundaries** via domain modules with shared kernel pattern -- NOT separate microservices (monolith is correct for <100 users)

---

## 1. Redis Cache Layer

### Why Cache in This Context

The RFID inventory system has specific read patterns that benefit from caching:

| Query Pattern | Frequency | Cache Benefit |
|---------------|-----------|---------------|
| Tag lookup by EPC | Every scan | HIGH -- repeated lookups during batch sessions |
| Stock summary (getStockSummary) | Dashboard refreshes | HIGH -- expensive aggregation, refreshed every 30s |
| Product details for tag | Every tag in scan results | MEDIUM -- denormalized in tag response |
| Session/tag history | Per tag | LOW -- rarely re-read |
| Location inventory counts | Per session scan | HIGH -- used to verify counts |

### Table Stakes Features (Must Have)

| Feature | Why Expected | Complexity | Implementation |
|---------|--------------|------------|----------------|
| Tag EPC cache | Scan sessions repeatedly hit same tags | Low | Cache tag data with EPC as key, TTL 5 min |
| Stock summary cache | Expensive aggregation called frequently | Low | Cache result with 30s TTL, invalidate on scan |
| Cache invalidation on writes | Stale data causes incorrect scans | Medium | Invalidate relevant keys on tag update/create |

### Differentiator Features (Valued but Optional)

| Feature | Value Proposition | Complexity | When to Use |
|---------|-------------------|------------|-------------|
| Real-time sync via Redis pub/sub | Web clients get updates without WebSocket complexity | Medium | If EventsGateway becomes bottleneck |
| Distributed rate limiting | Prevent scan floods across instances | Medium | If scaling beyond single instance |
| Session progress cache | Resume interrupted scan sessions | Medium | If scan sessions are long-running |

### Anti-Features to Avoid

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full tag history caching | Memory explosion with large histories | Query with pagination, cache only recent |
| Cache entire product catalog | Static data rarely changes, simple in-memory | Use `@nestjs/cache-manager` in-memory for products |
| Write-through cache for all operations | Complexity without benefit for low-write system | Cache reads only, invalidate on writes |

### Recommended Implementation

**Package:** `@nestjs/cache-manager` + `ioredis` + `cache-manager-ioredis-yet`

```typescript
// cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
          ttl: 60 * 1000, // default TTL 60s
        }),
      }),
    }),
  ],
})
export class CacheModule {}
```

**Usage in TagsService:**

```typescript
@Injectable()
export class TagsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findByEpc(epc: string) {
    const cacheKey = `tag:epc:${epc}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Fallback to DB
    const tag = await this.prisma.tag.findUnique({ ... });
    await this.cacheManager.set(cacheKey, tag, 300_000); // 5 min TTL
    return tag;
  }

  async update(epc: string, dto: UpdateTagDto, userId?: string) {
    const result = await this.prisma.$transaction(...);
    // Invalidate cache
    await this.cacheManager.del(`tag:epc:${epc}`);
    await this.cacheManager.del('inventory:summary'); // invalidate summary cache
    return result;
  }
}
```

**Dependencies:** Redis server (can use Docker for local dev)
**Configuration:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in `.env`

### Complexity Estimates

| Feature | Complexity | Time Estimate | Risk |
|---------|------------|---------------|------|
| Basic cache setup + Tag EPC cache | Low | 1-2 days | Low -- well-documented pattern |
| Stock summary cache with invalidation | Medium | 1-2 days | Medium -- invalidation timing tricky |
| Cache service refactoring (existing services) | Medium | 2-3 days | Medium -- many touch points |

---

## 2. Connection Pooling

### Current State Analysis

The app uses `@prisma/adapter-pg` with PrismaClient:

```typescript
// prisma.service.ts (current)
constructor(config: ConfigService) {
  const adapter = new PrismaPg({ connectionString: config.get('DATABASE_URL') });
  super({ adapter });
}
```

**Problem:** The `PrismaPg` adapter creates a connection pool, but:
1. Default pool size is conservative (5 connections)
2. No external pool manager for connection reuse across instances
3. Each PrismaClient instance creates its own pool

### Table Stakes Features (Must Have)

| Feature | Why Expected | Complexity | Implementation |
|---------|--------------|------------|----------------|
| Single PrismaClient instance | Multiple instances exhaust DB connections | Low | Already done via PrismaModule (Global) |
| Configurable pool size | Default too small for scan-heavy workloads | Low | Add `connection_limit` to DATABASE_URL or pool config |
| Connection timeout handling | Long-running scans shouldn't block | Low | Configure `statement_timeout` in PostgreSQL |

### Differentiator Features (Valued but Optional)

| Feature | Value Proposition | Complexity | When to Use |
|---------|-------------------|------------|-------------|
| PgBouncer integration | External connection pooling for multi-instance deployments | Medium | If running multiple NestJS instances |
| Prepared statement caching | Reduce query planning overhead | Low | Works automatically with Prisma + PostgreSQL |
| Read replicas |分流 read-heavy scan queries | High | If read/write ratio is > 10:1 |

### Anti-Features to Avoid

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Massive Prisma pool size (50+) | Each connection = memory; PostgreSQL has per-connection overhead | Use PgBouncer for true pooling |
| Connection per request | Connection setup overhead dominates | Prisma's built-in pool handles this |
| Manual connection management | Reinventing the wheel | Trust Prisma's adapter |

### Recommended Implementation

**Option A: Tune Prisma Pool (Sufficient for <100 users)**

```typescript
// prisma.service.ts
constructor(config: ConfigService) {
  const adapter = new PrismaPg({
    connectionString: config.get('DATABASE_URL'),
    max: 20,  // connection pool size
    idleTimeout: 30,  // seconds before idle connection is closed
    connectionTimeout: 10,  // seconds to wait for connection
  });
  super({ adapter });
}
```

**Option B: PgBouncer (Recommended for multi-instance)**

For production with multiple NestJS instances:

```bash
# docker-compose.yml addition
pgbouncer:
  image: edoburu/pgbouncer
  ports:
    - "6432:5432"
  environment:
    DATABASE_URL: "postgres://user:pass@postgres:5432/rfid_inventory"
    POOL_MODE: "transaction"  # Required for Prisma
    MAX_CLIENT_CONN: 100
    DEFAULT_POOL_SIZE: 20
```

```typescript
// prisma.service.ts
constructor(config: ConfigService) {
  const adapter = new PrismaPg({
    connectionString: `${config.get('DATABASE_URL')}?pgbouncer=true`,
    // No max here -- PgBouncer handles pooling
  });
  super({ adapter });
}
```

**Note:** `pgbouncer=true` in connection string tells Prisma to disable prepared statements (not supported in transaction mode).

### Complexity Estimates

| Feature | Complexity | Time Estimate | Risk |
|---------|------------|---------------|------|
| Tune Prisma pool size | Low | 1 day | Low -- just config changes |
| PgBouncer setup | Medium | 1-2 days | Medium -- transaction mode quirks with Prisma Migrate |

---

## 3. Batch Scan Buffer

### Why Buffer in This Context

> "hundreds of tags per scan session" -- The ST-H103 RFID reader dumps all tags in rapid succession. Without buffering, the system would either:
> 1. Make hundreds of individual DB queries (N+1 problem)
> 2. Make one massive query that times out
> 3. Drop tags due to backpressure

### Table Stakes Features (Must Have)

| Feature | Why Expected | Complexity | Implementation |
|---------|--------------|------------|----------------|
| Client-side batching | Reduce network round-trips from scanner | Low | Aggregate EPCs in mobile app before sending |
| Server-side batch endpoint | Accept array of EPCs, query in single DB call | Low | Already partially implemented in InventoryService.processOperation |
| Buffer with debounce | Don't hammer DB on rapid scans | Medium | Buffer in memory, flush on interval or threshold |

### Differentiator Features (Valued but Optional)

| Feature | Value Proposition | Complexity | When to Use |
|---------|-------------------|------------|-------------|
| Redis-backed buffer | Survive server restarts, distributed buffers | Medium | If scan sessions span multiple servers |
| Async processing | Don't block scan response | Medium | If scans need < 100ms response time |
| Conflict resolution | Same tag scanned multiple times | Medium | If reader reports same tag multiple times per session |

### Anti-Features to Avoid

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Per-tag webhook/endpoint | Extreme network overhead | Batch in mobile app, send 50-100 EPCs per request |
| Full scan session buffering | Memory pressure on large sessions | Process in chunks (500 tags at a time) |
| Blocking flush on every scan | No benefit over direct writes | Use debounced background flush |

### Recommended Implementation

**Pattern: Debounced Batch Processor**

```typescript
// batch-scan.service.ts
@Injectable()
export class BatchScanService {
  private buffer: Map<string, { epc: string; scannedAt: Date; userId?: string }> = new Map();
  private flushInterval = 5000; // 5 seconds
  private maxBufferSize = 500;
  private timer: NodeJS.Timeout;

  constructor(private inventoryService: InventoryService) {
    // Start periodic flush
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  addToBuffer(epc: string, userId?: string) {
    // Idempotent: same EPC in same session = one entry
    this.buffer.set(epc, { epc, scannedAt: new Date(), userId });

    // Flush if buffer is full
    if (this.buffer.size >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.size === 0) return;

    const toProcess = Array.from(this.buffer.values());
    this.buffer.clear();

    // Process in background
    try {
      await this.inventoryService.processBulkScan(toProcess);
    } catch (error) {
      // Log error but don't throw -- scans already received
      console.error('Batch flush failed:', error);
    }
  }

  onModuleDestroy() {
    clearInterval(this.timer);
    this.flush(); // Final flush on shutdown
  }
}
```

**Endpoint for receiving scans:**

```typescript
// scanner.controller.ts
@Post('scan/batch')
async receiveBatchScan(@Body() dto: { epcs: string[]; sessionId: string }) {
  // Acknowledge immediately
  dto.epcs.forEach(epc => this.batchScanService.addToBuffer(epc));
  return { accepted: dto.epcs.length };
}
```

**Alternative: Redis Stream (If Distributed Required)**

If you need scan distribution across multiple servers:

```typescript
// Using Redis streams for distributed buffering
import Redis from 'ioredis';

@Injectable()
export class DistributedBatchScanService {
  private redis: Redis;
  private consumer = `server-${process.env.HOSTNAME}-${pid}`;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async addToStream(epc: string, userId?: string) {
    await this.redis.xadd('scan:stream', '*',
      'epc', epc,
      'userId', userId || '',
      'scannedAt', Date.now().toString()
    );
  }

  async consumeStream(count: number) {
    // BRPOP-like behavior with blocking
    const results = await this.redis.xreadcount('scan:stream', '>', count);
    return results;
  }
}
```

### Complexity Estimates

| Feature | Complexity | Time Estimate | Risk |
|---------|------------|---------------|------|
| In-memory buffer with debounce | Low | 1-2 days | Low -- simple Map + timer |
| Redis-backed buffer | Medium | 2-3 days | Medium -- Redis connection handling |
| Process chunking (500 at a time) | Low | 1 day | Low -- array splitting |
| Idempotency/deduplication | Medium | 2 days | Medium -- requires session context |

---

## 4. Service Module Boundaries

### Current Architecture

```
AppModule (root)
├── PrismaModule (global) -- PrismaService
├── AuthModule -- authentication
├── UsersModule -- user management
├── TagsModule -- tag CRUD
├── InventoryModule -- stock operations
├── TransfersModule -- transfer workflow
├── OrdersModule -- order management
├── LocationsModule -- location management
├── SessionsModule -- scan sessions
├── EventsModule -- WebSocket gateway
├── DashboardModule -- reporting
├── CategoriesModule -- product categories
├── ProductsModule -- product catalog
├── CaslModule -- authorization
├── ActivityLogModule -- audit logging
└── HealthController -- health checks
```

### Problems with Current Boundaries

1. **TagsService and InventoryService overlap** -- TagsService has `assignTags()` which affects inventory; InventoryService has `processOperation()` which updates tags
2. **SessionsModule does too much** -- Session creation, scan processing, and missing tag detection all in one service
3. **No clear domain boundary between "inventory" and "transfers"** -- TransfersModule should coordinate InventoryService but doesn't

### Table Stakes Features (Must Have)

| Feature | Why Expected | Complexity | Implementation |
|---------|--------------|------------|----------------|
| Domain modules with single responsibility | Easier to understand and test | Low | Already largely done |
| Shared kernel for common types | Prevent duplicate models | Low | Create `@app/common` library |
| Clean module imports (no circular) | Compile-time error prevention | Low | Already enforced by NestJS |

### Differentiator Features (Valued but Optional)

| Feature | Value Proposition | Complexity | When to Use |
|---------|-------------------|------------|-------------|
| Bounded context per domain | Autonomous team capability | Medium | If multiple developers own different features |
| Domain events for cross-module communication | Decouple inventory from transfers | Medium | If transfer workflow changes frequently |
| CQRS separation for read/write | Optimize read-heavy scan queries | High | If complex aggregations become bottleneck |

### Anti-Features to Avoid

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Separate microservices | <100 users; added complexity not worth it | Keep monolith with clear modules |
| Shared services (god modules) | All modules depend on one service = tight coupling | Each module owns its data access |
| Feature folders by file type (all controllers together) | Violates domain cohesion | Group by feature/domain, not file type |

### Recommended Module Structure

```
src/
├── common/                    # Shared kernel
│   ├── filters/              # Exception filters
│   ├── interceptors/        # Logging, timing
│   ├── dto/                  # Common DTOs (pagination, etc.)
│   └── types/               # Shared types, enums
│
├── auth/                     # Authentication domain
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── strategies/
│
├── users/                    # User management domain
│
├── inventory/                # INVENTORY BOUNDED CONTEXT
│   ├── inventory.module.ts   # Public API boundary
│   ├── inventory.service.ts  # Orchestrates operations
│   ├── inventory.controller.ts
│   │
│   ├── scanning/             # SCANNING SUB-DOMAIN
│   │   ├── scanning.service.ts    # Handles scan batching
│   │   ├── scanning.controller.ts # Scan endpoints
│   │   └── scanning.types.ts      # Scan-specific types
│   │
│   ├── verification/         # VERIFICATION SUB-DOMAIN
│   │   ├── verification.service.ts
│   │   └── verification.types.ts
│   │
│   └── cache/                # CACHE ADAPTER (inside inventory)
│       ├── inventory.cache.ts
│       └── summary.cache.ts
│
├── transfers/                # TRANSFER BOUNDED CONTEXT
│   ├── transfers.module.ts
│   ├── transfers.service.ts  # Orchestrates transfer workflow
│   ├── transfers.controller.ts
│   └── workflow/             # State machine for transfer steps
│
├── catalog/                  # CATALOG BOUNDED CONTEXT
│   ├── products/
│   ├── categories/
│   └── locations/
│
├── sessions/                 # SESSION MANAGEMENT
│   ├── sessions.module.ts
│   ├── sessions.service.ts
│   └── sessions.controller.ts
│
├── events/                   # Real-time events (WebSocket)
│   ├── events.module.ts
│   └── events.gateway.ts
│
└── prisma/                   # Database access
    ├── prisma.module.ts
    └── prisma.service.ts
```

### Key Boundary Decisions

| Boundary | What It Owns | What It Delegates |
|----------|--------------|------------------|
| InventoryModule | Tag status, stock summary, scan processing | Calls PrismaService for data |
| TransfersModule | Transfer workflow state machine | Calls InventoryService for stock updates |
| ScanningService (inside Inventory) | Batch buffering, deduplication | Calls TagsService for individual lookups |
| CatalogModule (Products + Categories + Locations) | Product data, location hierarchy | Consumed by InventoryModule |

### Dependency Rule
```
inventory.module.ts → prisma.module.ts (data access)
inventory.module.ts → events.module.ts (notifications)
inventory.module.ts ← transfers.module.ts (transfers call inventory)
catalog.module.ts → prisma.module.ts
```

### Complexity Estimates

| Feature | Complexity | Time Estimate | Risk |
|---------|------------|---------------|------|
| Extract common DTOs to shared | Low | 1 day | Low -- copy/paste refactor |
| Separate ScanningService from InventoryService | Medium | 2-3 days | Medium -- moving code between modules |
| Create Transfer workflow state machine | Medium | 2-3 days | Medium -- new logic but isolated |
| Verify no circular dependencies | Low | 1 day | Low -- NestJS catches at compile |

---

## 5. Feature Dependencies

```
Redis Cache Layer
    ↓
    ├─→ Stock summary cache (needs CacheModule)
    └─→ Batch scan buffer (can optionally use Redis streams)

Connection Pooling
    │
    └─→ Independent of cache layer; configure PrismaPg adapter

Batch Scan Buffer
    │
    └─→ Depends on InventoryService (needs processBulkScan method)

Service Module Boundaries
    │
    ├─→ ScanningService extracted from InventoryService
    └─→ TransfersModule coordinates with InventoryModule
```

---

## 6. MVP Recommendation for v1.1

**Prioritize in order:**

1. **Connection Pool Tuning** (Lowest risk, immediate benefit)
   - Tune `max` pool size in PrismaPg adapter
   - Estimated: 1 day
   - Risk: Low

2. **Stock Summary Cache** (High impact, straightforward)
   - Cache `getStockSummary()` result with 30s TTL
   - Invalidate on tag status changes
   - Estimated: 1-2 days
   - Risk: Low-Medium (cache invalidation timing)

3. **Batch Scan Buffer (In-Memory)** (Addresses scan-heavy workload)
   - Add `BatchScanService` with 5s debounce
   - Add `/scan/batch` endpoint
   - Estimated: 2 days
   - Risk: Low-Medium (memory pressure on large sessions)

4. **Service Boundary Cleanup** (Long-term maintainability)
   - Extract `ScanningService` from `InventoryService`
   - Create `@app/common` for shared DTOs
   - Estimated: 3-4 days
   - Risk: Medium (many touch points)

**Defer to v1.2:**
- PgBouncer integration (only if multi-instance)
- Redis-backed distributed buffer (only if single-server bottleneck)
- Real-time sync via Redis pub/sub (EventsGateway sufficient)

---

## 7. Dependencies on Existing System

| Existing Component | v1.1 Changes | Impact |
|--------------------|-------------|--------|
| PrismaService | Add pool config to adapter | Low -- add constructor param |
| TagsService | Add cache wrapper to `findByEpc` | Low -- add decorator/filter |
| InventoryService | Add `processBulkScan` method | Low -- new method |
| EventsModule | None | -- |
| SessionsModule | May need to call BatchScanService | Low -- add import |

---

## 8. Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Redis cache patterns | MEDIUM | Training data + NestJS docs; WebSearch unavailable to verify latest ioredis API |
| Connection pooling | MEDIUM-HIGH | Prisma docs confirmed pool config; pgBouncer details from training data |
| Batch scan buffer | MEDIUM | Pattern is standard; implementation details adapted for RFID context |
| Service boundaries | MEDIUM | NestJS module patterns well-documented; domain boundaries are judgment calls |

---

## 9. Sources

- **Context7:** Not available (WebSearch returning errors)
- **Prisma Documentation:** Connection management, PgBouncer integration (verified via WebFetch)
- **Training Data:** NestJS caching (@nestjs/cache-manager), ioredis, batch processing patterns
- **Direct Code Analysis:** Current codebase at `/Users/heymac/Desktop/Project/RFIDInventory`

**Validation needed:** Verify `@nestjs/cache-manager` + `ioredis` integration patterns against current NestJS 11.x documentation before implementation.
