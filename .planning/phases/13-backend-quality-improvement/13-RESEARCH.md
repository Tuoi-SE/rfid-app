# Phase 13: backend-quality-improvement - Research

**Researched:** 2026-04-08
**Domain:** NestJS backend quality improvement - exception consistency, performance optimization, indexing, test coverage
**Confidence:** HIGH

## Summary

This phase addresses backend quality issues identified in `backend-evaluation.md`. The primary goals are:
1. Replace inconsistent raw NestJS exceptions in TransfersService with BusinessException
2. Optimize the critical `buildStockSummary()` method (12+ DB queries on cache miss)
3. Add missing database indexes on User table
4. Align env validation with actual auth.service.ts usage
5. Add unit tests for TransfersService and UsersService
6. Extract magic strings to constants
7. Cache `getAuthorizedLocationIds` in request context

**Priority order:** BusinessException consistency (D-01) first, then Performance fixes (D-02 through D-05), then Indexes (D-06), Env Vars (D-07), Testing (D-08), Technical Debt (D-09, D-10). Deferred: D-11 (processBulkScan) and D-12 (TransferItem parallelization) after buildStockSummary.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Replace ALL raw NestJS exceptions in TransfersService with BusinessException for consistent error format
- **D-02:** Refactor buildStockSummary() BEFORE processBulkScan - 12+ queries is the biggest bottleneck
- **D-03:** Replace `findMany` with `groupBy` for locationTypeCounts (aggregate at DB instead of JS memory)
- **D-04:** Increase cache TTL to 60-120 seconds for stock summary
- **D-05:** Use `(client as any).user` attached in handleConnection instead of re-verifying JWT in handleBatchScan/handleScanStream
- **D-06:** Add indexes on User table for 4 fields: failedLoginAttempts, lockedUntil, role, locationId
- **D-07:** Align env.validation.ts with auth.service.ts - update validation to match variables actually read (JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION_DAYS)
- **D-08:** Write unit tests for TransfersService and UsersService, prioritizing core business logic methods
- **D-09:** Extract all magic strings to constants: device types ('WEB', 'MOBILE'), TRF- prefix, 'RECALLED' event type, 'GOOD' condition, role strings
- **D-10:** Cache getAuthorizedLocationIds in request context - avoid duplicate queries when WAREHOUSE_MANAGER calls multiple methods in same request

### Deferred Ideas

- **D-11:** Use `$executeRaw` batch update for processBulkScan (execute AFTER buildStockSummary refactor)
- **D-12:** Parallelize 2 TransferItem queries with Promise.all (execute with processBulkScan fix)
- Pagination max limit enforcement - LOW priority, not in this phase scope

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | ^11.0.1 | Backend framework | Primary framework |
| Prisma | ^7.5.0 | ORM with PostgreSQL | Current ORM |
| @nestjs/cache-manager | ^3.1.0 | Caching layer | Already integrated |
| ioredis | ^6.x | Redis store for cache | Current Redis client |
| Jest | ^30.0.0 | Unit testing | Default NestJS test framework |
| ts-jest | ^29.2.5 | Jest transformer for TS | Current test transformer |
| BusinessException | custom | Standardized error responses | Already exists in codebase |

### Testing Patterns
| Pattern | Implementation |
|---------|----------------|
| Test framework | Jest with TestingModule |
| Mocking | jest.fn() with mock objects |
| Service testing | Test.createTestingModule with providers |
| Coverage threshold | Not currently enforced |

## Architecture Patterns

### BusinessException Pattern (already established)
**What:** Custom exception class extending HttpException that formats errors as `{ success: false, message, error: { code } }`
**Location:** `backend/src/common/exceptions/business.exception.ts`
**Usage:** auth.service.ts and users.service.ts already use it consistently

```typescript
// Source: backend/src/common/exceptions/business.exception.ts:17-27
export class BusinessException extends HttpException {
  constructor(message: string, code: string, status: HttpStatus | number = HttpStatus.BAD_REQUEST) {
    super(
      {
        success: false,
        message,
        error: { code },
      },
      status,
    );
  }
}
```

### transfers.service.ts Raw Exceptions to Replace
**Locations:** Lines 40, 46, 51, 54, 58, 61, 66, 76, 79, 160, 169, 176, 271, 277, 282, 284, 289, 292, 297, 305, 310, 323, 332, 346, 355, 361, 391, 407, 554, 563, 576-579, 586, 593, 648, 650, 658, 664, 668, 674

