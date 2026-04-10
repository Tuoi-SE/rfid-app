# Phase 12: backend-refactor - Research

**Researched:** 2026-04-08
**Domain:** NestJS backend architecture refactoring
**Confidence:** HIGH

## Summary

Phase 12 la phase refactor cuoi cung cua milestone v1.1, giai quyet technical debt duoc xac dinh trong backend-structure-review.md. Phan lon cong viec la mo rong pattern da duoc thiet lap o Phase 11 (EventEmitter2 decoupling). Three main areas: EventsGateway decoupling (P0), service splitting (P1), type safety fix (P1), va cleanup (P2).

**Primary recommendation:** Bat dau voi P0 (EventsGateway decoupling) vi no co impact lon nhat va co san pattern tu Phase 11. Sau do P1 (service splitting + AuthenticatedRequest), cuoi cung P2 (cleanup).

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Su dung EventEmitter2 pattern — domain services emit events, EventsGateway subscribe va forward ra socket
- **D-02:** Hybrid approach cho service splitting — dua ra guideline chung, executor quyet dinh split point
- **D-03:** P0 (EventsGateway decoupling) phai hoan thanh truoc
- **D-04:** Sau do P1 (AuthenticatedRequest type + service splitting)
- **D-05:** Cuoi cung P2 (cleanup)
- **D-06:** Add `locationId?: string` vao AuthenticatedRequest interface
- **D-07:** Xoa stale `backend/src/casl/casl-ability.factory.ts.bak`
- **D-08:** Move duplicate location type arrays vao `common/constants/location-types.ts`

### Claude's Discretion
- Split point cho service splitting (duoc phep < 300 lines theo D-02)
- Event names cho new domain events (ORDS_UPDATED, XFER_UPDATED, SESS_UPDATED)
- Exact file structure sau khi split

### Deferred Ideas (OUT OF SCOPE)
- Khong refactor transfer co ban — chi tach nhung phan validation/helper thanh separate files
- Khong them feature moi

## Standard Stack

### Core Libraries (Da xac minh tren npm registry)

| Library | Version | Purpose | Xac minh |
|---------|---------|---------|----------|
| @nestjs/event-emitter | ^3.0.1 | Domain event emission | `npm view @nestjs/event-emitter version` — 3.0.1 |
| @nestjs/websockets | ^11.1.17 | WebSocket gateway | `npm view @nestjs/websockets version` — 11.1.17 |
| socket.io | ^4.8.3 | Real-time communication | `npm view socket.io version` — 4.8.3 |
| typescript | ^5.7.3 | Type safety | `npm view typescript version` — 5.7.3 |

### Established Patterns (Tu Phase 11)

**EventEmitter2 Pattern da co san:**
```typescript
// scan.interface.ts - dinh nghia event name
export const TAGS_UPDATED_EVENT = 'tags:updated';

// InventoryService - emit event
this.eventEmitter.emit(TAGS_UPDATED_EVENT);

// EventsGateway - subscribe va forward
this.eventEmitter.on(TAGS_UPDATED_EVENT, () => {
  this.emitTagsUpdated();
});
```

**EventEmitterModule.forRoot() da duoc configure global trong app.module.ts:58**

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
├── common/
│   ├── constants/                    # Moi - chua location-types.ts
│   │   └── location-types.constant.ts
│   └── interfaces/
│       └── scan.interface.ts         # Da co - event constants
├── events/
│   ├── events.gateway.ts             # Chi con WebSocket routing
│   └── events.module.ts              # Chi con WebSocket module imports
├── orders/
│   ├── orders.service.ts             # ~200 lines - CRUD + status transition
│   ├── order-validation.service.ts   # Moi - validation logic (~70 lines)
│   ├── order-location.service.ts     # Moi - warehouse/location logic (~50 lines)
│   └── orders.module.ts
├── transfers/
│   ├── transfers.service.ts          # ~400-500 lines - CRUD chinh
│   ├── transfer-validation.service.ts # Moi - validation (~100 lines)
│   ├── transfer-location.service.ts  # Moi - location logic (~80 lines)
│   └── transfers.module.ts
└── sessions/
    ├── sessions.service.ts           # ~300-350 lines - co the giu nguyen hoac tach them
    └── sessions.module.ts
