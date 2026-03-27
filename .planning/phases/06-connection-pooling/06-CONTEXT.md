# Phase 06: Connection Pooling Foundation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Tune Prisma connection pool for concurrent scan workloads. This is a foundational infrastructure phase — it must complete before Redis cache (Phase 07) and other performance work.

</domain>

<decisions>
## Implementation Decisions

### Pool Configuration
- **D-01:** Connection limit configurable via `DATABASE_URL?connection_limit=N` — Claude's discretion: simple approach, no new env var needed
- **D-02:** Default connectionLimit: 20 for initial tuning (sufficient for <100 users)

### PgBouncer
- **D-03:** PgBouncer deferred to v1.2 — single instance sufficient for current scale, multi-instance PgBouncer only needed when scaling beyond single app instance

### Technical Approach
- **D-04:** PrismaPg adapter already in use — pool tuning via connection_string parameter
- **D-05:** No new packages required — existing @prisma/adapter-pg handles pooling

### Claude's Discretion
- Pool size (20) can be adjusted based on actual load testing
- Monitoring approach (metrics/logging) left to Phase 10 or later

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` § Phase 06 — Success criteria and requirements POOL-01, POOL-02
- `.planning/REQUIREMENTS.md` § POOL-01, POOL-02 — Connection pooling requirements
- `.planning/research/STACK.md` — Redis stack recommendations (for Phase 07+ dependency)
- `.planning/research/PITFALLS.md` — Connection pool exhaustion prevention

</canonical_refs>

<code_context>
## Existing Code Insights

### PrismaService (backend/src/prisma/prisma.service.ts)
```typescript
constructor(config: ConfigService) {
  const adapter = new PrismaPg({ connectionString: config.get('DATABASE_URL') });
  super({ adapter });
}
```
- Already uses PrismaPg adapter with pg pool
- Connection string can include `?connection_limit=N`
- No connectionLimit option in constructor currently

### Integration Points
- PrismaService is singleton used across all modules
- Pool tuning affects entire application
- No code changes needed in other services

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for Prisma connection pool tuning.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 06 scope stayed focused on connection pooling foundation.

</deferred>

---

*Phase: 06-connection-pooling*
*Context gathered: 2026-03-27*
