# PLAN: Thêm Role SUPER_ADMIN

> **Mục tiêu:** Thêm role `SUPER_ADMIN` có quyền cao nhất (CRUD mọi thứ, xem mọi giao diện), đồng thời hạ quyền `ADMIN` (không xem Dashboard, Tài khoản nội bộ, Phân quyền, Nhật ký hoạt động).

---

## Phân tích hiện trạng

### Roles hiện tại (Prisma schema)

```
enum Role {
  ADMIN              ← hiện tại có can('manage', 'all') = quyền tối cao
  WAREHOUSE_MANAGER  ← quyền kho
  STAFF              ← quyền đọc + tạo phiên
}
```

### Hệ thống phân quyền hiện tại

| Layer | Cơ chế | File |
|-------|--------|------|
| **CASL** | `casl-ability.factory.ts` — ADMIN: `manage all`, WH_MANAGER: hạn chế, STAFF: read only | `src/casl/casl-ability.factory.ts` |
| **RolesGuard** | `@RolesDecorator.allow(Role.ADMIN)` — chỉ dùng ở `transfers.controller.ts` | `src/auth/guards/roles.guard.ts` |
| **PoliciesGuard** | `@PolicyDecorator.check(ability => ...)` — dùng ở `users`, `activity-log` controllers | `src/casl/policies.guard.ts` |
| **Web Sidebar** | `adminOnly: true` + check `user?.role === 'ADMIN'` | `src/components/Sidebar.tsx` |
| **Web Header** | `adminOnly` items + search filter `role === 'ADMIN'` | `src/components/Header.tsx` |
| **Web Features** | ~15 files check `isAdmin = user?.role === 'ADMIN'` | Rải rác trong `src/features/` |

### Các file check role `ADMIN` trên Web (cần sửa)

| File | Dòng check | Hành vi |
|------|-----------|---------|
| `Sidebar.tsx:76` | `user?.role !== 'ADMIN'` | Ẩn menu "ĐIỀU HÀNH & HỆ THỐNG" |
| `Header.tsx:301` | `user?.role === 'ADMIN'` | Role text display |
| `Header.tsx:322,492` | `user?.role === 'ADMIN'` | Filter search results `adminOnly` |
| `Header.tsx:652` | `user?.role === 'ADMIN'` | Profile dropdown text |
| `features/categories/main.tsx:20` | `isAdmin` | Show Create/Edit/Delete buttons |
| `features/products/main.tsx:20` | `isAdmin` | Show Create/Edit/Delete buttons |
| `features/tags/main.tsx:76` | `isAdmin` | Show bulk actions |
| `features/locations/main.tsx:22` | `isAdmin` | Show CRUD buttons |
| `features/locations/location-table.tsx:19,41` | `isAdmin` prop | Column "Thao tác" visibility |
| `features/transfers/transfer-table.tsx:50` | `isAdmin` | Cancel transfer button |
| `features/orders/order-card.tsx:15` | `isAdmin` | `canModify = !isAdmin` |
| `features/sessions/main.tsx:16` | `isAdmin` | Filter sessions |
| `features/sessions/session-table.tsx:42` | `isAdmin` | Assign button logic |

---

## Thiết kế mới

### Ma trận quyền mới

| Quyền | SUPER_ADMIN | ADMIN | WAREHOUSE_MANAGER | STAFF |
|-------|:-----------:|:-----:|:-----------------:|:-----:|
| **Dashboard** | ✅ | ❌ | ❌ | ❌ |
| **Tài khoản nội bộ (Users CRUD)** | ✅ | ❌ | ❌ | ❌ |
| **Phân quyền hệ thống** | ✅ | ❌ | ❌ | ❌ |
| **Nhật ký hoạt động** | ✅ | ❌ | ❌ | ❌ |
| **Categories CRUD** | ✅ | ✅ | Read | Read |
| **Products CRUD** | ✅ | ✅ | Read | Read |
| **Tags CRUD** | ✅ | ✅ | Read | Read |
| **Locations CRUD** | ✅ | ✅ | Read | Read |
| **Transfers tạo/huỷ** | ✅ | ✅ | Tạo + Confirm | ❌ |
| **Orders CRUD** | ✅ | ✅ | CRUD (own) | Create |
| **Sessions** | ✅ | ✅ | Create + Read | Create + Read |
| **Scans** | ✅ | ✅ | Manage | Create + Read |
| **Inventory** | ✅ | ✅ | Read | Read |

### Nguyên tắc thiết kế

1. `SUPER_ADMIN` = `can('manage', 'all')` → truy cập mọi thứ
2. `ADMIN` = giữ quyền CRUD business (categories, products, tags, locations, transfers, orders) nhưng **KHÔNG** có quyền `manage User`, `read Dashboard`, `read ActivityLog`
3. Web check `isAdmin` cần đổi thành **helper function** `isSuperAdmin()` hoặc `hasAdminAccess()` để cover cả 2 roles ở những chỗ liên quan đến business CRUD

