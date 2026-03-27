---
phase: 08-cache-integration-tags
plan: '01'
subsystem: backend
tags:
  - cache
  - redis
  - tags
  - performance
dependency_graph:
  requires:
    - Phase 07 (Redis Infrastructure)
  provides:
    - CACHE-01: TagsService.findByEpc() cache-aside with 5-min TTL
    - CACHE-02: TagsService.update() cache invalidation
    - CACHE-03: Cache key pattern tag:epc:{epc}
  affects:
    - backend/src/tags/tags.service.ts
tech_stack:
  added:
    - '@nestjs/cache-manager CacheService injection'
  patterns:
    - Cache-aside pattern (read-through cache)
    - Cache key: tag:epc:{epc}
    - TTL: 300000ms (5 minutes)
key_files:
  created: []
  modified:
    - backend/src/tags/tags.service.ts
decisions:
  - D-01: TTL fixed at 5 minutes (300000ms) for tag lookups
  - D-02: Cache key pattern tag:epc:{epc}
  - D-03: Cache-aside pattern: read from cache first, populate on miss
  - D-04: Cache invalidation on write: TagsService.update() calls cache.del() immediately
  - D-05: Use @nestjs/cache-manager CacheService via dependency injection
  - D-06: Cache stored in ioredis (from Phase 07 infrastructure)
metrics:
  duration: ~
  completed: 2026-03-27
---

# Phase 08 Plan 01: Cache Integration - Tags Summary

**One-liner:** Cache-aside pattern for TagsService with 5-minute TTL using Redis

## Objective

Implement cache-aside pattern for tag lookups with 5-minute TTL. Repeated EPC scans hit cache instead of database, reducing DB load under concurrent scan workloads.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add CacheService injection to TagsService | 4c45a39 | backend/src/tags/tags.service.ts |
| 2 | Implement cache-aside pattern in findByEpc() | 4c45a39 | backend/src/tags/tags.service.ts |
| 3 | Add cache invalidation to update() | 4c45a39 | backend/src/tags/tags.service.ts |

## What Was Built

### TagsService with Cache-aside Pattern

**backend/src/tags/tags.service.ts** — 3 changes:

1. **CacheService injection** (lines 2, 18): Added `CacheService` from `@nestjs/cache-manager` imported and injected via constructor alongside `PrismaService`.

2. **findByEpc() with cache-aside** (lines 67-98): Method now checks Redis cache first using key `tag:epc:{epc}`. On cache hit, returns deserialized `TagEntity` immediately. On cache miss, queries database, populates cache with 300000ms (5-minute) TTL, then returns result.

3. **update() with cache invalidation** (line 198): After successful database transaction commit, calls `cacheManager.del('tag:epc:${epc}')` to invalidate stale cache entry.

### Key Implementation Details

- **Cache key pattern:** `tag:epc:{epc}` — consistent across findByEpc and update
- **TTL:** 300000ms (5 minutes) fixed per D-01
- **Cache-aside flow:** read → miss → DB query → populate cache → return
- **Invalidation timing:** After transaction commits, before returning response
- **No module import needed:** CacheModule is globally registered (isGlobal: true)

## Success Criteria Verification

- [x] TagsService has CacheService injected (grep: `CacheService` on lines 2, 18)
- [x] findByEpc() checks cache first, populates on miss with 300000ms TTL (grep: `cacheManager.get`, `cacheManager.set.*300000`)
- [x] update() calls cache.del() after successful update (grep: `cacheManager.del`)
- [x] Cache key pattern `tag:epc:{epc}` used consistently (grep: `tag:epc:` on lines 68, 198)
- [x] All 3 requirements (CACHE-01, CACHE-02, CACHE-03) satisfied

## Requirements Satisfied

| Requirement | Description | Status |
|-------------|-------------|--------|
| CACHE-01 | TagsService.findByEpc() uses cache-aside pattern with 5-min TTL | Satisfied |
| CACHE-02 | TagsService.update() invalidates cache immediately on write | Satisfied |
| CACHE-03 | Cache key pattern `tag:epc:{epc}` for tag lookups | Satisfied |

## Deviations from Plan

None — plan executed exactly as written.

## Notes

- CacheModule is globally registered (isGlobal: true in AppModule), so no module import needed in TagsModule
- Cache invalidation happens inside the Prisma transaction callback but after the DB update — the `cache.del()` is not a DB operation and does not affect transaction atomicity
- Type parameter `TagEntity` used in `cacheManager.get<TagEntity>()` for type safety

## Self-Check

- [x] backend/src/tags/tags.service.ts exists
- [x] Commit 4c45a39 found in git log
- [x] CacheService imported from @nestjs/cache-manager
- [x] cacheManager.get called before DB query in findByEpc
- [x] cacheManager.set called with 300000ms TTL after DB query
- [x] cacheManager.del called in update() method
- [x] tag:epc: key pattern consistent in both methods

## Self-Check: PASSED
