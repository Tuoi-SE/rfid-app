---
phase: 03-warehouse-transfer
verified: null
status: pending
---

# Phase 03: Warehouse Transfer - Validation

## Validation Architecture

### Test Strategy

**Automated checks** (grep/file read):
1. Schema has WORKSHOP_TO_WAREHOUSE in TransferType enum
2. Service has scannedCount validation before COMPLETED
3. Service updates Tag.locationRel and Tag.status = IN_STOCK on COMPLETED
4. DTO has type field for TransferType

**Manual verification** (human testing):
1. Create WORKSHOP_TO_WAREHOUSE transfer via POST /transfers
2. Verify source.type = WORKSHOP validation
3. Verify destination.type = WAREHOUSE validation
4. Partial scan (998/1000) should reject COMPLETED
5. Full scan (1000/1000) should allow COMPLETED
6. After COMPLETED, verify Tag.locationId = destination and Tag.status = IN_STOCK

## Automated Checks

```bash
# 1. Schema check
grep "WORKSHOP_TO_WAREHOUSE" backend/prisma/schema.prisma

# 2. Service scannedCount check
grep -n "scannedCount" backend/src/transfers/transfers.service.ts

# 3. Service Tag update check
grep -n "locationRel.*destination\|IN_STOCK" backend/src/transfers/transfers.service.ts

# 4. DTO type check
grep -n "type.*TransferType" backend/src/transfers/dto/create-transfer.dto.ts

# 5. Build check
cd backend && npm run build
```

## Manual Verification

| Test | Expected | Status |
|------|----------|--------|
| Create WORKSHOP_TO_WAREHOUSE transfer | Success 201 | pending |
| Source not WORKSHOP | BadRequestException | pending |
| Destination not WAREHOUSE | BadRequestException | pending |
| Scan 998/1000 tags, confirm | BadRequestException "Chua quet du so luong" | pending |
| Scan 1000/1000 tags, confirm | Success, status=COMPLETED | pending |
| Tag.locationRel = destination | locationRel.id = destinationId | pending |
| Tag.status = IN_STOCK | status = IN_STOCK | pending |

---

*Phase: 03-warehouse-transfer*
*Validation created: 2026-03-26*
