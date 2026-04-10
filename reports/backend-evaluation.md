# Backend Evaluation Report

**Reviewed modules:** auth, users, transfers, events, common, casl
**Date:** 2026-04-07

---

## Tính Linh Hoạt & Khả Năng Bảo Trì

### 1. Tổ Chức Code — TỐT

Cấu trúc module theo convention NestJS: phân tách rõ ràng giữa controllers, services, DTOs, entities, guards, decorators, và interceptors.

**Điểm mạnh:**
- Module `common/` tập trung với các utility có thể tái sử dụng (pagination helper, response interceptor, exception filter, shared interfaces)
- DTOs đặt cùng module với chúng (`users/dto/`, `auth/dto/`, `transfers/dto/`)
- Entities được cô lập đúng cách (`common/entities/base.entity.ts`, `users/entities/user.entity.ts`)

**Cần lưu ý:** `auth.service.ts:36-42` — constructor tiêm 5 dependencies (UsersService, JwtService, ConfigService, PrismaService, ActivityLogService). Đây là mức chấp nhận được nhưng cần theo dõi khi dự án phát triển.

### 2. Nguyên Tắc SOLID — TRUNG BÌNH

#### Vi Phạm SRP

**CRITICAL — `transfers.service.ts`** trộn 4 concerns riêng biệt:
1. Transfer domain logic (create, confirm, cancel, updateDestination, findAll, findOne)
2. Business rule validation (location type validation, tag state validation)
3. Tag status management (IN_TRANSIT, IN_WORKSHOP, COMPLETED, MISSING, etc.)
4. Socket.IO event emission (`this.events.server.emit(...)`)

Dependency `EventsGateway` được tiêm tại line 24 tạo coupling chặt chẽ và khó test. Socket.IO emission nên được trừu tượng hóa đằng sau một event publisher interface.

**MEDIUM — `events.gateway.ts`** trộn WebSocket transport với business logic:
- Xử lý cả WebSocket events (`scanStream`, `batchScan`) và inventory processing (tự động tạo tag không known tại lines 117-130)
- Trực tiếp sử dụng `PrismaService` cho DB operations thay vì ủy quyền cho `ScanningService`

#### Vi phạm OCP

**MEDIUM — `globalException.filter.ts:69-81`:** Phương thức `getErrorCode()` dùng một map hardcoded. Thêm error codes mới đòi hỏi sửa method này, vi phạm OCP. Nên dùng registry pattern hoặc enum-based approach.

### 3. Dependency Injection — TỐT

NestJS DI được sử dụng đúng xuyên suốt. Constructor injection với `private` shorthand nhất quán. Không có service locator anti-pattern.

**Một coupling concern:** `transfers.service.ts:24` — `EventsGateway` được tiêm trực tiếp thay vì một abstraction. Điều này couple transfer workflow vào Socket.IO transport. Interface `EventPublisher` hoặc abstraction `EventEmitter2` sẽ cải thiện testability và flexibility.

### 4. Xử Lý Lỗi — TRUNG BÌNH

**Sử dụng không nhất quán `BusinessException`:**

| File | Dòng | Exception Type |
|------|-------|----------------|
| `auth.service.ts` | 69, 191, 205, 220 | `BusinessException` (nhất quán) |
| `users.service.ts` | 111, 148, 166, 196, 232, 236 | `BusinessException` (nhất quán) |
| `transfers.service.ts` | 271, 277, 282, 284, 289, 292, 297, 305, 310, 391, 407, 554, 563, 576-579, 586, 593, 648, 650, 658, 664, 668, 674 | `NotFoundException`, `BadRequestException`, `ForbiddenException` (không nhất quán) |
| `casl/policies.guard.ts` | 28, 45 | `BusinessException` (nhất quán) |

**MEDIUM — `transfers.service.ts`:** Dùng raw NestJS exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`) xuyên suốt, trong khi `auth` và `users` dùng `BusinessException` đồng nhất. Điều này tạo format lỗi không nhất quán — raw NestJS exceptions đi qua `GlobalExceptionFilter` và được map thành generic error codes (ví dụ `NOT_FOUND`), mất business context.

**Không có tài liệu chuẩn cho error code** — error codes như `AUTH_ACCOUNT_LOCKED`, `USER_NOT_FOUND`, `TRANSFER_TAG_VALIDATION_FAILED` được định nghĩa ad-hoc per service mà không có central registry.

### 5. DTO Validation — TỐT

Các decorator `class-validator` được sử dụng nhất quán. `CreateUserDto` và `CreateTransferDto` có validation rules đúng. Các decorator Swagger `@ApiProperty` có mặt.

**LOW — Thiếu `@ApiProperty` trên `QueryUsersDto` và `QueryTransfersDto`** — query DTOs không có Swagger documentation.

**LOW — `create-transfer.dto.ts:8`** có inline comment `// ADMIN_TO_WORKSHOP or WORKSHOP_TO_WAREHOUSE` nhưng enum bao gồm `WAREHOUSE_TO_CUSTOMER`. Comment đã lỗi thời.

