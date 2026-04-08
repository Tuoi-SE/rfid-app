---
phase: 12-backend-refactor
verified: null
status: pending
---

# Phase 12: Backend Refactor - Validation

## Validation Architecture

### Test Strategy

**Automated checks** (grep/file read):
1. AuthenticatedRequest interface co locationId?: string
2. location-types.constant.ts ton tai voi OUTBOUND_ALLOWED_DESTINATION_TYPES va INBOUND_ALLOWED_DESTINATION_TYPES
3. order-validation.service.ts ton tai voi 3 methods: validateInboundDestination, validateOutboundDestination, ensureManagerCanAccessOrder
4. order-location.service.ts ton tai voi 2 methods: getAuthorizedLocationIds, getManagerInboundAllowedLocationIds
5. orders.service.ts < 300 lines va su dung OrderValidationService + OrderLocationService
6. orders.module.ts register day du providers
7. npm run build thanh cong

**Manual verification** (human testing):
1. Tao moi Order - kiem tra validation methods duoc goi dung
2. Kiem tra OrdersService sau refactor con hoat dong dung
3. Kiem tra AuthenticatedRequest.locationId duoc set dung cho WAREHOUSE_MANAGER

## Automated Checks

```bash
# 1. AuthenticatedRequest.locationId check
grep "locationId" backend/src/common/interfaces/request.interface.ts

# 2. location-types.constant.ts check
ls backend/src/common/constants/location-types.constant.ts
grep "OUTBOUND_ALLOWED_DESTINATION_TYPES\|INBOUND_ALLOWED_DESTINATION_TYPES" backend/src/common/constants/location-types.constant.ts

# 3. order-validation.service.ts check
ls backend/src/orders/order-validation.service.ts
grep "validateInboundDestination\|validateOutboundDestination\|ensureManagerCanAccessOrder" backend/src/orders/order-validation.service.ts

# 4. order-location.service.ts check
ls backend/src/orders/order-location.service.ts
grep "getAuthorizedLocationIds\|getManagerInboundAllowedLocationIds" backend/src/orders/order-location.service.ts

# 5. orders.service.ts line count + imports
wc -l < backend/src/orders/orders.service.ts
grep "OrderValidationService\|OrderLocationService" backend/src/orders/orders.service.ts

# 6. orders.module.ts providers
grep "OrderValidationService\|OrderLocationService" backend/src/orders/orders.module.ts

# 7. Build check
cd backend && npm run build

# 8. Tests
cd backend && npm test -- --testPathPattern="orders" --passWithNoTests
```

## Manual Verification

| Test | Expected | Status |
|------|----------|--------|
| Tao Order INBOUND - destination khong hop le | BadRequestException INBOUND_DESTINATION_INVALID | pending |
| Tao Order OUTBOUND - destination khong hop le | BadRequestException OUTBOUND_DESTINATION_INVALID | pending |
| WAREHOUSE_MANAGER tao Order - locationId tu token | Success, locationId duoc su dung dung | pending |
| OrdersService methods nhu binh thuong | CRUD operations work | pending |

---

*Phase: 12-backend-refactor*
*Validation created: 2026-04-08*
