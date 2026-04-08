# Backend Structure Review

## Module Organization

| Module | Responsibility | Assessment |
|--------|---------------|------------|
| `auth/` | JWT auth, login/logout, refresh tokens | ✅ SRP OK — chỉ xử lý authentication |
| `users/` | User CRUD + soft-delete + restore + password hashing | ✅ SRP OK |
| `orders/` | Order management (INBOUND/OUTBOUND), mobile quick-submit | ⚠️ Có 2 concerns: (1) business logic order và (2) tag status determination trong `mobileQuickSubmit` |
| `transfers/` | Transfer workflow (create/confirm/cancel/updateDestination) | ✅ SRP OK cho transfer domain |
| `sessions/` | Scanning session management | ✅ SRP OK |
| `tags/` | RFID tag CRUD + history | ✅ SRP OK |
| `products/` | Product CRUD | ✅ SRP OK |
| `locations/` | Location CRUD | ✅ SRP OK |
| `categories/` | Category CRUD | ✅ SRP OK |
| `dashboard/` | Dashboard aggregates | ✅ SRP OK |
| `inventory/` | Stock summary, check-in/out, bulk scan | ✅ SRP OK |
| `activity-log/` | Audit logging + interceptor | ✅ SRP OK |
| `events/` | WebSocket gateway (Socket.IO) | ✅ SRP OK |
| `scanning/` | Batch scan buffer service | ✅ SRP OK |
| `casl/` | CASL ability factory | ✅ SRP OK |

Không có module nào cần tách thêm. Cấu trúc module decomposition tốt.

---

## Dependency Flow

**app.module.ts import order:**
```
EventEmitterModule → ConfigModule → CacheModule → ThrottlerModule
→ PrismaModule (@Global)
→ CaslModule
→ ActivityLogModule
→ AuthModule → UsersModule
→ CategoriesModule → ProductsModule → TagsModule → SessionsModule
→ EventsModule
→ DashboardModule → InventoryModule → OrdersModule → LocationsModule → TransfersModule
→ LoggerConfigModule
```

**Phát hiện:**
- PrismaModule được đánh dấu `@Global()` → `PrismaService` có thể inject vào bất kỳ service nào mà không cần import module. ✅ Đúng pattern.
- **Không có circular dependency** giữa các module.
- Import order không ảnh hưởng runtime vì NestJS resolve trước khi bootstrap.

**Cảnh báo nhẹ:** `PrismaModule` là `@Global` nhưng `app.module.ts` vẫn import nó. Điều này hơi thừa (NestJS sẽ ignore duplicate global modules) nhưng không gây lỗi. Có thể bỏ import `PrismaModule` khỏi `app.module.ts` vì nó đã là global.

---

## Layer Separation

### OrdersService (`backend/src/orders/orders.service.ts`)

**✅ Business logic rõ ràng, không leak sang controller.**
- `create()` — tạo order với validation theo type (INBOUND/OUTBOUND)
- `update()` / `cancelOrder()` / `remove()` — soft-delete pattern đúng
- `mobileQuickSubmit()` — transaction phức tạp nhưng tự chứa trong 1 method

**⚠️ Warning:** Method `update()` nhận `updateOrderDto: any` (line 293). Không có type safety cho DTO update. Nên dùng `UpdateOrderDto` để type-check.

### AuthService (`backend/src/auth/auth.service.ts`)

**✅ `validateUser()` có size hợp lý** — chỉ xử lý login validation + account lockout. Đủ nhỏ để đọc trong 1 lần.

**✅ `login()` / `refresh()` / `logout()` tách biệt rõ ràng.**

**Security note tốt:** Lockout mechanism (5 failed attempts → 15 phút) + atomic increment + token rotation đều implement đúng. Refresh token hash SHA-256 lưu DB.

### TransfersService (`backend/src/transfers/transfers.service.ts`)

