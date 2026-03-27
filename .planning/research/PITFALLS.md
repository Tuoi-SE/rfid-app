# Domain Pitfalls: Redis Cache, Connection Pooling, Batch Scan Buffer, Service Boundaries

**Project:** RFID Inventory v1.1 - Performance and Scale Preparation
**Domain:** NestJS + Prisma + PostgreSQL + Redis
**Researched:** 2026-03-27
**Confidence:** MEDIUM (Prisma connection info from official docs verified; NestJS caching/batch patterns from training data, not live verified)

---

## Critical Pitfalls

Mistakes that cause rewrites, data inconsistency, or production outages.

### Pitfall 1: Cache Invalidation Stampede

**What goes wrong:** When cache expires or is invalidated, multiple concurrent requests all miss cache and hit the database simultaneously, overwhelming PostgreSQL.

**Why it happens:** RFID inventory queries (e.g., `getStockSummary()`) are high-traffic during scan sessions. If cache TTL is too short or invalidation is aggressive, hundreds of concurrent scans trigger simultaneous DB queries.

**Consequences:**
- Database connection pool exhaustion
- Response time spikes from ~50ms to 5000ms+
- Cache provides zero benefit during peak scan activity

**Prevention:**
```typescript
// BAD: Short TTL on frequently-updated inventory data
@Injectable()
class InventoryService {
  async getStockSummary() {
    return cacheManager.get(`stock-summary:${warehouseId}`, // expires in 5 seconds
      () => this.prisma.tag.groupBy(...),
      { ttl: 5 }
    );
  }
}

// GOOD: Longer TTL + staggered invalidation + probabilistic early expiration
@Injectable()
class InventoryService {
  private readonly CACHE_TTL = 30; // seconds
  private readonly JITTER = 5;    // random jitter to prevent stampede

  async getStockSummary() {
    const jitter = Math.random() * this.JITTER;
    return cacheManager.get(`stock-summary:${warehouseId}`,
      () => this.prisma.tag.groupBy(...),
      { ttl: this.CACHE_TTL + jitter }
    );
  }
}
```

**Detection:** Prometheus/Grafana showing simultaneous spikes in DB query count and cache miss rate during scan sessions.

---

### Pitfall 2: Redis Cache Data Becomes Stale for Real-Time Inventory

**What goes wrong:** Inventory counts remain stale even after scans complete because cache invalidation is not triggered on scan events.

**Why it happens:** RFID scan sessions update `Tag` records directly via Prisma without invalidating related cache entries. Web dashboard shows incorrect stock levels until cache TTL expires.

**Consequences:**
- Dashboard displays wrong quantities during active scan sessions
- Users lose confidence in real-time claims
- Violates "inventory must update immediately" requirement

**Prevention:**
```typescript
// BAD: Scan updates bypass cache entirely
async processScan(dto: CreateScanDto) {
  await this.prisma.tag.update({ where: { epc }, data: { lastSeenAt, locationId } });
  // No cache invalidation!
}

// GOOD: Invalidate cache on scan, publish event for reactive updates
async processScan(dto: CreateScanDto) {
  const result = await this.prisma.tag.update({ where: { epc }, data: { lastSeenAt, locationId } });

  // Invalidate location-specific cache
  await this.cacheManager.invalidate(`stock-summary:${result.locationId}`);

  // Emit WebSocket event for real-time push
  this.eventsGateway.emit('inventoryUpdated', { locationId: result.locationId });

  return result;
}
```

**Detection:** WebSocket `scanDetected` events fire but dashboard quantities do not change.

---

### Pitfall 3: Prisma Connection Pool Exhaustion with Serverless/High-Concurrency

**What goes wrong:** PostgreSQL connection limit reached, new queries fail with connection timeout errors.

**Why it happens:** (Verified from Prisma official docs)
- Multiple `PrismaClient` instances created instead of reusing singleton
- Long-running scan sessions hold connections open
- PgBouncer not configured for transaction-mode Prisma usage
- Each scan query borrows a connection for its lifetime

**Consequences:**
- `PrismaClientKnownRequestError`: Connection terminated
- New scan sessions fail to process tags
- 503 Service Unavailable during peak scanning

**Prevention:**
```typescript
// In src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: { url: process.env.DATABASE_URL }
      },
      // Connection pool settings for high concurrency
      connectionLimit: 20,           // Per-instance limit
      poolTimeout: 10,               // Seconds to wait for connection
      idleTimeout: 30,               // Seconds before idle connection closed
    });
  }
}
```

**For PgBouncer (production):**
```bash
# pgbouncer.ini
[databases]
rfid_inventory = host=localhost dbname=rfid_inventory pool_size=20

[pgbouncer]
pool_mode = transaction          # REQUIRED for Prisma
max_client_conn = 100
default_pool_size = 20
```

```typescript
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtension"] // For pgbouncer=true
}

// .env
DATABASE_URL = "postgresql://user:pass@host:5432/rfid_inventory?pgbouncer=true"
```

**Detection:** `Connection timeout` in Prisma logs, `too many connections` PostgreSQL errors.

---

