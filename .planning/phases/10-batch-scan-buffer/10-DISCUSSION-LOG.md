# Phase 10: Batch Scan Buffer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 10-batch-scan-buffer
**Areas discussed:** Batch endpoint design, Memory limit approach

---

## Batch Endpoint Design

| Option | Description | Selected |
|--------|-------------|----------|
| Sync | Process immediately, return count | ✓ |
| Async | Queue and return queued count | |
| Hybrid | Queue, track progress | |
| You decide | Let Claude decide | |

**User's choice:** You decide
**Notes:** User delegated to Claude — sync selected per research recommendation (simpler for <100 users)

---

## Memory Limit Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Strict 500 | Reject batch >500 EPCs | ✓ |
| Soft limit | Graceful degradation over 500 | |
| You decide | Let Claude decide | |

**User's choice:** You decide
**Notes:** User delegated to Claude — strict 500 prevents OOM per research recommendations

---

## Claude's Discretion

- Batch endpoint: Sync — process immediately, return count
- Memory limit: Strict 500 EPCs MAX_BUFFER_SIZE
- Buffer age: 5 seconds MAX_BUFFER_AGE
- No BullMQ — in-memory sufficient for <100 users

## Deferred Ideas

None — discussion stayed within phase scope.
