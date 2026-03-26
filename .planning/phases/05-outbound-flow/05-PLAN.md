---
phase: 05-outbound-flow
plan: "05"
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/transfers/transfers.service.ts
autonomous: true
requirements:
  - TAGS-05
---

<objective>
Xuất kho ra khách hàng (WAREHOUSE_TO_CUSTOMER) với workflow 1-step: tạo = COMPLETED ngay, không cần confirm. Warehouse được phép xuất (D-21), giới hạn theo tồn kho thực tế (D-22).
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@backend/src/transfers/transfers.service.ts
@backend/prisma/schema.prisma
@.planning/phases/04-customer-management/04-SUMMARY.md
@.planning/phases/05-outbound-flow/05-CONTEXT.md
</context>

<interfaces>
<!-- Key types from transfers.service.ts that executor will work with -->

From backend/src/transfers/transfers.service.ts:
```typescript
// Existing method signatures
async create(dto: CreateTransferDto, userId: string): Promise<Transfer>
async confirm(transferId: string, dto: ConfirmTransferDto, userId: string): Promise<Transfer>

// CreateTransferDto structure
interface CreateTransferDto {
  type: TransferType;  // ADMIN_TO_WORKSHOP | WORKSHOP_TO_WAREHOUSE | WAREHOUSE_TO_CUSTOMER
  sourceId: string;
  destinationId: string;
  tagIds: string[];
}

// TransferStatus enum values
TransferStatus = { PENDING, COMPLETED, CANCELLED }

// TagStatus enum values
TagStatus = { IN_STOCK, OUT_OF_STOCK, IN_TRANSIT, MISSING }
```