### 6. Tính Nhất Quán API — TRUNG BÌNH

**Đặt tên response field không nhất quán:**

- `users.service.ts:93-99` trả về snake_case: `created_at`, `updated_at`, `deleted_at`, `created_by`, v.v.
- `base.entity.ts:6-7` dùng `@Expose({ name: 'created_at' })` để map camelCase-to-snake_case
- `transfers.service.ts` trả về raw Prisma output với camelCase (`createdAt`, `updatedAt`)
- `auth.service.ts` trả về snake_case cho tokens: `access_token`, `refresh_token`, `token_type`

**MEDIUM — Trộn lẫn snake_case/camelCase trong transfer responses:** `transfers.service.ts:538` trả về `{ data, total, page, limit, totalPages }` với camelCase fields, trong khi `users.service.ts:101` dùng `PaginationHelper` cho `{ items, pagination: { ... } }`. Hai modules dùng cấu trúc pagination response khác nhau.

**CRITICAL — `AuthenticatedRequest` không đầy đủ:**
- `common/interfaces/request.interface.ts:7-13` chỉ định nghĩa `{ id, username, role }` — thiếu `locationId`
- `transfers.controller.ts:20-22` tự định nghĩa inline interface `RequestWithUser` bao gồm `locationId`
- `auth.controller.ts:36` dùng intersection type `AuthenticatedRequest & { ip?: string }` — không nhất quán giữa các controllers

### 7. Test Coverage — THẤP

Chỉ có 2 spec files:
- `auth/auth.service.spec.ts` — unit tests cho AuthService (validateUser, login, refresh, logout)
- `casl/casl-ability.factory.spec.ts` — unit tests cho CASL permissions

**Coverage gaps:**
- Không có service tests cho `UsersService`, `TransfersService`
- Không có controller tests
- Không có integration tests
- Không có WebSocket gateway tests
- Không có e2e tests

Ước tính coverage: **<15%**

### 8. Technical Debt — CAO

**CRITICAL — File backup lỗi thời:** `backend/src/casl/casl-ability.factory.ts.bak` — file backup nên được xóa khỏi source tree.

**CRITICAL — Environment variable mismatch:** `env.validation.ts:27-31` định nghĩa `JWT_EXPIRES_IN` và `JWT_REFRESH_EXPIRES_IN` như validation rules, nhưng `auth.service.ts:43-46` đọc `JWT_REFRESH_EXPIRATION_DAYS` và `JWT_ACCESS_EXPIRATION`. Các validation rules env tham chiếu đến biến không tồn tại. Không có env vars nào được định nghĩa cho các keys này — `auth.service.ts` chỉ đọc `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION_DAYS`, `JWT_ACCESS_EXPIRATION`.

**MEDIUM — Magic strings rải rác:**
- `'WEB'`, `'MOBILE'` device types hardcoded trong `auth.service.ts:134,147`
- `15 * 60 * 1000` lockout duration hardcoded (`auth.service.ts:97`) thay vì config
- `5` failed login threshold hardcoded (`auth.service.ts:93`) thay vì config
- `TRF-` prefix hardcoded trong transfer code generation (`transfers.service.ts:321`)
- `'RECALLED'` tag event type hardcoded (`transfers.service.ts:238`)
- `'GOOD'` condition hardcoded ở nhiều nơi
- Role strings như `'ADMIN_TO_WORKSHOP'`, `'WORKSHOP'`, `'WAREHOUSE'` dùng như string literals trong `transfers.service.ts` dù đã có enums

