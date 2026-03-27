# Technology Stack: v1.1 Performance & Scale Preparation

**Project:** RFIDInventory
**Milestone:** v1.1 - Redis cache, connection pooling, batch scan buffer, service boundaries
**Researched:** 2026-03-27
**Confidence:** MEDIUM (npm registry data, limited third-party verification)

---

## Recommended Stack Additions

### Core Caching Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@nestjs/cache-manager** | 3.1.0 | NestJS-first cache abstraction | Official NestJS package, works with NestJS 11.x, provides decorators (@Cacheable, @CacheEvict, @CacheTTL), integrates with Guards/Interceptors |
| **@tirke/node-cache-manager-ioredis** | 3.6.0 | ioredis store for cache-manager | Actively maintained (Dec 2023), supports cache-manager 5.x, TypeScript types included, better maintained than alternatives (cache-manager-ioredis-yet 2.1.2 is older) |
| **ioredis** | 5.10.1 | Redis client | Standard for Node.js/Redis, connection pooling built-in, cluster mode support, pub/sub capabilities. node-redis is alternative but ioredis has better NestJS ecosystem integration |

### Batch Scan Buffer / Job Queue

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@nestjs/bullmq** | 11.0.4 | NestJS BullMQ integration | Official NestJS package, BullMQ is the modern successor to Bull (Bull is in maintenance), reliable job queue, backpressure handling, delayed jobs, priority queues, rate limiting |
| **bullmq** | 5.71.1 | Underlying queue engine | Required by @nestjs/bullmq, Redis-based, supports streams, priority, delays, retries with exponential backoff |

### Connection Pooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Already covered** | - | Prisma with @prisma/adapter-pg uses pg pool | pg (8.x+) includes built-in connection pooling via pg.Pool. @prisma/adapter-pg 7.x wraps this. No additional package needed. Tune via `DATABASE_URL` or Prisma `connection_limit` in URL |

### Service Boundaries

| Technology | Purpose | Why |
|------------|---------|-----|
| **New: CacheModule** | Centralize Redis/cache configuration | Single responsibility, testable, swappable |
| **New: QueueModule** | Centralize BullMQ configuration | Decouples batch processing from HTTP request lifecycle |
| **Existing modules** | Already well-structured | Tags, Transfers, Locations, Inventory, Sessions, Events, Dashboard are already separate modules. No restructuring needed for service boundaries |

---

## NOT Recommended / Anti-Patterns

| Package | Why Avoid | Instead |
|---------|-----------|---------|
| **cache-manager-ioredis-yet** (2.1.2) | Older, less maintained than @tirke/node-cache-manager-ioredis | @tirke/node-cache-manager-ioredis |
| **Bull** (deprecated) | In maintenance mode, no new features | BullMQ (via @nestjs/bullmq) |
| **node-cache-manager-ioredis-store** | No recent updates, abandoned | @tirke/node-cache-manager-ioredis |
| **pg-pool** (standalone) | Redundant | pg (already included via @prisma/adapter-pg) already handles pooling |

---

## Installation

```bash
# Core caching
npm install @nestjs/cache-manager@3.1.0 cache-manager@7.2.8 @tirke/node-cache-manager-ioredis@3.6.0 ioredis@5.10.1

# Job queue for batch scan buffer
npm install @nestjs/bullmq@11.0.4 bullmq@5.71.1
```

**Peer dependencies (no action needed, already satisfied):**
- @nestjs/common: ^11.0.0 (already on 11.0.1)
- @nestjs/core: ^11.0.0 (already on 11.0.1)
- rxjs: ^7.8.1 (already on 7.8.1)

---

## Integration Points

### NestJS App Module

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from '@tirke/node-cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT, 10),
          ttl: 60 * 1000, // 60 seconds default TTL
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

### BullMQ for Batch Scan Processing

```typescript
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
      },
    }),
    BullModule.registerQueue({
      name: 'scan-processing',
    }),
  ],
})
export class ScanModule {}
```

### Prisma Connection Pooling (already handled)

```typescript
// In prisma.service.ts or datasource URL
// DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
// pg pool is managed by @prisma/adapter-pg - no additional configuration needed
```

---

## Environment Variables

```env
# Redis (for cache and BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# Database pooling (via Prisma)
# connection_limit and pool_timeout can be set in DATABASE_URL
```

---

## Architecture: New Modules

```
src/
  cache/                    # NEW: Centralized cache module
    cache.module.ts
    cache.service.ts        # Optional: wrapper for complex cache operations
  queue/                    # NEW: Centralized queue module
    queue.module.ts
    processors/
      scan.processor.ts     # Batch scan processing
```

**Service boundary approach:**
- CacheModule registered globally (no need to import in every module)
- QueueModule provides scan-processing queue for batch operations
- Existing modules remain unchanged; inject CacheModule/QueueModule where needed

---

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| npm registry (@nestjs/cache-manager, @tirke/node-cache-manager-ioredis, @nestjs/bullmq) | HIGH | Direct package metadata |
| npm registry (ioredis, bullmq) | HIGH | Direct package metadata |
| npm registry (@prisma/adapter-pg) | HIGH | Shows pg dependency |
| NestJS documentation (implicit via package peer deps) | MEDIUM | No direct docs fetch, inferred from package design |

---

## Open Questions

1. **Redis vs. in-memory for single-instance**: If not scaling horizontally, node-cache-manager with memory store may suffice. Add Redis when multi-instance deployment is planned.

2. **BullMQ vs. Kafka/Redis Streams**: For scan-heavy workloads at <100 users, BullMQ is appropriate. Consider Kafka/Redis Streams only if throughput requirements exceed ~10K scans/second.

3. **Session storage in Redis**: Currently using database-backed sessions (Prisma Session model). If Redis session store is needed for horizontal scaling, consider @nestjs-session.