From backend/prisma/schema.prisma:
```prisma
enum TransferType {
  ADMIN_TO_WORKSHOP
  WORKSHOP_TO_WAREHOUSE
  WAREHOUSE_TO_CUSTOMER
}

enum TransferStatus {
  PENDING
  COMPLETED
  CANCELLED
}

model Tag {
  id        String    @id @default(uuid())
  epc       String    @unique
  status    TagStatus @default(IN_STOCK)
  locationId  String?
  locationRel Location? @relation(fields: [locationId], references: [id])
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Sửa create() cho WAREHOUSE_TO_CUSTOMER - 1-step workflow</name>
  <files>backend/src/transfers/transfers.service.ts</files>
  <read_first>
    - backend/src/transfers/transfers.service.ts
    - backend/prisma/schema.prisma
  </read_first>
  <action>
    Sửa method `create()` trong TransfersService để xử lý WAREHOUSE_TO_CUSTOMER khác với các type khác:

    **Tìm đoạn code hiện tại:**
    - Line 41-56: Validation cho WAREHOUSE_TO_CUSTOMER type
    - Line 81-101: Tạo transfer với status=PENDING

    **Thêm validation stock limit (D-22) - sau line 56:**
    ```typescript
    // D-22: WAREHOUSE_TO_CUSTOMER - validate stock limit
    // All tags must be at source warehouse before export
    if (dto.type === 'WAREHOUSE_TO_CUSTOMER') {
      const tagsAtSource = await this.prisma.tag.findMany({
        where: { id: { in: dto.tagIds } },
      });
      const notAtSource = tagsAtSource.filter(t => t.locationId !== dto.sourceId);
      if (notAtSource.length > 0) {
        throw new BadRequestException(
          `${notAtSource.length} tag(s) không có tại warehouse nguồn. Chỉ xuất được tag đang ở warehouse.`
        );
      }
    }
    ```

    **Thêm điều kiện cho WAREHOUSE_TO_CUSTOMER - sau line 80 (trước // Create transfer):**
    ```typescript
    // D-20: WAREHOUSE_TO_CUSTOMER - 1-step workflow (tạo = COMPLETED ngay)
    const isWarehouseToCustomer = dto.type === 'WAREHOUSE_TO_CUSTOMER';
    ```

    **Sửa đoạn tạo transfer (line 81-101) - thay đổi status:**
    ```typescript
    // Create transfer - WAREHOUSE_TO_CUSTOMER created as COMPLETED immediately
    const transfer = await this.prisma.transfer.create({
      data: {
        code,
        type: dto.type,
        status: isWarehouseToCustomer ? TransferStatus.COMPLETED : TransferStatus.PENDING,
        sourceId: dto.sourceId,
        destinationId: dto.destinationId,
        createdById: userId,
        completedAt: isWarehouseToCustomer ? new Date() : null,  // D-20: set completedAt immediately
        items: {
          create: dto.tagIds.map(tagId => ({
            tagId,
            scannedAt: isWarehouseToCustomer ? new Date() : null,  // D-20: Mark as scanned
            condition: isWarehouseToCustomer ? 'GOOD' : undefined,
          })),
        },
      },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });

    // D-20: WAREHOUSE_TO_CUSTOMER - update tags immediately to COMPLETED
    if (isWarehouseToCustomer) {
      // D-19: Tags at customer get OUT_OF_STOCK status
      await this.prisma.tag.updateMany({
        where: { id: { in: dto.tagIds } },
        data: {
          locationId: dto.destinationId,
          status: TagStatus.OUT_OF_STOCK,
        },
      });
      this.events.server.emit('transferUpdate', transfer);
      return transfer;
    }
    ```

    **Giữ nguyên phần còn lại** (events.emit, return transfer) cho các type khác.
  </action>
  <verify>
    <automated>grep -n "isWarehouseToCustomer" backend/src/transfers/transfers.service.ts && grep -n "D-20\|D-22" backend/src/transfers/transfers.service.ts</automated>
  </verify>
  <done>
    Tạo WAREHOUSE_TO_CUSTOMER transfer → status=COMPLETED ngay, tags có locationId=customer, status=OUT_OF_STOCK.
    Tạo ADMIN_TO_WORKSHOP hoặc WORKSHOP_TO_WAREHOUSE → status=PENDING (không đổi).
  </done>
  <acceptance_criteria>
    - [ ] `grep -n "isWarehouseToCustomer" backend/src/transfers/transfers.service.ts` → tìm thấy biến này
    - [ ] `grep -n "tagIds }" backend/src/transfers/transfers.service.ts` → có check locationId !== sourceId
    - [ ] `grep -n "completedAt: isWarehouseToCustomer" backend/src/transfers/transfers.service.ts` → set completedAt
    - [ ] `grep -n "locationId: dto.destinationId" backend/src/transfers/transfers.service.ts` → update locationId
    - [ ] `grep -n "TagStatus.OUT_OF_STOCK" backend/src/transfers/transfers.service.ts` → set OUT_OF_STOCK
  </acceptance_criteria>
</task>

</tasks>

<must_haves>
  truths:
    - "Tạo WAREHOUSE_TO_CUSTOMER transfer → COMPLETED ngay, không cần confirm()"
    - "Tag đã xuất cho customer → locationId=customer, status=OUT_OF_STOCK"
    - "Warehouse không xuất được tag không nằm trong warehouse đó"
  artifacts:
    - path: "backend/src/transfers/transfers.service.ts"
      provides: "1-step WAREHOUSE_TO_CUSTOMER workflow"
      contains: "isWarehouseToCustomer, TransferStatus.COMPLETED, TagStatus.OUT_OF_STOCK"
  key_links:
    - from: "transfers.service.ts create()"
      to: "Tag table"
      via: "prisma.tag.updateMany with locationId + OUT_OF_STOCK"
      pattern: "updateMany.*locationId.*OUT_OF_STOCK"
</must_haves>

<verification>
## Phase-level verification checks

1. **Schema validation:** `npx prisma validate` passes
2. **TypeScript compilation:** `npx tsc --noEmit` passes
3. **Transfer create for WAREHOUSE_TO_CUSTOMER returns status=COMPLETED:**
   - Mock/pry tạo WAREHOUSE_TO_CUSTOMER transfer
   - Verify response.status === 'COMPLETED'
4. **Transfer create for WORKSHOP_TO_WAREHOUSE still returns status=PENDING:**
   - Verify no regression on existing workflow
5. **Stock limit validation works:**
   - Try to create WAREHOUSE_TO_CUSTOMER with tags not at source warehouse
   - Verify BadRequestException thrown

## Test scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Create WAREHOUSE_TO_CUSTOMER with valid tags at warehouse | status=COMPLETED, tags.OUT_OF_STOCK |
| Create WAREHOUSE_TO_CUSTOMER with tags NOT at warehouse | BadRequestException |
| Create WORKSHOP_TO_WAREHOUSE (existing workflow) | status=PENDING, no tag changes |
| Create ADMIN_TO_WORKSHOP (existing workflow) | status=PENDING, no tag changes |
</verification>

<success_criteria>
- [ ] WAREHOUSE_TO_CUSTOMER transfer created → status=COMPLETED immediately (not PENDING)
- [ ] WAREHOUSE_TO_CUSTOMER transfer → tags updated: locationId=destination, status=OUT_OF_STOCK
- [ ] Stock limit validation: cannot export tags not at source warehouse
- [ ] Existing 2-step workflow (ADMIN_TO_WORKSHOP, WORKSHOP_TO_WAREHOUSE) unchanged: status=PENDING on create
- [ ] prisma validate + tsc pass
</success_criteria>

<output>
After completion, create `.planning/phases/05-outbound-flow/05-SUMMARY.md`
</output>