**MEDIUM — Code duplication:**
- `AUDIT_USER_SELECT` định nghĩa trong `users.service.ts:17` nhưng cùng pattern (`{ id: true, username: true }`) xuất hiện inline ở nhiều nơi trong transfer service includes
- `USER_SELECT` trong `users.service.ts:19-31` được abstract tốt, nhưng không có abstraction tương đương cho các services khác
- `getAuthorizedLocationIds()` là logic bị duplicate (xuất hiện như inline query ở nhiều nơi)
- `getDashboardStats()` trong `users.service.ts:252` query `ActivityLog` nhưng được đặt trong UsersService — có thể chuyển sang StatsService riêng

**MEDIUM — Unused imports/fields:**
- `env.validation.ts:27-31` định nghĩa `JWT_EXPIRES_IN` và `JWT_REFRESH_EXPIRES_IN` như validated env vars, nhưng không được `auth.service.ts` đọc bao giờ

### 9. Module Coupling — TRUNG BÌNH

**TỐT:** CASL module được decouple đúng cách — `CaslAbilityFactory` không có NestJS module dependencies, giúp portable và testable.

**MEDIUM — Circular dependency risk:** `auth.service.ts` imports `UsersService` từ `@users/users.service`, có thể cuối cùng sẽ import something từ auth module.

**MEDIUM — Transfer module phụ thuộc Events module trực tiếp:** `transfers.service.ts` tiêm `EventsGateway` (line 24), couple business logic vào WebSocket transport. Nếu muốn thêm HTTP-based notification channel, cần sửa `TransfersService`.

### 10. Scalability — TRUNG BÌNH

**Các bottleneck tiềm ẩn khi scale 10x:**

1. **JWT re-verification trên mọi WebSocket message** (`events.gateway.ts:91`) — gateway re-verify JWT trên mọi `batchScan` và `scanStream` message. Ở high scan throughput, điều này tạo CPU overhead. Cân nhắc cache decoded payload trong socket session sau khi connection được thiết lập.

2. **N+1 query risk trong `TransfersService.findAll`** (`transfers.service.ts:522-536`) — `include` clause với nested relations (source, destination, createdBy, items.tag) có thể tạo large result sets. Ở 10x users, pagination với `ORDER BY createdAt DESC` trên transfer table có thể degrade nếu thiếu indexes.

3. **Không có caching layer** — dashboard stats (`users.service.ts:252`) query fresh data mỗi lần. Ở scale, điều này tấn công DB nặng.

4. **`batchScanService` buffer flush tại MAX_BUFFER_SIZE=500** (`events.gateway.ts:186-198`) — `addEpc` calls tuần tự trong loop. Nếu batch sizes tăng, sequential processing này trở thành bottleneck.

5. **Transfer code generation** (`transfers.service.ts:321`) dùng `Date.now().toString().slice(-6)` cho uniqueness — ở high throughput, collision risk tăng. `randomBytes(2)` cung cấp 65536 possibilities nhưng kết hợp với timestamp prefix, uniqueness không được đảm bảo across distributed instances.

6. **Refresh token storage** — mỗi refresh tạo một DB row mới trong `RefreshToken`. Ở 10x users với frequent token rotation, table này phát triển nhanh. Không có TTL cleanup mechanism (refresh tokens được mark revoked nhưng không bao giờ bị xóa).

---

## Performance

### CRITICAL — buildStockSummary() quá nặng, không cache khi cache miss

**File:** `backend/src/inventory/inventory.service.ts:122-403`

`buildStockSummary()` là hàm xây dựng dashboard tổng quan tồn kho, được gọi bất kỳ khi nào cache miss xảy ra (TTL 30 giây + jitter). Hàm này thực hiện **12+ truy vấn DB**:

| # | Query | Loại |
|---|-------|------|
| 1 | `tag.groupBy([status])` | GROUP BY |
| 2 | `tag.count()` — total | COUNT |
| 3 | `tag.count()` — unassigned | COUNT |
| 4 | `tag.findMany` — stockTagsByLocation (lấy full objects) | SELECT |
| 5 | `product.findMany` — + 1 query N+1: includes tags | SELECT |
| 6 | `category.findMany` — + 1 query N+1: includes products.tags | SELECT |
| 7 | `tag.groupBy([locationId, status])` | GROUP BY |
| 8 | `tag.groupBy([locationId, productId])` | GROUP BY |
| 9 | `location.findMany` | SELECT |
| 10 | `product.findMany` — cho locationProducts | SELECT |
| 11 | `activityLog.findMany` | SELECT |
| 12 | `activityLog.count` | COUNT |

