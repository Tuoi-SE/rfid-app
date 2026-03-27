# Phase 09: Cache Integration - Inventory Summary - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Inventory summary queries cached with 30 second TTL and stampede prevention. Depends on Phase 08 (Tag cache patterns must be stable).

</domain>

<decisions>
## Implementation Decisions

### Cache Configuration
- **D-01:** TTL fixed at 30 seconds for inventory summary — research recommendation
- **D-02:** TTL jitter of 5-10% to prevent stampede — Claude's discretion: simple and effective
- **D-03:** Cache key pattern: `inventory:summary` (single key for overall summary) — Claude's discretion: simpler than per-location, most dashboard use cases need overall view

### Cache Operations
- **D-04:** Cache-aside pattern: read from cache first, populate on miss
- **D-05:** Cache invalidation on any tag status/location change in processOperation()
- **D-06:** Stampede prevention via TTL jitter (5-10% random addition)

### Technical Approach
- **D-07:** Use @nestjs/cache-manager CacheService via dependency injection (from Phase 08)
- **D-08:** Invalidation happens inside DB transaction callback (same as Phase 08 update pattern)

### Files to Modify
- `backend/src/inventory/inventory.service.ts` — Add cache to getStockSummary() method

### Claude's Discretion
- Single `inventory:summary` key for overall inventory (not per-location granular)
- Jitter implementation: `ttl + Math.floor(ttl * (Math.random() * 0.1))` adds 0-10% random jitter

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` § Phase 09 — Success criteria and requirements CACHE-04, CACHE-05, CACHE-06
- `.planning/REQUIREMENTS.md` § Cache Integration - Inventory Summary
- `.planning/phases/08-cache-integration-tags/08-CONTEXT.md — Phase 08 decisions
- `.planning/phases/07-redis-infrastructure/07-CONTEXT.md — Phase 07 infrastructure

</canonical_refs>

<codebase_context>
## Existing Code Insights

### InventoryService Location
`backend/src/inventory/inventory.service.ts`

### Current getStockSummary() Method
Likely performs aggregation query across all tags grouped by location or status. This is the expensive operation that benefits from caching.

### CacheService (Phase 08)
Already injected in services via global CacheModule.

</codebase_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard cache-aside implementation.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 09 scope stayed focused on cache integration.

</deferred>

---

*Phase: 09-cache-integration-inventory-summary*
*Context gathered: 2026-03-27*
