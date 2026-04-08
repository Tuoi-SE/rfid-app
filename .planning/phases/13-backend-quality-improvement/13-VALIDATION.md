---
phase: 13
slug: backend-quality-improvement
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.0.0 |
| **Config file** | jest section in package.json (rootDir: src, testRegex: .*.spec.ts$) |
| **Quick run command** | `npm test -- --testPathPattern="transfers.service.spec.ts\|users.service.spec.ts"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | D-01 BusinessException | T-13-01 | BusinessException replaces raw NestJS exceptions | Unit | `npm test -- --testPathPattern="transfers.service.spec.ts"` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | D-02 buildStockSummary | — | N/A | Manual | N/A (query analysis) | N/A | ⬜ pending |
| 13-03-01 | 03 | 2 | D-04 cache TTL | — | N/A | Unit | `npm test -- --testPathPattern="inventory.service.spec.ts"` | ❌ W0 | ⬜ pending |
| 13-04-01 | 04 | 2 | D-05 JWT re-verify | T-13-02 | No JWT re-verify in socket handlers | Unit | `npm test -- --testPathPattern="events.gateway.spec.ts"` | ❌ W0 | ⬜ pending |
| 13-05-01 | 05 | 2 | D-06 indexes | — | N/A | Manual | `npx prisma migrate status` | ❌ W0 | ⬜ pending |
| 13-06-01 | 06 | 3 | D-07 env vars | T-13-03 | No hardcoded credentials | Manual | Review env.validation.ts | N/A | ⬜ pending |
| 13-07-01 | 07 | 3 | D-09 magic strings | — | N/A | Manual | Grep for 'WEB', 'MOBILE', 'TRF-', 'RECALLED', 'GOOD' | N/A | ⬜ pending |
| 13-08-01 | 08 | 3 | D-10 location cache | — | N/A | Manual | Code review | N/A | ⬜ pending |
| 13-09-01 | 09 | 3 | D-08 test coverage | — | N/A | Unit | `npm test -- --testPathPattern="users.service.spec.ts"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/transfers/transfers.service.spec.ts` — covers D-01 (create, confirm, findOne, cancel, updateDestination)
- [ ] `backend/src/users/users.service.spec.ts` — covers existing UsersService methods
- [ ] `backend/src/inventory/inventory.service.spec.ts` — covers getStockSummary caching behavior
- [ ] `backend/src/events/events.gateway.spec.ts` — covers handleScanStream, handleBatchScan user attachment
- [ ] `backend/src/common/constants/error-codes.ts` — centralized error codes for D-09
- [ ] Framework install: Already present (jest ^30.0.0, ts-jest ^29.2.5)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| buildStockSummary uses groupBy | D-02 | Query optimization, requires DB analysis | Review SQL queries in inventory.service.ts |
| locationTypeCounts via groupBy | D-03 | Aggregate computation | Review tag.groupBy calls |
| Cache TTL increased to 60-120s | D-04 | TTL value verification | Review inventory.service.ts cache options |
| User table indexes | D-06 | Schema migration verification | Run `npx prisma migrate status` |
| Env var alignment | D-07 | Config file review | Compare env.validation.ts vs auth.service.ts |
| Magic strings extraction | D-09 | Code pattern verification | `grep -r "'WEB'\|'MOBILE'\|'TRF-'\|'RECALLED'\|'GOOD'" backend/src` |
| Location ID caching | D-10 | Request-scoped behavior | Manual inspection of code |

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT with BusinessException for auth errors |
| V3 Session Management | yes | Refresh token rotation, soft-delete user check |
| V4 Access Control | yes | WAREHOUSE_MANAGER LBAC via getAuthorizedLocationIds |
| V5 Input Validation | yes | class-validator decorators, DTO validation |
| V6 Cryptography | yes | bcrypt 12 rounds, SHA-256 for refresh tokens |

### Known Threat Patterns for Phase 13

| Threat ID | Pattern | STRIDE | Mitigation |
|-----------|---------|--------|------------|
| T-13-01 | Raw NestJS exceptions leak internal details | Information Disclosure | BusinessException with controlled error codes |
| T-13-02 | JWT re-verification on every message wastes CPU | Denial of Service | Use cached user from handleConnection |
| T-13-03 | Env var mismatch causes runtime failures | Elevation | Align env.validation.ts with actual usage |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