```

### Pattern 1: EventEmitter2 Domain Events

**Khi nao dung:** Khi domain service can thong bao thay doi ra ngoai (WebSocket, notification)

**Cach hoat dong:**
1. Dinh nghia event name constant trong `common/interfaces/*.interface.ts`
2. Domain service inject `EventEmitter2` va goi `.emit(EVENT_NAME, payload)`
3. EventsGateway subscribe trong `afterInit()` va forward ra socket rooms

**Vi du - OrdersService:**
```typescript
// common/interfaces/order.interface.ts (moi)
export const ORDER_UPDATED_EVENT = 'order:updated';

// orders.service.ts
constructor(
  private prisma: PrismaService,
  private eventEmitter: EventEmitter2,  // Thay vi EventsGateway
) {}

async create(...) {
  const order = await this.prisma.$transaction(...);
  this.eventEmitter.emit(ORDER_UPDATED_EVENT, new OrderEntity(order as any));
  return order;
}
```

**Anti-Pattern (hien tai - can sua):**
```typescript
// HAY XOA - vi pham Dependency Inversion
constructor(
  private events: EventsGateway,  // Phu thuoc infrastructure truc tiep
) {}
```

### Pattern 2: Service Splitting

**Khi nao dung:** Khi service vuot qua 300 lines

**Cach tach:**
- **\*validation.service.ts** — Chi chua validation logic (validateInboundDestination, validateOutboundDestination, ensureManagerCanAccessOrder)
- **\*location.service.ts** — Chi chua location/warehouse helper logic (getAuthorizedLocationIds, getManagerInboundAllowedLocationIds)
- **\*service.ts** — Chi chua CRUD operations chinh

**Transfer den interface khong thay doi** — cac method public cua service goc van con do same service hoac moved service cung cap

### Pattern 3: Shared Constants

**Khi nao dung:** Khi cung du lieu enum/array duoc dinh nghia nhieu noi

**Vi du - location-types.constant.ts:**
```typescript
// common/constants/location-types.constant.ts
import { LocationType } from '.prisma/client';

export const OUTBOUND_ALLOWED_DESTINATION_TYPES: LocationType[] = [
  LocationType.WAREHOUSE,
  LocationType.WORKSHOP,
  LocationType.HOTEL,
  LocationType.RESORT,
  LocationType.SPA,
  LocationType.CUSTOMER,
];

export const INBOUND_ALLOWED_DESTINATION_TYPES: LocationType[] = [
  LocationType.WORKSHOP,
  LocationType.WORKSHOP_WAREHOUSE,
  LocationType.WAREHOUSE,
];
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Tai Sao |
|---------|-------------|-------------|---------|
| Real-time notifications | Custom pub/sub hoac direct Socket.IO calls tu service | EventEmitter2 + EventsGateway | Da co инфраструктура tu Phase 11, chi mo rong |
| Event emission | Direct EventsGateway.emit() calls | EventEmitter2.emit() | Phan cach domain logic khoi WebSocket infrastructure |
| Location type arrays | Copy-paste nhieu noi | common/constants/ | DRY, mot noi thay doi |
| AuthenticatedRequest user type | Partial/any casting | Interface extension | Type safety cho locationId |

## Runtime State Inventory

> Phase nay la REFACTOR - kiem tra xem co thay doi ten hay cau hinh nao anh huong den runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Khong co thay doi ve data | Khong can migration |
| Live service config | Khong co service config bi anh huong | Khong can patch |
| OS-registered state | Khong co | Khong can re-register |
| Secrets/env vars | Khong co secret/env bi thay doi | Khong can update |
| Build artifacts | Stale .bak file (`casl-ability.factory.ts.bak`) | Xoa file |
| Installed packages | Khong co package moi | Khong can reinstall |

**Checked:** Khong co runtime state nao bi anh huong boi refactoring nay.

## Common Pitfalls

### Pitfall 1: Quen update EventsGateway sau khi them event moi

**What goes wrong:** Service emit event nhung EventsGateway khong subscribe, ket qua WebSocket client khong nhan duoc thong bao.

**Why it happens:** CAC LENH tao event moi nhung quen goi `this.eventEmitter.on(EVENT_NAME, ...)` trong `afterInit()`

**How to avoid:** Them subscription ngay khi dinh nghia emit, trong cung 1 commit

**Warning signs:** WebSocket client khong nhan duoc `orderUpdate`, `transferUpdate` events sau khi deploy

### Pitfall 2: Service splitting lam rot dependencies cu

**What goes wrong:** Tac service moi nhung import sai, circular dependency xuat hien.

**Why it happens:** Khi tach validation/helper methods thanh file moi, van giu import EventsGateway cu trong service chinh.

**How to avoid:**
1. Kiem tra `nest build` sau moi commit nho
2. Su dung EventEmitter2 cho moi domain event, tranh direct gateway injection
3. Danh sach imports trong module phai chinh xac

### Pitfall 3: AuthenticatedRequest cast vo nghia thay vi sua interface

**What goes wrong:** Code con cast `req.user as any` hoac `req.user as AuthenticatedRequest` nhung van thieu locationId.

**Why it happens:** Chi sua interface nhung khong kiem tra tat ca cac noi dung cast.

**How to avoid:** Tim tat ca `as any` lien quan den request.user va thay bang type-safe cast.

## Code Examples

### Vi du: Them event subscription vao EventsGateway

```typescript
// events.gateway.ts afterInit()
afterInit() {
  // Phase 11 - tags updated
  this.eventEmitter.on(TAGS_UPDATED_EVENT, () => {
    this.emitTagsUpdated();
  });

  // Phase 12 - them cac event moi
  this.eventEmitter.on(ORDER_UPDATED_EVENT, (order) => {
    this.server.emit('orderUpdate', order);
  });

  this.eventEmitter.on(TRANSFER_UPDATED_EVENT, (transfer) => {
    this.server.emit('transferUpdate', transfer);
  });

  this.eventEmitter.on(SESSION_CREATED_EVENT, (session) => {
    this.server.emit('sessionCreated', session);
  });
}
```

### Vi du: OrdersService sau khi tach validation

```typescript
// orders/orders.service.ts (~200 lines)
@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private orderValidation: OrderValidationService,
    private orderLocation: OrderLocationService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: AuthUser) {
    // Validation
    let mappedLocationId = createOrderDto.locationId;
    if (createOrderDto.type === 'INBOUND') {
      mappedLocationId = await this.orderValidation.validateInboundDestination(
        createOrderDto.locationId,
        user.role === 'WAREHOUSE_MANAGER' ? user.locationId : undefined,
      );
    } else if (createOrderDto.type === 'OUTBOUND') {
      mappedLocationId = await this.orderValidation.validateOutboundDestination(
        createOrderDto.locationId,
      );
    }

    // Authorization check
    if (user.role === 'WAREHOUSE_MANAGER') {
      await this.orderValidation.validateManagerPermissions(createOrderDto, user, mappedLocationId);
    }

    // Business logic
    const order = await this.prisma.$transaction(...);
    this.eventEmitter.emit(ORDER_UPDATED_EVENT, new OrderEntity(order as any));
    return order;
  }
}
```

### Vi du: AuthenticatedRequest interface fix

```typescript
// common/interfaces/request.interface.ts
export interface AuthenticatedRequest {
  user: {
    id: string;
    username: string;
    role: Role;
    locationId?: string;  // THEM: WAREHOUSE_MANAGER co locationId trong token
  };
}
```

## State of the Art

| Cu | Hien Tai | Thoi Gian Chuyen | Tac Dong |
|----|----------|------------------|----------|
| Direct EventsGateway injection | EventEmitter2 pattern | Phase 11 + Phase 12 | Chi cho phep EventsGateway la listener, khong phai dependency |
| Services > 500 lines | Service < 300 lines | Phase 12 | De bao tri hon |
| AuthenticatedRequest thieu locationId | locationId co trong interface | Phase 12 | Type-safe code |

**Deprecated:**
- Direct `this.events.server.emit()` calls trong domain services — thay boi EventEmitter2
- Duplicate location type arrays — thay boi common/constants/

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | EventEmitterModule.forRoot() da duoc goi voi default options trong app.module.ts | Architecture Patterns | Neu co custom config, can update |
| A2 | Scan interface da dinh nghia TAGS_UPDATED_EVENT | Standard Stack | Phai kiem tra lai neu event name thay doi |

**If this table is empty:** Tat ca claims deu da duoc xac minh hoac trich dan tu source document.

## Open Questions

1. **TransferService co can tach them khong?**
   - What we know: 693 lines, review danh gia la "MEDIUM maintainability"
   - What's unclear: Co nen tach luon hay chi tach validation/helper methods
   - Recommendation: Tach validation/helper methods, giu service chinh ~400-500 lines

2. **Event names co nen统一 khong?**
   - What we know: TAGS_UPDATED_EVENT = 'tags:updated', nhung order/transfer chua co event name
   - What's unclear: Neu统一, nen dung format gi ('order:updated' hay 'orderUpdated')
   - Recommendation: Dung format 'entity:action' (VD: 'order:updated')

## Environment Availability

Step 2.6: SKIPPED — phase nay chi la code/config changes, khong co external dependencies moi.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest ^30.0.0 + ts-jest ^29.2.5 |
| Config file | `backend/package.json` jest section |
| Quick run command | `cd backend && npm test -- --testPathPattern="orders\|transfers\|sessions" --passWithNoTests` |
| Full suite command | `cd backend && npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| N/A | EventsGateway decoupling | Manual verification | `nest start` + WebSocket test | N/A - structural refactor |
| N/A | Service splitting preserves API | Unit | `npm test -- orders.service.spec.ts` | ✅ orders.service.spec.ts |
| N/A | AuthenticatedRequest.locationId | Type check | `npm run build` | ✅ |
| N/A | Stale .bak file removed | File check | `ls backend/src/casl/*.bak` | ❌ |

### Sampling Rate
- **Per task commit:** Quick unit test cho affected service
- **Per wave merge:** Full suite (`npm test`)
- **Phase gate:** `npm run build` && `npm test` deu green

### Wave 0 Gaps
- `backend/src/orders/order-validation.service.spec.ts` — covers validation logic extraction
- `backend/src/transfers/transfer-validation.service.spec.ts` — covers transfer validation
- `backend/src/common/constants/location-types.constant.spec.ts` — covers shared constants

*(Existing test infrastructure: 3 spec files in src/ — orders.service.spec.ts, auth.service.spec.ts, casl-ability.factory.spec.ts)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Co | CASL policies — giu nguyen, khi tach service van phai preserve |
| V5 Input Validation | Co | class-validator DTOs — khong thay doi |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service decoupling bypass | Information Disclosure | EventEmitter2 khong lam lo realtime data, chi forward |
| Type confusion (locationId missing) | Elevation | AuthenticatedRequest fix dam bao locationId duoc type-checked |

## Sources

### Primary (HIGH confidence)
- Phase 12 12-CONTEXT.md — Decisions D-01 toi D-08
- Phase 11 11-CONTEXT.md — EventEmitter2 pattern da duoc establish
- `backend/src/events/events.gateway.ts` — Pattern hien tai (EventEmitter2 subscription)
- `backend/src/inventory/inventory.service.ts` — Pattern EventEmitter2 emit da duoc verify
- `backend/package.json` — Library versions da xac minh tren npm registry

### Secondary (MEDIUM confidence)
- backend-structure-review.md — Issues list (Review document)
- State.md — Project milestone context

### Tertiary (LOW confidence)
- Service line count estimates (OrdersService 533 lines da xac minh, TransfersService 693 lines can kiem chung them)

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — library versions da xac minh tren npm
- Architecture: HIGH — EventEmitter2 pattern da duoc verify trong codebase
- Pitfalls: MEDIUM — dua tren kinh nghiem chung, khong co edge case documentation

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days — refactoring patterns oi thanh稳固)
