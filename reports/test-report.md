# Test Report

**Date:** 2026-04-07
**Status:** Verification plan defined

---

## Verification Plan

### Issue #4 - CASL Transfer WAREHOUSE_MANAGER

**Test Scenario:**
1. Create CaslAbilityFactory for WAREHOUSE_MANAGER user
2. Verify `ability.can('read', 'Transfer')` returns true
3. Verify `ability.can('create', 'Transfer')` returns true
4. Verify `ability.can('update', 'Transfer')` returns false
5. Verify `ability.can('delete', 'Transfer')` returns false

**Files to check:**
- Unit test for `casl-ability.factory.ts`

---

### Pre-existing Issue 1 - cancel service SUPER_ADMIN

**Test Scenario:**
1. Call `transfersService.cancel(transferId, { role: 'SUPER_ADMIN', ... })`
2. Verify request succeeds (previously was rejected with ForbiddenException)
3. Call `transfersService.cancel(transferId, { role: 'ADMIN', ... })`
4. Verify request succeeds
5. Call `transfersService.cancel(transferId, { role: 'WAREHOUSE_MANAGER', ... })`
6. Verify request is rejected with ForbiddenException

**Files to check:**
- `transfers.service.spec.ts` - add test for SUPER_ADMIN cancel permission

---

### Pre-existing Issue 2 - confirm service LBAC

**Test Scenario:**
1. Create a transfer with sourceId = WAREHOUSE_A
2. Call `transfersService.confirm()` as WAREHOUSE_MANAGER with locationId = WAREHOUSE_A
3. Verify request succeeds (user has access to source)
4. Call `transfersService.confirm()` as WAREHOUSE_MANAGER with locationId = WAREHOUSE_B (different warehouse)
5. Verify request is rejected with ForbiddenException

**Files to check:**
- `transfers.service.spec.ts` - add LBAC test for confirm

---

### Pre-existing Issue 3 - scanStream JWT validation

**Test Scenario:**
1. Connect to WebSocket without token
2. Send `scanStream` message - should be rejected with WsException('Unauthorized')
3. Connect with invalid token
4. Send `scanStream` message - should be rejected with WsException('Unauthorized')
5. Connect with valid JWT
6. Send `scanStream` message - should succeed

**Files to check:**
- `events.gateway.spec.ts` - add JWT validation tests

---

## Manual Testing Checklist

### Backend API
- [ ] POST /transfers with WAREHOUSE_MANAGER role - should succeed (read + create)
- [ ] PUT /transfers/:id/cancel with SUPER_ADMIN - should succeed
- [ ] PUT /transfers/:id/confirm with WAREHOUSE_MANAGER (wrong location) - should fail
- [ ] PUT /transfers/:id/confirm with WAREHOUSE_MANAGER (correct location) - should succeed

### WebSocket
- [ ] scanStream without JWT - should throw Unauthorized
- [ ] scanStream with invalid JWT - should throw Unauthorized
- [ ] scanStream with valid JWT - should process scans

---

## Files Needing Updates for Tests
- `backend/src/casl/casl-ability.factory.spec.ts`
- `backend/src/transfers/transfers.service.spec.ts`
- `backend/src/events/events.gateway.spec.ts`
