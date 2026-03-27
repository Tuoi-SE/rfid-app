# Phase 07: Redis Infrastructure - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Redis cache layer is available and configured for application use. Depends on Phase 06 (PrismaService must be stable before adding cache). This is foundational for Phases 08-10 (Cache Integration and Batch Buffer).

</domain>

<decisions>
## Implementation Decisions

### Redis Deployment
- **D-01:** Redis deployed via Docker (docker-compose) — Claude's discretion: standard for NestJS dev, simpler than managed service for <100 users
- **D-02:** Redis connection via REDIS_HOST and REDIS_PORT environment variables
- **D-03:** Docker Compose file updated with Redis service (redis:7-alpine)

### Cache Module Architecture
- **D-04:** Global CacheModule registered in AppModule — NestJS standard pattern for @nestjs/cache-manager
- **D-05:** CacheModule uses ioredis store via @tirke/node-cache-manager-ioredis
- **D-06:** Cache TTL defaults: 5 minutes for tags, 30 seconds for inventory summary

### Technical Approach
- **D-07:** @nestjs/cache-manager 3.1.0 + @tirke/node-cache-manager-ioredis 3.6.0 + ioredis 5.10.1
- **D-08:** No new packages beyond stack recommendations

### Health Check
- **D-09:** /health endpoint returns Redis status (healthy/degraded) alongside existing checks

### Claude's Discretion
- Redis configuration details (port, memory limits) can be adjusted based on infrastructure needs
- Cache key naming convention follows pattern: `tag:epc:{epc}`, `inventory:summary:{locationId}`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` § Phase 07 — Success criteria and requirements REDIS-01, REDIS-02, REDIS-03
- `.planning/REQUIREMENTS.md` § REDIS-01, REDIS-02, REDIS-03
- `.planning/research/STACK.md` — Redis stack (cache-manager, ioredis versions)
- `.planning/research/PITFALLS.md` — Cache invalidation pitfalls
- `.planning/phases/06-connection-pooling/06-RESEARCH.md` — Phase 06 research for context

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Backend Structure (backend/src/)
- AppModule registers global modules (ConfigModule, ThrottlerModule, PrismaModule, etc.)
- HealthController at `backend/src/health/health.controller.ts` — extend here for Redis status
- Existing docker-compose.yml at `backend/docker-compose.yml` — add Redis service here

### Package Context
- No Redis packages currently installed
- Will need: @nestjs/cache-manager, @tirke/node-cache-manager-ioredis, ioredis

</codebase_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for Redis setup.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 07 scope stayed focused on Redis infrastructure.

</deferred>

---

*Phase: 07-redis-infrastructure*
*Context gathered: 2026-03-27*