**✅ Business logic rõ ràng:** `create()` / `confirm()` / `findAll()` / `findOne()` / `cancel()` / `updateDestination()` — mỗi method 1 trách nhiệm.

**⚠️ Warning:** `cancel()` revert tag về source location nhưng không tạo TagEvent audit trail. Trong khi `create()` có tạo TagEvent cho auto-recall (line 234-243). Inconsistency: cancel nên ghi `RECALLED` event như create.

---

## Shared Code / Duplication

### `backend/src/common/`

| File | Content | Appropriateness |
|------|---------|----------------|
| `exceptions/business.exception.ts` | Custom HTTP exception wrapper | ✅ Đúng — dùng chung cho tất cả modules |
| `helpers/pagination.helper.ts` | `PaginationHelper.paginate()` | ✅ Đúng — dùng chung |
| `entities/base.entity.ts` | Base entity | ✅ Đúng |
| `interfaces/scan.interface.ts` | EPC/Scan shared types + `TAGS_UPDATED_EVENT` constant | ✅ Đúng |
| `interfaces/request.interface.ts` | Request types | ✅ Đúng |
| `config/` | Swagger, env validation, logger | ✅ Đúng |
| `decorators/response-message.decorator.ts` | Response message | ✅ Đúng |
| `filters/http-exception.filter.ts` | Global error filter | ✅ Đúng |
| `interceptors/response.interceptor.ts` | Response wrapper | ✅ Đúng |

### CASL Policies

**✅ Không duplicate** — tất cả policies ở 1 chỗ (`casl-ability.factory.ts`). Các module dùng `@CheckPolicies()` decorator để guard chứ không define policy riêng.

### ⚠️ Duplicated Logic giữa OrdersService và TransfersService

**`getAuthorizedLocationIds()` — Nằm ở cả 2 service:**

- `OrdersService` (line 195-202):
```ts
private async getAuthorizedLocationIds(locationId?: string): Promise<string[]> {
  if (!locationId) return [];
  const locs = await this.prisma.location.findMany({
    where: { OR: [{ id: locationId }, { parentId: locationId }], deletedAt: null },
    select: { id: true }
  });
  return locs.map(l => l.id);
}
```

- `TransfersService` (line 249-261):
```ts
private async getAuthorizedLocationIds(locationId?: string): Promise<string[]> {
  if (!locationId) return [];
  const locs = await this.prisma.location.findMany({
    where: { OR: [{ id: locationId }, { parentId: locationId }], deletedAt: null },
    select: { id: true },
  });
  return locs.map((l) => l.id);
}
```

**Hai method gần identical.** Nên extract vào `common/` helpers hoặc một shared `LocationService`.

**`OrdersService.getManagerInboundAllowedLocationIds()`** cũng là variation bổ sung, có thể cân nhắc tách ra.

---

## Events/Socket.IO Coupling

### Mô hình hiện tại

**Pattern trộn lẫn 2 approach:**

**Approach A — EventEmitter2 (loose coupling):**
- `InventoryService` emit `TAGS_UPDATED_EVENT` via `EventEmitter2`
- `EventsGateway.afterInit()` subscribe và re-emit qua Socket.IO
- ✅ Tách biệt: service chỉ emit event, gateway chỉ broadcast

**Approach B — Direct injection (tight coupling):**
- `OrdersService` inject `EventsGateway` trực tiếp → gọi `this.events.server.emit('orderUpdate', entity)` (line 191, 337, 361, 381, 529)
- `TransfersService` inject `EventsGateway` trực tiếp → gọi `this.events.server.emit('transferUpdate', ...)` (line 364, 377, 486, 627, 690)

### Vấn đề với Approach B

1. **Tight coupling:** Services phụ thuộc concrete `EventsGateway` class. Khó test (cần mock toàn bộ gateway).
2. **Violates dependency inversion:** Thay vì phụ thuộc interface/event, service phụ thuộc implementation cụ thể của Socket.IO.
3. **N+1 event emission:** Mỗi method gọi `emit()` riêng. Nếu thêm field mới, phải sửa cả service lẫn gateway.