Pattern to replace:
- `throw new NotFoundException('...')` → `throw new BusinessException('...', 'CODE', HttpStatus.NOT_FOUND)`
- `throw new BadRequestException('...')` → `throw new BusinessException('...', 'CODE', HttpStatus.BAD_REQUEST)`
- `throw new ForbiddenException('...')` → `throw new BusinessException('...', 'CODE', HttpStatus.FORBIDDEN)`

### buildStockSummary Optimization Pattern
**Current:** Uses `findMany` to load full Tag objects, then counts in JS memory
**Target:** Replace with `groupBy` for DB-level aggregation

```typescript
// Source: backend/src/inventory/inventory.service.ts:134-145 (current inefficient)
const stockTagsByLocation = await this.prisma.tag.findMany({
  where: {
    deletedAt: null,
    status: { in: [TagStatus.IN_WAREHOUSE, TagStatus.IN_WORKSHOP] },
    locationId: { not: null },
  },
  select: {
    locationRel: {
      select: { type: true },
    },
  },
});

// Should become:
const locationTypeCounts = await this.prisma.tag.groupBy({
  by: ['locationId'],
  where: {
    deletedAt: null,
    status: { in: [TagStatus.IN_WAREHOUSE, TagStatus.IN_WORKSHOP] },
    locationId: { not: null },
  },
  _count: { _all: true },
});
// Then join with location to get type
```

### JWT Re-verify Elimination Pattern
**Current:** handleConnection verifies JWT and attaches to client, but handleScanStream/handleBatchScan re-verify
**Target:** Use `(client as any).user` from handleConnection

```typescript
// Source: backend/src/events/events.gateway.ts:76-77 (handleConnection)
const payload = this.jwtService.verify(token);
(client as any).user = payload;

// handleScanStream (lines 100-112) and handleBatchScan (lines 193-206) re-verify unnecessarily
// Should use:
const user = (client as any).user;
if (!user) throw new WsException('Unauthorized');
```

### Request-Scoped Caching Pattern
**Current:** `getAuthorizedLocationIds` queries DB every time
**Target:** Cache in request context using a Request-scoped provider or Request-level Map

```typescript
// Pattern: Use @InjectScope(Scope.REQUEST) or request-level Map
// TransferLocationService is already @Injectable() - can be made REQUEST scoped
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error formatting | Raw NestJS exceptions | BusinessException | Consistent `{ success, message, error: { code } }` format across all services |
| DB aggregation | findMany + JS reduce | Prisma groupBy | Reduces data transfer, leverages DB index efficiency |
| JWT verification | Re-verify on every message | Use pre-attached user | Already verified in handleConnection, avoids CPU overhead |
| Caching | Manual Map | @nestjs/cache-manager | Already integrated, supports Redis with TTL |
| Password hashing | Custom | bcrypt with SALT_ROUNDS=12 | Already implemented, secure default |
| Request-level caching | Global state | REQUEST-scoped provider | NestJS built-in, per-request isolation |

## Common Pitfalls

### Pitfall 1: BusinessException Status Code Mismatch
**What goes wrong:** Using wrong HTTP status code with BusinessException (e.g., NOT_FOUND for validation errors)
**How to avoid:** Map NestJS exception types correctly:
- NotFoundException → HttpStatus.NOT_FOUND
- BadRequestException → HttpStatus.BAD_REQUEST
- ForbiddenException → HttpStatus.FORBIDDEN
- ConflictException → HttpStatus.CONFLICT

### Pitfall 2: Prisma groupBy Not Supporting Nested Relations
**What goes wrong:** `groupBy` in Prisma does not support `include` for nested relations
**How to avoid:** After groupBy for counts, separately fetch the referenced entities if needed (locations, products)
**Warning signs:** Attempting to add `include` to a `groupBy` call

### Pitfall 3: Cache TTL Too Short for Expensive Queries
**What goes wrong:** 30-second TTL on buildStockSummary causes frequent cache misses with 12+ query expensive operation
**How to avoid:** Increase to 60-120 seconds as per D-04
**Warning signs:** High DB load in metrics, cache hit rate < 80%

### Pitfall 4: Replacing Only Obvious Exception Instances
**What goes wrong:** Missing some raw exceptions when replacing in TransfersService (40+ instances)
**How to avoid:** Systematic grep for all NotFoundException, BadRequestException, ForbiddenException in transfers.service.ts before and after
**Warning signs:** Some error responses still don't follow BusinessException format

## Code Examples

### BusinessException Replacement Pattern

```typescript
// BEFORE (transfers.service.ts:40)
if (!source) throw new NotFoundException('Không tìm thấy vị trí nguồn');

