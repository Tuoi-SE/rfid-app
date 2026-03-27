# Phase 06: Connection Pooling Foundation - Research

**Researched:** 2026-03-27
**Domain:** Prisma ORM v7 + @prisma/adapter-pg + PostgreSQL connection pool configuration
**Confidence:** HIGH

## Summary

This phase tunes Prisma's PostgreSQL connection pool for concurrent scan workloads. The project uses Prisma v7.5.0 with `@prisma/adapter-pg` 7.5.0, which wraps the `pg` library's connection pool. The key discovery is that Prisma v7 (unlike v5/v6) does NOT use URL parameters like `?connection_limit=N` for pool sizing. Instead, pg Pool options (`max`, `connectionTimeoutMillis`, etc.) must be passed directly to the `PrismaPg` constructor as a second-level config object. The implementation requires modifying `PrismaService` to pass `max: 20` (or configurable value) to the adapter, along with reasonable timeouts.

**Primary recommendation:** Update `PrismaService` to pass pg Pool config (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`) directly to the `PrismaPg` constructor, with `DATABASE_POOL_SIZE` as a configurable env var override.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Connection limit configurable via `DATABASE_URL?connection_limit=N` — simple approach, no new env var needed
- **D-02:** Default connectionLimit: 20 (sufficient for <100 users)
- **D-03:** PgBouncer deferred to v1.2 — single instance sufficient for current scale
- **D-04:** PrismaPg adapter already in use — pool tuning via connection_string parameter
- **D-05:** No new packages required

### Claude's Discretion
- Pool size (20) can be adjusted based on actual load testing
- Monitoring approach (metrics/logging) left to Phase 10 or later

### Deferred Ideas (OUT OF SCOPE)
- None — Phase 06 scope stayed focused on connection pooling foundation.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POOL-01 | PrismaService configured with tuned connection pool size (connectionLimit: 20) | PrismaPg accepts `max` for pool size — update constructor to pass `max: 20` |
| POOL-02 | Connection limit configurable via DATABASE_URL or environment variable | pg Pool `max` cannot be in URL string — must be separate config; easiest approach is `DATABASE_POOL_SIZE` env var or URL param extraction |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@prisma/adapter-pg` | 7.5.0 | Prisma PostgreSQL driver adapter | Already in use, wraps pg Pool |
| `@prisma/client` | 7.5.0 | Prisma ORM | Already in use |
| `pg` (transitive) | (via adapter) | Node.js PostgreSQL driver | Used by @prisma/adapter-pg |

### No New Packages Required
Connection pool tuning uses existing `pg` driver options passed to `PrismaPg` — no additional packages.

**Installation:** No new packages needed.

---

## Architecture Patterns

### PrismaService with Tuned Pool (Current)

```typescript
// backend/src/prisma/prisma.service.ts (CURRENT)
constructor(config: ConfigService) {
  const adapter = new PrismaPg({ connectionString: config.get('DATABASE_URL') });
  super({ adapter });
}
```

### PrismaService with Tuned Pool (Target)

```typescript
// backend/src/prisma/prisma.service.ts (TARGET)
constructor(config: ConfigService) {
  const databaseUrl = config.get('DATABASE_URL');
  const poolSize = this.parsePoolSize(databaseUrl); // extracts ?connection_limit=N or uses default

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    max: poolSize,                          // POOL-01: 20 connections default
    idleTimeoutMillis: 30_000,             // 30 seconds idle before closing
    connectionTimeoutMillis: 5_000,        // 5 seconds to acquire connection
  });
  super({ adapter });
}

private parsePoolSize(databaseUrl: string): number {
  try {
    const url = new URL(databaseUrl);
    const connectionLimit = url.searchParams.get('connection_limit');
    if (connectionLimit) {
      const parsed = parseInt(connectionLimit, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Invalid URL, ignore
  }
  return 20; // POOL-02 default
}
```

### Why `max` and not `connectionLimit`?

Prisma v7 with driver adapters changed the API. Connection pool options are passed to the underlying `pg.Pool`, which uses `max` for pool size (not `connectionLimit`). This was confirmed from the official Prisma v7 docs on connection pool configuration.

**Source:** [Prisma v7 Connection Pool docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool) — "Pool size" column shows `max` for PostgreSQL pg driver.

### Connection String Parsing for `connection_limit`

The `pg` library's `Pool` constructor does NOT parse `connection_limit` from the URL string — it only accepts it as a numeric config property. Therefore, the `parsePoolSize()` helper extracts it from the URL manually (D-01's intent) before passing to the adapter.

### Integration Points
- `PrismaService` is the only file needing changes
- `ConfigService` already available via `@nestjs/config`
- `onModuleInit`/`onModuleDestroy` already handle connect/disconnect
- No changes needed in other services

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Connection pooling from scratch | Build custom connection manager | Already provided by `pg` Pool via `@prisma/adapter-pg` | pg Pool handles connection borrowing, release, idle cleanup — building this manually is error-prone |
| Multi-instance connection limit | Manually coordinate pool sizes across instances | PgBouncer (Phase 1.2 per D-03) | Without PgBouncer, each app instance has independent pools that can collectively exceed DB limits |

---

## Common Pitfalls

### Pitfall 1: Prisma Connection Pool Exhaustion (Relevant to this phase)