### Đề xuất

Nên migrate Approach B → Approach A:

```ts
// events.events.ts — define event names as constants
export const ORDER_UPDATED_EVENT = 'order:updated';
export const TRANSFER_UPDATED_EVENT = 'transfer:updated';

// OrdersService — thay vì inject EventsGateway, emit event
constructor(private eventEmitter: EventEmitter2) {}
// ...
this.eventEmitter.emit(ORDER_UPDATED_EVENT, entity);

// EventsGateway — subscribe như đã làm với TAGS_UPDATED_EVENT
this.eventEmitter.on(ORDER_UPDATED_EVENT, (entity) => {
  this.server.emit('orderUpdate', entity);
});
```

---

## Stale Files

| File | Recommendation |
|------|--------------|
| `backend/src/casl/casl-ability.factory.ts.bak` | **XÓA** — nên remove khỏi git ngay lập tức |

File `.bak` này chứa backup cũ, không có giá trị trong codebase và có thể confuse developers khi import nhầm.

---

## Issues Tìm Thấy

1. **Tight Socket.IO coupling (Approach B)** — `orders/orders.service.ts:17`, `transfers/transfers.service.ts:24` — **MEDIUM** — Services inject `EventsGateway` trực tiếp và gọi `server.emit()`. Nên dùng `EventEmitter2` như `InventoryService` để tách biệt business logic và real-time layer.

2. **Duplicate `getAuthorizedLocationIds()`** — `orders/orders.service.ts:195` và `transfers/transfers.service.ts:249` — **LOW** — Logic gần identical ở 2 service. Nên extract vào helper/shared service.

3. **Missing TagEvent audit trong `cancel()`** — `transfers/transfers.service.ts:572` — **LOW** — Khi cancel transfer, tags revert về source nhưng không ghi `RECALLED` event như `create()`. Inconsistency với D-22 audit trail requirement.

4. **Stale `.bak` file** — `backend/src/casl/casl-ability.factory.ts.bak` — **LOW** — Nên xóa khỏi git.

5. **Type unsafe DTO trong `update()`** — `orders/orders.service.ts:293` — **LOW** — `updateOrderDto: any` nên thay bằng `UpdateOrderDto` để type-check.

6. **Redundant PrismaModule import** — `app.module.ts:70` — **LOW** — PrismaModule đã là `@Global()`, import lại không cần thiết (dù không gây lỗi).

---

## Verdict

**NEEDS_REFACTORING** (minor)

**Điểm: 7/10**

**Lý do:** Cấu trúc tổng thể tốt — module decomposition đúng SRP, dependency flow rõ ràng, layer separation tốt. Tuy nhiên, Socket.IO coupling theo Approach B (direct injection thay vì EventEmitter2) là vấn đề kiến trúc cần cải thiện để maintainability và testability. Duplicate helper cũng cần clean up.

**Ưu điểm:**
- Module decomposition chuẩn SRP
- PrismaModule global pattern đúng
- CASL policies tập trung, không duplicate
- common/ chứa đúng những gì nên share
- Business logic không leak sang controller
- Audit logging pattern nhất quán (ActivityLog + TagEvent)

**Cần cải thiện:**
- Migrate Socket.IO emission từ direct injection → EventEmitter2 pattern
- Extract duplicate `getAuthorizedLocationIds()` helper
- Xóa file `.bak`

---

## Files Checked

- `backend/src/app.module.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/transfers/transfers.service.ts`
- `backend/src/prisma/prisma.module.ts`
- `backend/src/events/events.gateway.ts`
- `backend/src/casl/casl-ability.factory.ts`
- `backend/src/common/helpers/pagination.helper.ts`
- `backend/src/common/exceptions/business.exception.ts`
- `backend/src/common/interfaces/scan.interface.ts`
- `backend/src/inventory/inventory.service.ts`
- `backend/src/users/users.service.ts`
