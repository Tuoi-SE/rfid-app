# Phase 08: Cache Integration - Tags - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 08-cache-integration-tags
**Areas discussed:** Cache TTL approach, Cache key pattern

---

## Cache TTL Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 5 minutes | Simple, research recommends 5 min for tag EPCs | ✓ |
| Configurable env | CACHE_TTL_TAG=300 env var — flexible | |
| You decide | Let Claude decide | |

**User's choice:** You decide
**Notes:** User delegated to Claude — fixed 5 min selected per research recommendation

---

## Cache Key Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| tag:epc:{epc} | Per research spec | ✓ |
| Adjust | Change pattern | |

**User's choice:** Yes (Recommended)
**Notes:** Pattern approved per research spec

---

## Claude's Discretion

- Cache TTL: Fixed 5 minutes (300 seconds) — research recommends
- Cache key pattern: `tag:epc:{epc}`
- Cache-aside pattern: read cache first, populate on miss
- Cache invalidation: on write, call cache.del() immediately
- Error handling: fall back to direct DB when Redis unavailable

## Deferred Ideas

None — discussion stayed within phase scope.