**What goes wrong:** PostgreSQL connection limit reached, queries fail with connection timeout errors.

**Why it happens:** Multiple `PrismaClient` instances, no pool size tuning, long-running queries holding connections.

**Prevention:** Set `max: 20` in PrismaPg constructor, `connectionTimeoutMillis: 5000` to fail fast, `idleTimeoutMillis: 30000` to recycle idle connections.

**Detection:** `Connection timeout` in logs, `too many connections` PostgreSQL errors.

### Pitfall 2: URL Parameter Parsing Mismatch

**What goes wrong:** Setting `?connection_limit=20` in DATABASE_URL has no effect because pg Pool doesn't parse it from the URL.

**Why it happens:** Prisma v7 pg adapter passes connectionString to pg Pool as-is. pg Pool only reads host/port/user/db from the URL, not pool options.

**Prevention:** Parse `connection_limit` from the URL manually in PrismaService and pass as `max` in adapter options (see implementation pattern above).

### Pitfall 3: PgBouncer + Prisma Migrate Conflict (Deferred to v1.2)

**What goes wrong:** Running `prisma migrate` with PgBouncer in transaction mode fails because PgBouncer does not support advisory locks.

**Prevention (when PgBouncer added):** Use separate `DATABASE_URL` without `?pgbouncer=true` for migrations.

---

## Code Examples

### Parse `connection_limit` from DATABASE_URL

```typescript
// Source: Implementation pattern based on pg Pool API + Prisma v7 docs
private parsePoolSize(databaseUrl: string): number {
  try {
    const url = new URL(databaseUrl);
    const connectionLimit = url.searchParams.get('connection_limit');
    if (connectionLimit) {
      const parsed = parseInt(connectionLimit, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Invalid URL, fall through to default
  }
  return 20;
}
```

### PrismaPg with Pool Config

```typescript
// Source: Prisma v7 official docs (connection-pool page)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 10,                           // Pool size (default to 20 for this project)
  connectionTimeoutMillis: 5000,     // 5 second acquire timeout
  idleTimeoutMillis: 30_000,         // 30 second idle timeout
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma v5/v6: `connection_limit=N` URL param | Prisma v7: pass `max` to adapter constructor | Prisma v7 (2024) | pg Pool options now separate from connection string |
| Prisma datasource URL pool settings | Driver adapter pool config | Prisma v7 | Pool options go to adapter, not `datasources.db` |

**No deprecated features relevant to this phase.**

---

## Open Questions

1. **Should `connection_limit` be parsed from URL or use a separate env var?**
   - What we know: pg Pool requires `max` in the adapter options, not in the URL. The PrismaPg adapter doesn't auto-parse URL params for pool options.
   - What's unclear: Whether the intent is strictly "no new env var" or "keep it simple"
   - Recommendation: Parse `?connection_limit=N` from DATABASE_URL manually to honor D-01, with fallback to `DATABASE_POOL_SIZE` if that env var is ever added later. No new env var required for Phase 06.

2. **Is there a reason to use `connectionTimeoutMillis` vs `pool_timeout`?**
   - What we know: pg Pool uses `connectionTimeoutMillis`. Prisma v6 used `pool_timeout` in URL.
   - What's unclear: Whether any existing infra expects `pool_timeout` URL param
   - Recommendation: Use pg Pool's standard `connectionTimeoutMillis: 5000` (5 seconds) — this is the standard pg Pool option

---

## Environment Availability

Step 2.6: SKIPPED — Phase 06 is purely code/config changes to existing PrismaService. No external dependencies beyond the existing PostgreSQL connection already in use.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing — `jest@30.0.0`) |
| Config file | `backend/jest.config.js` (via package.json) |
| Quick run command | `npm test -- --testPathPattern=prisma` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POOL-01 | PrismaService has `max: 20` in adapter config | unit | `npm test -- --testPathPattern=prisma/prisma.service.spec` | ? (check needed) |
| POOL-02 | Pool size parsed from `?connection_limit=N` URL param | unit | `npm test -- --testPathPattern=prisma/prisma.service.spec` | ? (check needed) |

### Wave 0 Gaps
- [ ] `backend/src/prisma/prisma.service.spec.ts` — Unit test for pool configuration parsing (covers POOL-01, POOL-02)
- Framework install: Jest already in devDependencies — no install needed

---

## Sources

### Primary (HIGH confidence)
- [Prisma v7 Connection Pool docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool) — Confirmed `max` as pg Pool size param, pg adapter API
- [pg Pool npm registry](https://node-postgres.com/apis/pool) — Confirmed pool config options separate from connection string
- [Prisma adapter-pg package](https://www.npmjs.com/package/@prisma/adapter-pg) — Version 7.5.0 confirmed from package.json

### Secondary (MEDIUM confidence)
- PITFALLS.md (local research) — Connection pool exhaustion patterns

### Tertiary (LOW confidence)
- None — core API verified from official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing packages, no new additions
- Architecture: HIGH — clear pattern for PrismaService update, pg Pool options well documented
- Pitfalls: MEDIUM — pg Pool URL param parsing not documented in official docs (confirmed via pg Pool docs that it doesn't support URL-based pool options)

**Research date:** 2026-03-27
**Valid until:** 2026-04-26 (30 days — Prisma v7 API is stable)