### Pitfall 4: Batch Scan Buffer Memory Leak with Unbounded Queues

**What goes wrong:** Batch scan buffer accumulates scans without limits, causing OutOfMemory errors during long scan sessions with hundreds of tags.

**Why it happens:**
- In-memory buffer grows unbounded: `private buffer: ScanEvent[] = []`
- No flush trigger based on count, time, or memory pressure
- Worker failure leaves buffered scans orphaned

**Consequences:**
- Node.js process crashes with heap out of memory
- All buffered scans lost
- Incomplete inventory records

**Prevention:**
```typescript
@Injectable()
export class BatchScanBuffer {
  private buffer: ScanEvent[] = [];
  private readonly MAX_BUFFER_SIZE = 100;    // Flush at 100 scans
  private readonly MAX_BUFFER_AGE = 5000;   // Flush at 5 seconds
  private readonly MAX_MEMORY_MB = 50;      // Emergency limit

  constructor(private readonly prisma: PrismaService) {
    // Time-based flush
    setInterval(() => this.flush(), this.MAX_BUFFER_AGE);
  }

  async add(scan: ScanEvent): Promise<void> {
    this.buffer.push(scan);

    // Count-based flush
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flush();
    }

    // Memory-based safety limit
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memUsage > this.MAX_MEMORY_MB) {
      this.logger.warn('Memory pressure: forcing flush');
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const toProcess = this.buffer.splice(0, this.buffer.length);
    await this.processBatch(toProcess);
  }
}
```

**Detection:** `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed` in Node logs, RSS memory growth monitoring.

---

### Pitfall 5: Circular Module Dependencies When Adding Service Boundaries

**What goes wrong:** NestJS refuses to start with `Circular dependency` errors when modules are split.

**Why it happens:** Splitting a monolith into service boundaries often creates circular imports:
```
TagsModule -> InventoryModule -> TagsModule (circular!)
```

**Consequences:**
- Application fails to bootstrap
- `Nest cannot resolve dependencies` errors
- Extended debugging sessions

**Prevention:**
1. **Use `forwardRef()` sparingly** for existing circular dependencies:
```typescript
@Module({
  imports: [forwardRef(() => InventoryModule)],
})
export class TagsModule {}
```

2. **Prefer event-driven boundaries** over direct imports:
```typescript
// Instead of: TagsModule imports InventoryModule directly
// Use: EventsGateway as intermediary
@Injectable()
class TagsService {
  constructor(private readonly eventsGateway: EventsGateway) {
    // Publish domain events instead of calling InventoryService directly
    this.eventsGateway.emit('tagScanned', { tagId, locationId });
  }
}
```

3. **Extract shared logic into a new CommonModule**:
```typescript
// src/common/common.module.ts
@Module({})
export class CommonModule {
  // Shared utilities, constants, interfaces
}

// Both modules import CommonModule, not each other
```

**Detection:** `Circular dependency!` error on `npm run start:dev`.

---

## Moderate Pitfalls

### Pitfall 6: Stale Cache + WebSocket Event Race Condition

**What goes wrong:** Cache is invalidated, but WebSocket event arrives before DB transaction commits, causing client to fetch stale data from cache.

**Why it happens:**
```
1. Scan arrives
2. Cache invalidated (empty)
3. WebSocket "scanDetected" emitted
4. Client requests GET /inventory (cache miss, hits DB)
5. DB transaction not yet committed (write delay)
6. Client gets stale data, caches it
```

**Prevention:**
```typescript
async processScan(dto: CreateScanDto) {
  return this.prisma.$transaction(async (tx) => {
    const result = await tx.tag.update(...);

    // Invalidate cache INSIDE transaction boundary
    await this.cacheManager.invalidate(`stock-summary:${result.locationId}`);

    // Emit AFTER transaction commits
    this.eventsGateway.emit('scanDetected', result);

    return result;
  });
}
```

**Detection:** Dashboard quantity briefly shows wrong value after rapid scans.

---

### Pitfall 7: Batch Processing Idempotency Not Enforced

**What goes wrong:** If batch flush fails mid-operation, retry creates duplicate TagEvent records.

**Why it happens:** Scan events processed twice when:
- Flush timeout triggers while previous flush is still running
- Network error on second flush attempt after partial success

**Prevention:**
```typescript
@Injectable()
export class BatchScanBuffer {
  private readonly processing = new Set<string>(); // EPCs being processed

  async flush(): Promise<void> {
    const toProcess = this.buffer.splice(0, this.buffer.length);
    const epcKey = toProcess.map(s => s.epc).sort().join(':');

    // Idempotency guard
    if (this.processing.has(epcKey)) {
      this.logger.debug('Batch already processing, skipping');
      return;
    }
    this.processing.add(epcKey);

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const scan of toProcess) {
          // Use upsert to handle duplicate EPCs in same batch
          await tx.tagEvent.upsert({
            where: { id: `${scan.epc}-${scan.scannedAt}` },
            create: { ... },
            update: { ... } // Ignore duplicates
          });
        }
      });
    } finally {
      this.processing.delete(epcKey);
    }
  }
}
```