---

## Kế hoạch triển khai

### Phase 1: Backend — Schema + Migration

#### 1.1 Prisma Schema

**File:** `backend/prisma/schema.prisma`

```diff
 enum Role {
+  SUPER_ADMIN
   ADMIN
   WAREHOUSE_MANAGER
   STAFF
 }
```

#### 1.2 Migration

```bash
cd backend
DATABASE_URL="...production..." npx prisma migrate dev --name add_super_admin_role
```

> ⚠️ **Production data safety:** Enum addition là non-breaking, không ảnh hưởng data hiện tại. Các user ADMIN hiện tại vẫn giữ nguyên role `ADMIN`.

---

### Phase 2: Backend — CASL

**File:** `backend/src/casl/casl-ability.factory.ts`

```diff
 const normalizeRole = (role: Role | string): Role | null => {
   const value = String(role || '').trim().toUpperCase();
 
+  if (value === Role.SUPER_ADMIN || value === 'SUPERADMIN' || value === 'SUPER_ADMIN') {
+    return Role.SUPER_ADMIN;
+  }
   if (value === Role.ADMIN) return Role.ADMIN;
   // ... rest
 };

 switch (role) {
+  case Role.SUPER_ADMIN:
+    can('manage', 'all');  // Full access mọi thứ
+    break;
+
   case Role.ADMIN:
-    can('manage', 'all');
+    // Business CRUD — nhưng KHÔNG có Dashboard, User, ActivityLog
+    can('manage', 'Category');
+    can('manage', 'Product');
+    can('manage', 'Tag');
+    can('manage', 'Order');
+    can('manage', 'Session');
+    can('manage', 'Scan');
+    can('manage', 'Location');
+    can('manage', 'Inventory');
+    can('read', 'Transfer');
+    can('create', 'Transfer');
+    can('update', 'Transfer');
+    can('delete', 'Transfer');
+    // KHÔNG có: can('manage', 'User')
+    // KHÔNG có: can('read', 'Dashboard')
+    // KHÔNG có: can('read', 'ActivityLog')
     break;
```

---

### Phase 3: Backend — Controllers

#### 3.1 `transfers.controller.ts`

Thêm `SUPER_ADMIN` vào `@RolesDecorator.allow()`:

```diff
   @Post()
-  @RolesDecorator.allow(Role.ADMIN, Role.WAREHOUSE_MANAGER)
+  @RolesDecorator.allow(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER)

   @Post(':id/cancel')
-  @RolesDecorator.allow(Role.ADMIN)
+  @RolesDecorator.allow(Role.SUPER_ADMIN, Role.ADMIN)

   @Post(':id/destination')
-  @RolesDecorator.allow(Role.ADMIN)
+  @RolesDecorator.allow(Role.SUPER_ADMIN, Role.ADMIN)
```

#### 3.2 `activity-log.controller.ts`

SUPER_ADMIN xem tất cả, ADMIN không xem:

```diff
-  const isAdmin = req.user.role === Role.ADMIN;
+  const isAdmin = req.user.role === Role.SUPER_ADMIN;
```

#### 3.3 `users.service.ts`

Bảo vệ SUPER_ADMIN cuối cùng:

```diff
-  if (user.role === Role.ADMIN) {
-    const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN, deletedAt: null } });
+  if (user.role === Role.SUPER_ADMIN) {
+    const adminCount = await this.prisma.user.count({ where: { role: Role.SUPER_ADMIN, deletedAt: null } });
```

---

### Phase 4: Web Dashboard

#### 4.1 Tạo helper function

**File (mới):** `web/src/utils/role-helpers.ts`

```ts
/**
 * SUPER_ADMIN — quyền cao nhất, xem mọi giao diện
 */
export const isSuperAdmin = (role?: string) => role === 'SUPER_ADMIN';

/**
 * ADMIN hoặc SUPER_ADMIN — quyền CRUD business (products, tags, locations...)
 * Dùng cho các nút Create/Edit/Delete trên UI business modules
 */
export const hasAdminAccess = (role?: string) =>
  role === 'SUPER_ADMIN' || role === 'ADMIN';
```

#### 4.2 `Sidebar.tsx`

```diff
- if (group.adminOnly && user?.role !== 'ADMIN') return null;
+ if (group.adminOnly && !isSuperAdmin(user?.role)) return null;
```

#### 4.3 `Header.tsx`

```diff
- const roleText = user?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN CẤP CAO' : 'NHÂN VIÊN KHO';
+ const roleText = isSuperAdmin(user?.role)
+   ? 'QUẢN TRỊ VIÊN CẤP CAO'
+   : hasAdminAccess(user?.role)
+     ? 'QUẢN TRỊ HỆ THỐNG'
+     : user?.role === 'WAREHOUSE_MANAGER'
+       ? 'QUẢN LÝ KHO'
+       : 'NHÂN VIÊN';
```

