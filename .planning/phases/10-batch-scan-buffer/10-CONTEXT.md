# Phase 10: Batch Scan Buffer - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Batch scan buffer allows multiple EPCs to be submitted together and processed efficiently. Buffer lives in memory, flushes at 500 threshold OR 5-second interval.

</domain>

<decisions>
## Implementation Decisions

### Batch Processing
- **D-01:** Batch endpoint sync — Process immediately, return processed count — Claude's discretion: simpler than async, sufficient for <100 users
- **D-02:** /scan/batch endpoint accepts array of EPCs, returns InventoryService.processBulkScan() result
- **D-03:** BatchScanService handles buffering logic (5-second flush interval)
- **D-04:** InventoryService.processBulkScan() does bulk upsert per BATCH-05

### Memory Management
- **D-05:** Strict 500 MAX_BUFFER_SIZE — Claude's discretion: prevents OOM, simple enforcement
- **D-06:** MAX_BUFFER_AGE=5000ms (5 seconds) — when reached, buffer flushes regardless of size
- **D-07:** BatchScanService uses Map<string, EPCData> buffer with automatic flush detection

### Idempotency
- **D-08:** processBulkScan uses upsert pattern — duplicate EPCs handled gracefully
- **D-09:** No separate idempotency key needed — Prisma upsert handles duplicates naturally

### Technical Approach
- **D-10:** BatchScanService registered in EventsModule alongside EventsGateway
- **D-11:** EventsModule coordinates with InventoryService for bulk operations

### Files to Create
- `backend/src/scanning/batch-scan.service.ts` (new)
- `backend/src/scanning/scanning.module.ts` (new)
- Modify: `backend/src/events/events.gateway.ts` (batch endpoint)
- Modify: `backend/src/inventory/inventory.service.ts` (processBulkScan method)

### Claude's Discretion
- Sync processing (simple, sufficient for <100 users)
- Strict 500 buffer limit (prevents memory issues)
- No BullMQ (overkill for current scale)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` § Phase 10 — Success criteria and requirements BATCH-01 through BATCH-06
- `.planning/REQUIREMENTS.md` § Batch Scan Buffer
- `.planning/phases/09-cache-integration-inventory-summary/09-CONTEXT.md — Phase 09 decisions

</canonical_refs>

<codebase_context>
## Existing Code Insights

### EventsGateway Location
`backend/src/events/events.gateway.ts` — handles scan stream via WebSocket

### EventsModule Structure
Current EventsModule coordinates between EventsGateway and InventoryService

### InventoryService (Phase 09)
Already cached getStockSummary() and invalidates on processOperation()
processBulkScan method needs to be added here for batch processing

</codebase_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard batch processing implementation.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 10 scope stayed focused on batch buffer implementation.

</deferred>

---

*Phase: 10-batch-scan-buffer*
*Context gathered: 2026-03-27*