**Vấn đề #1 — Line 134-145:** `stockTagsByLocation` dùng `findMany` lấy toàn bộ Tag object nhưng **chỉ cần** `locationRel.type`. Nên dùng `select: { locationRel: { select: { type: true } } }` để giảm dữ liệu trả về. Tuy nhiên vấn đề lớn hơn là dùng `findMany` thay vì `groupBy` — tải toàn bộ tag rồi count trong JS memory thay vì aggregate ở DB.

**Vấn đề #2 — Line 167-176:** `product.findMany` include `tags` → N+1 query. Prisma sẽ load tất cả tags cho mỗi product trong 1 query nhưng vẫn tốn memory khi có hàng nghìn tags.

**Vấn đề #3 — Line 197-204:** `category.findMany` include `products.tags` → N+1 tầng 2. Tương tự, Prisma dùng smart batch nhưng tổng data lớn.

**Tác động:** Mỗi lần cache miss (cứ 30-33 giây), backend sẽ chạy ~12 truy vấn nặng trên bảng có thể hàng trăm nghìn rows. Với dashboard được load thường xuyên, đây là nguồn tải DB chính.

**Khuyến nghị:**
- Thay `findMany` thành `groupBy` cho locationTypeCounts (đang count trong JS)
- Giới hạn `productBreakdown` ở frontend (chỉ query khi cần)
- Tăng cache TTL lên 60-120 giây
- Cân nhắc materialized view hoặc pre-aggregation table cho stock summary

---

### CRITICAL — processBulkScan dùng Promise.all cho từng upsert riêng lẻ

**File:** `backend/src/inventory/inventory.service.ts:468-481`

```typescript
// Line 472-479
const results = await Promise.all(
  chunk.map((epc) =>
    this.prisma.tag.update({
      where: { epc },
      data: { lastSeenAt: now },
    }),
  ),
);
```

Với chunk size = 100, code này thực hiện **100 câu UPDATE riêng biệt** trong parallel. Với 100 concurrent UPDATE, PostgreSQL phải acquire 100 locks riêng, gây contention đặc biệt khi nhiều users scan cùng lúc.

**Tác động:** Khi 10 người dùng scan cùng lúc, mỗi người tạo ~10 parallel batch = 100 concurrent UPDATE queries = DB connection contention + lock wait.

**Khuyến nghị:** Dùng `updateMany` với raw SQL hoặc batch update:
```typescript
await this.prisma.$executeRaw`
  UPDATE "Tag" SET "lastSeenAt" = ${now}
  WHERE "epc" = ANY(${toUpdate})`;
```

---

### HIGH — Missing indexes trên User

**File:** `backend/prisma/schema.prisma:131-188`

| Field | Usage | Index? |
|-------|-------|--------|
| `failedLoginAttempts` | Login rate limiting (`auth.service.ts:80`) | ❌ MISSING |
| `lockedUntil` | Login rate limiting check (`auth.service.ts:68`) | ❌ MISSING |
| `role` | Lọc user theo role | ❌ MISSING |
| `locationId` | Lọc user theo kho | ❌ MISSING |

`validateUser` dùng `findByUsername` (có @unique → index) nhưng sau đó kiểm tra `lockedUntil` và `failedLoginAttempts` trên toàn bộ user record. Khi có nhiều users, lockout check không có index hỗ trợ.

**Khuyến nghị:** Thêm vào schema.prisma:
```prisma
@@index([failedLoginAttempts])
@@index([lockedUntil])
@@index([role])
@@index([locationId])
```

---

### HIGH — JWT verify 2 lần trong mỗi Socket.IO message

**File:** `backend/src/events/events.gateway.ts:82-91, 169-182`

`handleConnection` đã verify JWT và attach user vào client (line 47-68):
```typescript
// Line 58
const payload = this.jwtService.verify(token);
(client as any).user = payload;
```

Nhưng `handleScanStream` và `handleBatchScan` verify lại lần 2:
```typescript
// Line 91
this.jwtService.verify(token);
```
```typescript
// Line 179
this.jwtService.verify(token);
```

Mỗi lần mobile gửi batch scan (có thể 500 EPCs), JWT được verify **3 lần** (1 connection + 1 scanStream/batchScan). Với tần suất cao, đây là overhead CPU không cần thiết.

**Khuyến nghị:** Lấy user từ `(client as any).user` đã được attach trong `handleConnection` thay vì verify lại. Chỉ verify lại nếu cần refresh payload.

---

### HIGH — buildStockSummary gọi 2 lần `product.findMany` và 1 lần `category.findMany` với N+1