// AFTER
import { BusinessException } from '@common/exceptions/business.exception';
if (!source) throw new BusinessException('Không tìm thấy vị trí nguồn', 'TRANSFER_SOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
```

### Prisma groupBy Replacement

```typescript
// BEFORE (inventory.service.ts:134-152)
const stockTagsByLocation = await this.prisma.tag.findMany({
  where: {
    deletedAt: null,
    status: { in: [TagStatus.IN_WAREHOUSE, TagStatus.IN_WORKSHOP] },
    locationId: { not: null },
  },
  select: { locationRel: { select: { type: true } } },
});
const locationTypeCounts = stockTagsByLocation.reduce<Record<string, number>>((acc, row) => {
  const locationType = row.locationRel?.type;
  if (!locationType) return acc;
  acc[locationType] = (acc[locationType] || 0) + 1;
  return acc;
}, {});

// AFTER - use groupBy at DB level
const locationGrouped = await this.prisma.tag.groupBy({
  by: ['locationId'],
  where: {
    deletedAt: null,
    status: { in: [TagStatus.IN_WAREHOUSE, TagStatus.IN_WORKSHOP] },
    locationId: { not: null },
  },
  _count: { _all: true },
});
// Then fetch location types separately and map
```

### JWT Re-verify Elimination

```typescript
// BEFORE (events.gateway.ts:100-112)
@SubscribeMessage('scanStream')
async handleScanStream(...) {
  const token = client.handshake.auth?.token || ...;
  if (!token) throw new WsException('Unauthorized');
  try {
    this.jwtService.verify(token); // RE-VERIFY - wasteful
  } catch {
    throw new WsException('Unauthorized');
  }
  // ... use token payload
}

// AFTER
@SubscribeMessage('scanStream')
async handleScanStream(@ConnectedSocket() client: Socket, ...) {
  const user = (client as any).user;
  if (!user) throw new WsException('Unauthorized');
  // ... use user from handleConnection
}
```

### Request-Scoped Location Cache (Conceptual)

```typescript
// Option 1: REQUEST-scoped TransferLocationService
@Injectable({ scope: Scope.REQUEST })
export class TransferLocationService {
  private cachedLocationIds?: string[];
  // ...
}

// Option 2: Request-level Map in controller
// Add to AuthenticatedRequest or use AsyncLocalStorage
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|--------------|--------|
| Raw NestJS exceptions | BusinessException | auth.service.ts, users.service.ts already migrated | Consistent error format across services |
| 30s cache TTL | 60-120s TTL | D-04 in this phase | Reduced DB load from buildStockSummary |
| findMany for counts | groupBy aggregation | D-03 in this phase | Fewer queries, less data transferred |
| JWT re-verify on every WS message | Use pre-attached user | D-05 in this phase | Reduced CPU overhead |
| No indexes on User | Indexes on login fields | D-06 in this phase | Faster auth queries |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma groupBy supports the aggregation needed for locationTypeCounts | D-03 | LOW - groupBy is standard Prisma feature, verified in code |
| A2 | (client as any).user is attached before handleScanStream/handleBatchScan are called | D-05 | LOW - verified in events.gateway.ts handleConnection line 77 |
| A3 | TransferLocationService.getAuthorizedLocationIds is the bottleneck | D-10 | MEDIUM - called 3 times per request in worst case, confirmed by backend-evaluation.md |
| A4 | No other services depend on the raw NestJS exception types in transfers.service.ts | D-01 | LOW - exception type change doesn't affect API contract (message preserved) |

## Open Questions

1. **Should TransferLocationService be REQUEST-scoped or use a decorator-based cache?**
   - What we know: REQUEST scope adds DI overhead; decorator-based cache via AsyncLocalStorage is lighter
   - Recommendation: Use REQUEST-scoped provider for simplicity given NestJS DI already supports it

2. **Should we extract error codes to an enum or constants file?**
   - What we know: Currently error codes are string literals ad-hoc
   - Recommendation: Create `backend/src/common/constants/error-codes.ts` with `TRANSFER_SOURCE_NOT_FOUND`, `TRANSFER_DEST_NOT_FOUND`, etc.

3. **processBulkScan deferred until after buildStockSummary - is the priority correct?**
   - What we know: buildStockSummary is 12+ queries on every cache miss (30s TTL); processBulkScan affects every scan operation
   - Recommendation: Yes, buildStockSummary is higher priority because it affects dashboard load for all users

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Jest | Unit testing | ✓ | ^30.0.0 | — |
| ts-jest | TypeScript test transformation | ✓ | ^29.2.5 | — |
| @nestjs/testing | TestingModule | ✓ (via NestJS) | ^11.0.1 | — |
| Prisma CLI | Database migrations for indexes | ✓ | ^7.5.0 | — |
| bcrypt | Password hashing | ✓ | ^4.0.1 | — |
| @nestjs/cache-manager | Caching | ✓ | ^3.1.0 | — |

**All dependencies available - no fallback needed.**

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^30.0.0 |
| Config file | jest section in package.json (rootDir: src, testRegex: .*.spec.ts$) |
| Quick run command | `npm test -- --testPathPattern="transfers.service.spec.ts\|users.service.spec.ts"` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | BusinessException replaces NotFoundException/BadRequestException/ForbiddenException in TransfersService | Unit | `npm test -- --testPathPattern="transfers.service.spec.ts" -t "create\|confirm\|findOne"` | No - needs creation |
| D-02 | buildStockSummary uses groupBy instead of findMany | Manual | N/A (query analysis) | N/A |
| D-03 | locationTypeCounts computed via groupBy | Manual | N/A (query analysis) | N/A |
| D-04 | Cache TTL increased to 60-120s | Unit | `npm test -- --testPathPattern="inventory.service.spec.ts"` | No - needs creation |
| D-05 | JWT not re-verified in handleScanStream/handleBatchScan | Unit | `npm test -- --testPathPattern="events.gateway.spec.ts"` | No - needs creation |
| D-06 | User table has indexes on failedLoginAttempts, lockedUntil, role, locationId | Manual | `npx prisma migrate status` | No - migration needed |
| D-07 | env.validation.ts matches auth.service.ts | Manual | Review env.validation.ts | N/A |
| D-08 | Unit tests for TransfersService and UsersService | Unit | `npm test -- --testPathPattern="transfers.service.spec.ts\|users.service.spec.ts"` | No - needs creation |
| D-09 | Magic strings extracted to constants | Manual | Grep for 'WEB', 'MOBILE', 'TRF-', 'RECALLED', 'GOOD' | N/A |
| D-10 | getAuthorizedLocationIds cached in request | Manual | Code review | N/A |

### Wave 0 Gaps
- [ ] `backend/src/transfers/transfers.service.spec.ts` — covers D-01 (create, confirm, findOne, cancel, updateDestination)
- [ ] `backend/src/users/users.service.spec.ts` — covers existing UsersService methods
- [ ] `backend/src/inventory/inventory.service.spec.ts` — covers getStockSummary caching behavior
- [ ] `backend/src/events/events.gateway.spec.ts` — covers handleScanStream, handleBatchScan user attachment
- [ ] `backend/src/common/constants/error-codes.ts` — centralized error codes for D-09
- [ ] Framework install: Already present (jest ^30.0.0, ts-jest ^29.2.5)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT with BusinessException for auth errors |
| V3 Session Management | yes | Refresh token rotation, soft-delete user check |
| V4 Access Control | yes | WAREHOUSE_MANAGER LBAC via getAuthorizedLocationIds |
| V5 Input Validation | yes | class-validator decorators, DTO validation |
| V6 Cryptography | yes | bcrypt 12 rounds, SHA-256 for refresh tokens |

### Known Threat Patterns for NestJS/Prisma

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Prisma parameterized queries (not raw SQL) |
| Broken auth | Spoofing | JWT verification, account lockout after 5 failed attempts |
| Mass assignment | Tampering | DTOs with class-validator, explicit select in Prisma |
| Sensitive data exposure | Information Disclosure | snake_case/camelCase mapping, exclude password from responses |
| Privilege escalation | Elevation | Role-based access via CASL, location-based access via getAuthorizedLocationIds |

## Sources

### Primary (HIGH confidence)
- `backend/src/common/exceptions/business.exception.ts` — BusinessException implementation
- `backend/src/transfers/transfers.service.ts` — Raw exceptions to replace (lines 40, 46, 51, 54, etc.)
- `backend/src/inventory/inventory.service.ts` — buildStockSummary optimization target (lines 122-403)
- `backend/src/events/events.gateway.ts` — JWT re-verify target (lines 82-91, 169-206)
- `backend/prisma/schema.prisma` — User model, indexes to add (lines 131-188)
- `backend/src/auth/auth.service.ts` — Env var reading (lines 43-46)
- `backend/src/env/env.validation.ts` — Env var mismatch source
- `backend/src/auth/auth.service.spec.ts` — Existing test pattern to follow

### Secondary (MEDIUM confidence)
- `reports/backend-evaluation.md` — All findings and recommendations (source document)
- `backend/package.json` — Jest configuration and dependencies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json
- Architecture: HIGH - BusinessException pattern verified in codebase, groupBy verified as Prisma feature
- Pitfalls: HIGH - All pitfalls identified from codebase analysis

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days - backend quality patterns are stable)
