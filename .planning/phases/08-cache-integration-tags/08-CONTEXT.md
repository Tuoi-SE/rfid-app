# Phase 08: Cache Integration - Tags - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Tag lookups use cache-aside pattern with 5-minute TTL. TagsService.findByEpc() and TagsService.update() integrate with the CacheModule from Phase 07.

</domain>

<decisions>
## Implementation Decisions

### Cache Configuration
- **D-01:** TTL fixed at 5 minutes (300 seconds) for tag lookups — Claude's discretion: simple, research recommends 5 min for EPCs
- **D-02:** Cache key pattern: `tag:epc:{epc}` per research spec

### Cache Operations
- **D-03:** Cache-aside pattern: read from cache first, populate on miss
- **D-04:** Cache invalidation on write: TagsService.update() calls cache.del() immediately

### Technical Approach
- **D-05:** Use @nestjs/cache-manager CacheService via dependency injection
- **D-06:** Cache stored in ioredis (from Phase 07 infrastructure)

### Files to Modify
- `backend/src/tags/tags.service.ts` — Add cache.get/cach del to findByEpc and update methods

### Claude's Discretion
- Exact implementation approach (cache-aside vs write-through) — cache-aside chosen per research
- Error handling when Redis is unavailable — fall back to direct DB query

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` § Phase 08 — Success criteria and requirements CACHE-01, CACHE-02, CACHE-03
- `.planning/REQUIREMENTS.md` § Cache Integration - Tags — CACHE-01, CACHE-02, CACHE-03
- `.planning/research/STACK.md` — Redis stack recommendations
- `.planning/phases/07-redis-infrastructure/07-CONTEXT.md` — Redis infrastructure decisions
- `.planning/phases/06-connection-pooling/06-RESEARCH.md` — Phase 06 research

</canonical_refs>

<codebase_context>
## Existing Code Insights

### TagsService Location
`backend/src/tags/tags.service.ts`

### CacheModule (Phase 07)
Already registered globally in AppModule. Inject Cache via `@Inject(CacheService)` or `Cache` from `@nestjs/cache-manager`.

### TagsService Methods
- `findByEpc(epc: string)` — queries Tag by EPC
- `update(id, dto)` — updates tag

</codebase_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard cache-aside implementation.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 08 scope stayed focused on cache integration.

</deferred>

---

*Phase: 08-cache-integration-tags*
*Context gathered: 2026-03-27*
