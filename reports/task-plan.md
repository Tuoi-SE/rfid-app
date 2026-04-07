# Task Plan — Backend Critical Fixes

## Goal
Fix 4 critical issues identified in the backend code review.

## Workspace affected
- `backend/` only

## Assumptions
- All fixes are in the backend NestJS application
- CASL ability factory and transfer service have been verified to exist at the reported line numbers

---

## Issue 1 — CASL Permissions Mismatch (Orders)

**File:** `backend/src/casl/casl-ability.factory.ts`
**Lines:** 73–93

**Current code:**
```typescript
// WAREHOUSE_MANAGER lines 73-76:
can('create', 'Order');
can('update', 'Order');
can('delete', 'Order');

// STAFF line 92:
can('create', 'Order');
```

**Required change:**
- WAREHOUSE_MANAGER: Remove `create`, `update`, `delete` for Order — keep only `read`
- STAFF: Remove `create` for Order — keep only `read`
- Only SUPER_ADMIN should have Order create/update/delete

**Verification:**
- Run CASL ability tests
- Confirm WAREHOUSE_MANAGER and STAFF cannot create orders via `POST /api/orders`

---

## Issue 2 — Inverted Logic Bug in `updateDestination`

**File:** `backend/src/transfers/transfers.service.ts`
**Lines:** 622–627

**Current code:**
```typescript
async updateDestination(id: string, destinationId: string, user: ...) {
  if (user.role === 'ADMIN') {
    throw new ForbiddenException(
      'Admin chỉ có quyền xem, không được chỉnh sửa phiếu luân chuyển.',
    );
  }
```

**Problem:** Controller decorator is `@RolesDecorator.allow(Role.ADMIN)` but service rejects ADMIN. Logic is inverted.

**Required change:**
- Change `if (user.role === 'ADMIN')` to `if (user.role !== 'SUPER_ADMIN')` — only SUPER_ADMIN can update destination
- Update controller decorator to `@RolesDecorator.allow(Role.SUPER_ADMIN)`

**Verification:**
- Call `POST /api/transfers/:id/destination` as SUPER_ADMIN — should succeed
- Call as ADMIN — should return 403 Forbidden

---

## Issue 3 — Socket.IO `batchScan` Missing User Validation

**File:** `backend/src/events/events.gateway.ts`
**Lines:** 145–177

**Current code:**
```typescript
@SubscribeMessage('batchScan')
async handleBatchScan(@ConnectedSocket() client: Socket, @MessageBody() epcs: string[]) {
  const userId = (client as any).user?.id || (client as any).user?.sub || 'system';
  // ... processes EPCs with this userId
```

**Problem:** userId is extracted from socket without re-validation. No per-message JWT check.

**Required change:**
- Re-validate JWT token inside `handleBatchScan` using `JwtService.verify()`
- Or add a Socket.IO middleware that validates JWT on every message
- Reject with `throw new WsException('Unauthorized')` if validation fails

**Verification:**
- Send batchScan message without valid JWT — expect Unauthorized error
- Send with valid JWT — should process normally

---

## Issue 4 — WAREHOUSE_MANAGER Has Full Transfer CRUD

**File:** `backend/src/casl/casl-ability.factory.ts`
**Lines:** 63–66

**Current code:**
```typescript
can('read', 'Transfer');
can('create', 'Transfer');
can('update', 'Transfer');
can('delete', 'Transfer');
```

**Required change:**
- Remove `update` and `delete` for WAREHOUSE_MANAGER
- Keep only `read` and `create` (LBAC = location-based access control enforced at service layer)

**Verification:**
- Run CASL ability tests
- Confirm WAREHOUSE_MANAGER cannot update or delete transfers via PATCH/DELETE

---

## Files to modify

1. `backend/src/casl/casl-ability.factory.ts`
2. `backend/src/transfers/transfers.service.ts`
3. `backend/src/transfers/transfers.controller.ts`
4. `backend/src/events/events.gateway.ts`

## Execution order

1. Fix Issue 2 (inverted logic) — quick fix, unblocks the endpoint
2. Fix Issue 1 (CASL Orders) — permission fix
3. Fix Issue 4 (CASL Transfer) — permission fix
4. Fix Issue 3 (Socket.IO batchScan) — security fix

## Open questions

- Should Issue 3 use Socket.IO middleware or in-method re-validation?
- Does `orders.service.ts` have redundant role checks that contradict the CASL fix?