**Detection:** Duplicate TagEvent records with same EPC and timestamp.

---

### Pitfall 8: Connection Pool Starvation During Long Scan Sessions

**What goes wrong:** Long-running scan sessions hold Prisma connections, preventing other operations (dashboard, admin) from executing.

**Why it happens:** Each WebSocket `scanStream` event opens a Prisma query. With 50 concurrent mobile scanners, connections accumulate and are held until session ends.

**Prevention:**
```typescript
// events.gateway.ts
@WebSocketGateway()
export class EventsGateway {
  // Use separate Prisma instance for real-time processing
  private readonly scanPrisma: PrismaService;

  async handleScanStream(stream: Observable<ScanEvent>) {
    stream.pipe(
      // Buffer scans in memory, not DB connections
      bufferTime(100),
      filter(scans => scans.length > 0),
      // Process in fire-and-forget, don't hold connection
      mergeMap(scans => this.batchBuffer.add(scans))
    ).subscribe();
  }
}
```

**Detection:** Dashboard queries timeout while scan sessions are active.

---

## Minor Pitfalls

### Pitfall 9: Cache Key Naming Collisions

**What goes wrong:** Cache entries from different warehouses/tenants overwrite each other.

**Why it happens:** Simple key names like `inventory` or `stock-summary` used without namespace.

**Prevention:**
```typescript
// Use hierarchical, namespaced keys
const CACHE_KEYS = {
  stockSummary: (warehouseId: string) => `inventory:${warehouseId}:stock-summary`,
  tagDetails: (epc: string) => `inventory:tags:${epc}`,
  locationInventory: (locationId: string) => `inventory:${locationId}:tags`,
};
```

---

### Pitfall 10: PgBouncer Transaction Mode + Prisma Migrate Conflict

**What goes wrong:** Running `prisma migrate` with PgBouncer in transaction mode fails because PgBouncer does not support advisory locks.

**Why it happens:** Prisma Migrate requires `SET LOCK_TIMEOUT` and advisory locks that PgBouncer does not support in transaction mode.

**Prevention:**
```bash
# Use direct connection for migrations
DATABASE_URL="postgresql://user:pass@host:5432/rfid_inventory" npm run prisma:migrate

# Use pooled connection for application
DATABASE_URL="postgresql://user:pass@host:5432/rfid_inventory?pgbouncer=true" npm run start:prod
```

---

### Pitfall 11: Missing Cache Warm-up on Startup

**What goes wrong:** First dashboard load after restart is slow because all caches are cold.

**Why it happens:** Cache empty on startup, first user triggers N cache misses and N slow DB queries.

**Prevention:**
```typescript
// app.module.ts - OnModuleInit
async onModuleInit() {
  const locations = await this.prisma.location.findMany();
  await Promise.all(
    locations.map(loc => this.inventoryService.getStockSummary(loc.id))
  );
  this.logger.log(`Cache warm-up complete: ${locations.length} locations`);
}
```

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Redis cache layer | Stampede on cache miss | Add jitter to TTL, use `set` with NX flag for distributed locking |
| Cache invalidation | Stale reads after scans | Invalidate inside DB transaction, emit WebSocket after commit |
| Connection pooling | Exhaustion during peak scans | Configure `connectionLimit: 20`, monitor `pool_timeout` metrics |
| Batch scan buffer | Memory leak on long sessions | Set MAX_BUFFER_SIZE, MAX_BUFFER_AGE, memory monitoring |
| Batch flush | Duplicate events on retry | Idempotency keys on TagEvent.upsert |
| Service boundaries | Circular dependencies | Extract CommonModule, prefer event-driven over direct imports |
| PgBouncer setup | Migrate conflicts | Separate DATABASE_URL for migrate vs app, use `?pgbouncer=true` |
| Cache warm-up | Cold start slowness | OnModuleInit pre-populate hot paths |

---

## Inventory-Specific Warnings

| Warning | Context | Action |
|---------|---------|--------|
| Scan-heavy workload amplifies all pitfalls | Hundreds of tags per session | Load test with simulated scan bursts |
| Multi-warehouse queries | HCM, Hanoi, Workshops have separate inventory | Namespaced cache keys per locationId |
| Real-time requirement | "Inventory must update immediately" | Cache invalidation MUST be synchronous with scan |
| TagEvent accumulation | Every scan creates event | Batch buffer reduces DB write rate |
| Status vs Location distinction | Cache `status` separately from `locationId` | Different TTL strategies: status=5min, location=30s |

---

## Sources

| Source | Confidence | Content |
|--------|------------|---------|
| Prisma official docs (WebFetch) | HIGH | Connection pool basics, multiple instances, PgBouncer config |
| NestJS training data | MEDIUM | Caching patterns, module boundaries |
| RFID inventory patterns (training) | MEDIUM | Batch scan behavior, real-time requirements |
| Common Redis patterns (training) | MEDIUM | Cache invalidation strategies, TTL jitter |

**Note:** Live verification of NestJS caching docs failed (JavaScript-rendered). All NestJS-specific patterns should be validated against official docs before implementation.