Search results filter:
```diff
- .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
+ .filter((item) => !item.adminOnly || isSuperAdmin(user?.role))
```

#### 4.4 Feature files (~13 files)

Thay tất cả:
```diff
- const isAdmin = user?.role === 'ADMIN';
+ const isAdmin = hasAdminAccess(user?.role);
```

**Ngoại trừ** `sessions/main.tsx` và `activity-log` có logic chỉ cho SUPER_ADMIN:

```diff
// sessions/main.tsx — only SUPER_ADMIN can see all sessions
- const isAdmin = user?.role === 'ADMIN';
+ const isAdmin = isSuperAdmin(user?.role);
```

---

### Phase 5: Seed / Migration Data Production

Sau khi deploy code mới:

1. Chạy migration trên production:
```bash
DATABASE_URL="...render..." npx prisma migrate deploy
```

2. Tạo SUPER_ADMIN user (hoặc update user ADMIN hiện tại):
```sql
-- Option A: Upgrade user ADMIN hiện tại thành SUPER_ADMIN
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE username = 'your_admin_username';

-- Option B: Tạo user mới (password cần hash bằng script)
```

---

## Danh sách file cần sửa

### Backend (5 files)

| # | File | Thay đổi |
|---|------|----------|
| 1 | `prisma/schema.prisma` | Thêm `SUPER_ADMIN` vào enum Role |
| 2 | `src/casl/casl-ability.factory.ts` | Thêm case SUPER_ADMIN, hạ quyền ADMIN |
| 3 | `src/transfers/transfers.controller.ts` | Thêm SUPER_ADMIN vào RolesDecorator |
| 4 | `src/activity-log/activity-log.controller.ts` | Đổi check isAdmin sang SUPER_ADMIN |
| 5 | `src/users/users.service.ts` | Bảo vệ SUPER_ADMIN cuối cùng |

### Web (15 files)

| # | File | Thay đổi |
|---|------|----------|
| 1 | `utils/role-helpers.ts` | **[MỚI]** Helper functions |
| 2 | `components/Sidebar.tsx` | `adminOnly` → `isSuperAdmin()` |
| 3 | `components/Header.tsx` | roleText + search filter |
| 4 | `features/categories/main.tsx` | `isAdmin` → `hasAdminAccess()` |
| 5 | `features/products/main.tsx` | `isAdmin` → `hasAdminAccess()` |
| 6 | `features/tags/main.tsx` | `isAdmin` → `hasAdminAccess()` |
| 7 | `features/locations/main.tsx` | `isAdmin` → `hasAdminAccess()` |
| 8 | `features/locations/location-table.tsx` | `isAdmin` prop |
| 9 | `features/transfers/transfer-table.tsx` | `isAdmin` → `hasAdminAccess()` |
| 10 | `features/orders/order-card.tsx` | `isAdmin` → `hasAdminAccess()` |
| 11 | `features/sessions/main.tsx` | `isAdmin` → `isSuperAdmin()` |
| 12 | `features/sessions/session-table.tsx` | `isAdmin` → `hasAdminAccess()` |

### Mobile (0 files)

Mobile không check role `ADMIN` trực tiếp → không cần sửa.

---

## Kiểm chứng

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Login SUPER_ADMIN → sidebar | Thấy tất cả menu kể cả Dashboard, Users, Permissions, Activity Logs |
| 2 | Login ADMIN → sidebar | **KHÔNG** thấy nhóm "ĐIỀU HÀNH & HỆ THỐNG" |
| 3 | ADMIN gọi `GET /api/users` | 403 Forbidden |
| 4 | ADMIN gọi `GET /api/activity-logs` | 403 Forbidden |
| 5 | ADMIN CRUD categories/products/tags | 200 OK |
| 6 | ADMIN tạo/huỷ transfer | 200 OK |
| 7 | SUPER_ADMIN CRUD users | 200 OK |
| 8 | SUPER_ADMIN xem activity logs | 200 OK, thấy tất cả |
| 9 | Xoá SUPER_ADMIN cuối cùng | 400 "Không thể xóa" |
| 10 | WAREHOUSE_MANAGER → sidebar | Không thấy nhóm "ĐIỀU HÀNH & HỆ THỐNG" |

---

## Rủi ro & Lưu ý

| Rủi ro | Giải pháp |
|--------|-----------|
| User ADMIN hiện tại trên production mất quyền xem Dashboard/Users | Upgrade thành SUPER_ADMIN trước khi deploy |
| Prisma enum migration rollback | Enum addition là forward-only, không cần rollback |
| Mobile app cache role cũ | JWT token chứa role, cần user logout/login lại |

---

> **Ước tính:** ~2-3 giờ implementation + testing
