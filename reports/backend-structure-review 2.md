# Backend Structure Review

**Date:** 2026-04-07
**Reviewer:** Master Agent
**Scope:** `backend/src/` — all modules
**Modules checked:** app.module, orders, transfers, locations, auth, events, scanning, dashboard, inventory, tags, products, sessions, categories, activity-log, casl, prisma, common

---

## 1. Module Organization

### Đánh giá tổng quan
| Module | Controller | Service | DTOs | Entities | Notes |
|--------|-----------|---------|------|----------|-------|
| orders | ✅ | ✅ 533 lines | ✅ | ✅ | Large service |
| transfers | ✅ | ✅ | ✅ | ❌ | ~900+ lines (Codex) |
| locations | ✅ | ✅ | ✅ | ✅ | No PrismaModule import |
| auth | ✅ | ✅ | ✅ | ❌ | Guards, strategies |
| events (gateway) | ✅ | - | ❌ | ❌ | WebSocket only |
| tags | ✅ | ✅ | ✅ | ✅ | |
| products | ✅ | ✅ | ✅ | ✅ | |
| sessions | ✅ | ✅ | ✅ | ✅ | |
| dashboard | ✅ | ✅ | ❌ | ✅ | |
| inventory | ✅ | ✅ | ✅ | ❌ | |
| categories | ✅ | ✅ | ✅ | ✅ | |
| activity-log | ✅ | ✅ | ✅ | ✅ | Interceptor included |
| casl | - | factory | ❌ | ❌ | Policies guard |
| scanning | - | ✅ | ❌ | ❌ | BatchScanService only |

### Nhận xét
- ✅ Module decomposition tốt, chia theo domain logic rõ ràng
- ✅ Orders và Transfers là 2 module riêng biệt (không gộp chung)
- ✅ Mỗi module có đủ Controller + Service + DTO + Entity (trừ transfers thiếu entity)
- ✅ Orders/Transfers/Locations/Products/Tags — tất cả có đủ 4 thành phần
- ⚠️ `events` là WebSocket gateway, không có service — nhưng business logic lại gọi qua nó

---

## 2. Dependency Flow

### Vấn đề lớn: EventsGateway Tight Coupling

```
OrdersService ──inject──> EventsGateway
TransfersService ──inject──> EventsGateway
SessionsService ──inject──> EventsGateway
```

```typescript
// backend/src/orders/orders.service.ts:16-18
constructor(
  private prisma: PrismaService,
  private events: EventsGateway,  // ⚠️ Direct injection
) {}

// backend/src/transfers/transfers.service.ts (tương tự)
```

**Vấn đề kiến trúc:**
1. **Vi phạm Dependency Inversion** — Domain service phụ thuộc infrastructure (WebSocket)
2. **Khó unit test** — Không thể mock EventsGateway dễ dàng khi test OrdersService
3. **Khó thay đổi** — Đổi sang SSE hay message queue phải sửa cả 2 service
4. **Single responsibility bị vi phạm** — Service vừa làm business logic vừa quan tâm đến realtime emit

**Đề xuất fix:**
- Dùng NestJS `EventEmitter2` để emit domain events
- EventsGateway subscribe các events này và forward ra socket
- Hoặc dùng outbox pattern cho reliable emit

### PrismaModule Import Inconsistency

```typescript
// backend/src/orders/orders.module.ts ✅ CÓ
imports: [PrismaModule, EventsModule]

// backend/src/transfers/transfers.module.ts ✅ CÓ
imports: [PrismaModule, EventsModule]

// backend/src/locations/locations.module.ts ❌ KHÔNG
providers: [LocationsService],
controllers: [LocationsController],
exports: [LocationsService],
// → PrismaService vẫn hoạt động vì PrismaModule là @Global()
```

Tuy hoạt động được (do PrismaModule là global), nhưng dependency graph không rõ ràng.

---

## 3. Layer Separation

### ✅ Controller — Service — Prisma tách tốt

```
Controller (orders.controller.ts)
  → Service (orders.service.ts)
    → PrismaService → DB
```

### ⚠️ OrdersService: 533 lines — QUÁ LỚN

Một service class chứa quá nhiều trách nhiệm:

| Method | Lines | Loại |
|--------|-------|------|
| validateInboundDestination | ~35 | Validation |
| validateOutboundDestination | ~30 | Validation |
| ensureManagerCanAccessOrder | ~13 | Authorization (LBAC) |
| getAuthorizedLocationIds | ~7 | Helper |
| getManagerInboundAllowedLocationIds | ~10 | Helper |
| create | ~73 | Business Logic |
| findAll | ~48 | Query |
| findOne | ~25 | Query |
| update | ~46 | Business Logic |
| cancelOrder | ~22 | Business Logic |
| remove | ~18 | Business Logic |
| mobileQuickSubmit | ~147 | Complex cross-domain |

**Đề xuất refactor:**
```
orders/
  orders.service.ts        → CRUD + status transition (~200 lines)
  order-validation.service.ts  → Validation logic (~70 lines)
  order-location.service.ts   → Warehouse/location logic (~50 lines)
```

### ⚠️ TransfersService: ~900+ lines (theo Codex) — cũng quá lớn

Codex đã ghi nhận vấn đề này trong backend evaluation trước đó.

---

## 4. Shared Code / Duplication

### ✅ `common/` được tổ chức tốt