**File:** `backend/src/inventory/inventory.service.ts:167-176, 197-204`

Line 167: `product.findMany` include `tags` — Prisma tự batch nhưng vẫn load đầy đủ tag data.
Line 197: `category.findMany` include `products.tags` — nested N+1 dù Prisma smart batch.

Với 100 sản phẩm, mỗi sản phẩm có 50 tags → 5,000 tag records được load từ DB chỉ để đếm số lượng theo status. Tất cả được count trong JS thay vì SQL.

**Khuyến nghị:** Dùng `groupBy` trên Tag với filter:
```typescript
const productBreakdown = await this.prisma.tag.groupBy({
  by: ['productId', 'status'],
  where: { productId: { not: null } },
  _count: { _all: true },
});
```

---

### MEDIUM — auth.service validateUser re-fetch user sau atomic update

**File:** `backend/src/auth/auth.service.ts:80-100`

```typescript
// Line 80-85: Atomic increment
await this.prisma.user.update({
  where: { id: user.id },
  data: { failedLoginAttempts: { increment: 1 } },
});

// Line 88-91: Re-fetch để check threshold
const updated = await this.prisma.user.findUnique({
  where: { id: user.id },
  select: { failedLoginAttempts: true },
});
```

Sau atomic increment, code re-fetch user để kiểm tra `failedLoginAttempts >= 5`. Thay vì re-fetch, có thể return giá trị mới từ atomic operation hoặc dùng transaction với RETURNING clause.

**Khuyến nghị:** Dùng raw query hoặc batch 2 operations trong 1 DB round-trip:
```typescript
const result = await this.prisma.$queryRaw<[{failedLoginAttempts: bigint}]>`
  UPDATE "User" SET "failedLoginAttempts" = "failedLoginAttempts" + 1
  WHERE id = ${user.id}
  RETURNING "failedLoginAttempts"`;
if (Number(result[0].failedLoginAttempts) >= 5) {
  // lock user
}
```

---

### MEDIUM — getAuthorizedLocationIds được gọi nhiều lần trong transfers

**File:** `backend/src/transfers/transfers.service.ts:249-261`

`getAuthorizedLocationIds` query DB để lấy danh sách location IDs có thể truy cập. Được gọi trong:
- `findAll` (line 511)
- `findOne` (line 557)
- `confirm` (line 395)

Nếu WAREHOUSE_MANAGER có cùng locationId trong nhiều request, query này lặp lại không cần thiết.

**Khuyến nghị:** Cache kết quả trong request context hoặc dùng decorator để inject vào service.

---

### MEDIUM — TransferItem lookup trong validateTagsForCreateTransfer không parallel

**File:** `backend/src/transfers/transfers.service.ts:76-90, 95-113`

```typescript
// Line 76-90: Query 1 - pending items
const pendingItems = await this.prisma.transferItem.findMany({...});

// Line 95-113: Query 2 - completed items
const completedItems = await this.prisma.transferItem.findMany({...});
```

Hai query này độc lập và có thể chạy song song:
```typescript
const [pendingItems, completedItems] = await Promise.all([
  this.prisma.transferItem.findMany({where: {tagId: {in: uniqueTagIds}, transfer: {status: TransferStatus.PENDING}}, ...}),
  this.prisma.transferItem.findMany({where: {tagId: {in: uniqueTagIds}, transfer: {status: TransferStatus.COMPLETED}}, ...}),
]);
```

**Khuyến nghị:** Parallelize 2 queries.

---

### LOW — Pagination default limit = 20 nhưng không giới hạn max

**File:** `backend/src/users/users.service.ts:51`, `backend/src/transfers/transfers.service.ts:495`

```typescript
const { page = 1, limit = 20 } = query;
```

Nếu client truyền `limit=100000`, backend sẽ fetch và trả về tất cả records. Không có max limit check.

**Khuyến nghị:** Thêm max limit, ví dụ `Math.min(limit, 100)`.

---

### LOW — Soft-delete extension filter áp dụng global

**File:** `backend/src/prisma/soft-delete.extension.ts`

Soft delete extension tự động thêm `deletedAt: null` vào mọi query. Điều này tốt cho security nhưng có thể gây confusion khi muốn query deleted records (phải bypass extension). Với project hiện tại, impact LOW.

---

### LOW — CacheModule configured nhưng ít được sử dụng

**File:** `backend/src/app.module.ts:60-64`

CacheModule với Redis store (fallback in-memory) được setup global:
- `InventoryService.getStockSummary` — cache-aside với TTL 30s (line 104-119)
- `InventoryService.processBulkScan` — invalidate `inventory:summary` sau scan (line 504)

Nhưng các endpoint khác không cache:
- `TransfersService.findAll` — luôn query DB
- `UsersService.findAll` — luôn query DB
- Dashboard stats — không cache

**Khuyến nghị:** Mở rộng caching cho các list endpoints với shorter TTL.

---

### Performance Summary

| Mức độ | Số lượng | Issues |
|--------|----------|--------|
| CRITICAL | 2 | buildStockSummary quá nặng, processBulkScan 100 parallel upserts |
| HIGH | 3 | Missing indexes on User, JWT verify 2x, N+1 trong buildStockSummary |
| MEDIUM | 3 | Re-fetch user trong validateUser, getAuthorizedLocationIds repeat, TransferItem queries not parallel |
| LOW | 3 | No max limit on pagination, soft-delete extension, underused cache |

### Điểm sáng performance

- **Connection pooling** tốt: PrismaPg adapter với configurable pool size (default 20), idle timeout 30s, connection timeout 5s.
- **bcrypt cost** hợp lý: 12 rounds — balance giữa security và performance.
- **Pagination** được implement đúng cho list endpoints.
- **Promise.all** được dùng cho parallel queries trong `UsersService.getDashboardStats` và `TransfersService.findAll`.
- **Cache-aside pattern** đúng cho `getStockSummary`.
- **Socket.IO rooms** được tách biệt đúng (`scan:live` vs `admin:dashboard`).

---

## Tổng Kết

| Lĩnh vực | Đánh giá | Vấn đề nghiêm trọng |
|-----------|----------|---------------------|
| Tổ chức Code | TỐT | — |
| SOLID Principles | TRUNG BÌNH | SRP violation in TransfersService (4 concerns mixed), OCP issue in exception filter |
| Dependency Injection | TỐT | Minor coupling to EventsGateway in TransfersService |
| Xử lý Lỗi | TRUNG BÌNH | Sử dụng BusinessException không nhất quán trong transfers module, không có central error code registry |
| DTO Validation | TỐT | Thiếu Swagger docs trên query DTOs |
| Tính Nhất Quán API | TRUNG BÌNH | Trộn lẫn snake_case/camelCase, cấu trúc pagination không nhất quán, AuthenticatedRequest interface không đầy đủ |
| Test Coverage | THẤP | Coverage <15%, chỉ có auth và CASL specs |
| Technical Debt | CAO | Stale backup file, env var mismatch, magic strings, code duplication |
| Module Coupling | TRUNG BÌNH | Transfer↔Events tight coupling, AuthenticatedRequest không đầy đủ |
| Scalability | TRUNG BÌNH | JWT re-verification trên WS messages, N+1 risk, không có caching, buffer flush bottleneck |
| Performance | CAO | 2 CRITICAL issues (buildStockSummary, processBulkScan), 3 HIGH issues |

### Top 5 Khuyến Nghị

1. **Tách Socket.IO emission khỏi TransfersService** — tạo interface `EventPublisher`. Điều này tách transport khỏi business logic và cải thiện testability.
2. **Chuẩn hóa `BusinessException` everywhere** — thay thế tất cả `NotFoundException`/`BadRequestException`/`ForbiddenException` trong `transfers.service.ts` bằng `BusinessException` để format lỗi nhất quán.
3. **Sửa `AuthenticatedRequest` interface** — thêm `locationId?: string` vào shared interface và xóa inline `RequestWithUser` trong `transfers.controller.ts`.
4. **Sửa env variable mismatch** — `env.validation.ts` tham chiếu `JWT_EXPIRES_IN` nhưng `auth.service.ts` đọc `JWT_ACCESS_EXPIRATION`. Cần đồng bộ các biến này.
5. **Thêm missing service tests** — ưu tiên tests cho `TransfersService` và `UsersService` vì chúng chứa core business logic.

### Top 3 Performance Fixes

1. **Refactor buildStockSummary()** — thay `findMany` bằng `groupBy`, tăng TTL cache, giới hạn product/category breakdown ở DB layer thay vì JS
2. **Fix processBulkScan upsert pattern** — dùng `$executeRaw` batch update thay vì Promise.all cho từng record
3. **Thêm missing indexes trên User table** — `failedLoginAttempts`, `lockedUntil`, `role`, `locationId`