| File | Mục đích | Chất lượng |
|------|----------|-------------|
| `pagination.helper.ts` | Wrapper paginated response | ✅ Xuất sắc |
| `business.exception.ts` | Custom exception | ✅ Tốt |
| `http-exception.filter.ts` | Global error handler | ✅ Tuyệt vời |
| `response.interceptor.ts` | Auto-wrap response | ✅ Tốt |
| `env.validation.ts` | Config validation | ✅ Tốt |
| `logger.config.ts` | Pino logger config | ✅ Tốt |
| `swagConfig.ts` | Swagger setup | ✅ Tốt |

### ⚠️ Duplicate: Location type arrays

```typescript
// orders.service.ts:20-33
private readonly outboundAllowedDestinationTypes: LocationType[] = [...]
private readonly inboundAllowedDestinationTypes: LocationType[] = [...]
```

Các location type arrays này có thể trùng với logic trong TransfersService. Nên move vào `common/constants/location-types.ts`.

### ❌ Stale backup file tồn tại

```
backend/src/casl/casl-ability.factory.ts.bak
```

File `.bak` nên xóa — git history đủ để recover nếu cần.

---

## 5. NestJS Patterns & Consistency

### ✅ Global setup rất chuẩn (`main.ts` + `app.module.ts`)

```typescript
// ValidationPipe
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})

// GlobalExceptionFilter — well structured

// Global Interceptors
ClassSerializerInterceptor
ResponseInterceptor (auto-wrap response)

// Global GUARD via APP_GUARD
ThrottlerGuard

// Global Modules
EventEmitterModule.forRoot()
CacheModule (Redis fallback to in-memory)
ConfigModule (global, with env validation)
PrismaModule (global)
```

### ✅ Swagger + Health Check + Shutdown Hooks

### ⚠️ AuthenticatedRequest Interface không đầy đủ

```typescript
// backend/src/common/interfaces/request.interface.ts
export interface AuthenticatedRequest {
  user: {
    id: string;
    username: string;
    role: Role;
    // ❌ locationId bị thiếu — nhưng code vẫn dùng locationId
  };
}
```

Thực tế `WAREHOUSE_MANAGER` có `locationId` trong token, nhưng interface không khai báo. Controller/service vẫn cast `req.user as any` nhiều chỗ.

### ⚠️ Inconsistent module imports

| Module | PrismaModule | EventsModule | Notes |
|--------|-------------|--------------|-------|
| OrdersModule | ✅ explicit | ✅ explicit | Good |
| TransfersModule | ✅ explicit | ✅ explicit | Good |
| LocationsModule | ❌ implicit | ❌ | Relies on global |
| SessionsModule | ❌ implicit | ❌ implicit | Relies on global |
| ProductsModule | ❌ implicit | ❌ | Relies on global |

### ✅ DTOs có class-validator decorators

Orders DTOs dùng đầy đủ validation decorators — đúng chuẩn NestJS.

---

## 6. Điểm Tốt Cần Giữ

- ✅ Module decomposition theo domain logic rõ ràng, không gộp chung Orders/Transfers
- ✅ Global pipes/filters/interceptors setup chuẩn NestJS best practices
- ✅ PaginationHelper — utility class xuất sắc, response format nhất quán
- ✅ BusinessException + GlobalExceptionFilter — error handling nhất quán toàn hệ thống
- ✅ `$transaction` được dùng đúng chỗ (OrdersService.create, mobileQuickSubmit)
- ✅ Swagger docs + Health check endpoint
- ✅ Redis cache với graceful in-memory fallback
- ✅ Soft-delete extension pattern (Prisma) — clean
- ✅ ThrottlerGuard toàn cục
- ✅ Refresh token rotation (auth) — bảo mật tốt

---

## 7. Issues Theo Thứ Tự Ưu Tiên

| # | Issue | File | Mức độ | Ref |
|---|-------|------|--------|-----|
| 1 | EventsGateway tight coupling | orders.service.ts, transfers.service.ts | **HIGH** | Architecture |
| 2 | AuthenticatedRequest thiếu locationId | request.interface.ts | MEDIUM | Type safety |
| 3 | OrdersService 533 lines | orders.service.ts | MEDIUM | Maintainability |
| 4 | TransfersService ~900+ lines | transfers.service.ts | MEDIUM | Maintainability |
| 5 | Stale `.bak` file | casl-ability.factory.ts.bak | LOW | Cleanup |
| 6 | Module import inconsistency | locations.module.ts | LOW | Clarity |
| 7 | Duplicate location type arrays | orders.service.ts | LOW | DRY |

---

## 8. Verdict

| Chiều | Điểm | Ghi chú |
|-------|------|---------|
| **Module Organization** | 8/10 | Tách tốt theo domain |
| **Dependency Flow** | 6/10 | EventsGateway coupling là vấn đề lớn nhất |
| **Layer Separation** | 7/10 | Tách Controller/Service/Prisma tốt, service quá lớn |
| **Shared Code** | 8/10 | common/ tốt, có backup file thừa |
| **NestJS Patterns** | 8/10 | Global setup chuẩn, consistency tốt |

### Tổng kết

**Cấu trúc CHƯA HOÀN CHỈNH — Cần refactor nhỏ trước khi mở rộng lớn.**

**Điểm tổng thể: 6.5/10 — NEEDS_MINOR_REFACTORING**

**Ba hành động quan trọng nhất:**
1. **P0**: Tách EventsGateway khỏi domain service — dùng EventEmitter2 pattern (architecture fix)
2. **P1**: Refactor OrdersService (533 lines → tách validation/helper) + TransfersService (~900 lines)
3. **P1**: Thêm `locationId?: string` vào AuthenticatedRequest interface

**Không nên:**
- Thêm feature lớn (như email auth) khi OrdersService còn 533 lines
- Mở rộng TransfersService thêm nữa nếu chưa refactor
- Gộp Orders/Transfers vào chung module
