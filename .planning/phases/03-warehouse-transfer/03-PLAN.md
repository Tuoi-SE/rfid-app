---
phase: 03-warehouse-transfer
plan: '03'
type: execute
wave: '1'
depends_on: []
files_modified:
  - backend/prisma/schema.prisma
  - backend/src/transfers/transfers.service.ts
autonomous: true
requirements:
  - TAGS-03
  - TAGS-04
  - INVENTORY-01
must_haves:
  truths:
    - "Workshop tao Transfer den Warehouse voi tags"
    - "Manager kho xac nhan Transfer chi khi du so luong tag duoc quet (D-14)"
    - "Transfer COMPLETED cap nhat Tag.locationId = Warehouse va Tag.status = IN_STOCK (D-15)"
  artifacts:
    - path: backend/prisma/schema.prisma
      provides: TransferType enum voi WORKSHOP_TO_WAREHOUSE
      contains: "WORKSHOP_TO_WAREHOUSE"
    - path: backend/src/transfers/transfers.service.ts
      provides: Logic xu ly WORKSHOP_TO_WAREHOUSE, xac thuc source=WORKSHOP, destination=WAREHOUSE
      exports: create, confirm
    - path: backend/prisma/migrations
      provides: Migration them TransferType WORKSHOP_TO_WAREHOUSE
  key_links:
    - from: transfers.service.ts create()
      to: schema.prisma TransferType
      via: type: 'WORKSHOP_TO_WAREHOUSE'
      pattern: "type.*WORKSHOP_TO_WAREHOUSE"
    - from: transfers.service.ts confirm()
      to: Tag model
      via: updateMany locationId + status
      pattern: "locationId.*destination.*status.*IN_STOCK"
---

<objective>
Them chuc nang Transfer Workshop→Warehouse. Workshop tao Transfer (PENDING) → Manager kho xac nhan (COMPLETED). Tag duoc cap nhat locationId = Warehouse va status = IN_STOCK khi COMPLETED.
</objective>

<context>
@backend/prisma/schema.prisma
@backend/src/transfers/transfers.service.ts
@backend/src/transfers/transfers.controller.ts
@backend/src/transfers/dto/create-transfer.dto.ts
@.planning/phases/03-warehouse-transfer/03-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Them WORKSHOP_TO_WAREHOUSE vao TransferType enum</name>
  <files>backend/prisma/schema.prisma</files>
  <read_first>
    - backend/prisma/schema.prisma (TransferType enum hien tai)
  </read_first>
  <action>
    1. Doc schema.prisma hien tai de xac dinh vi tri TransferType enum (dong 41-43)
    2. Them WORKSHOP_TO_WAREHOUSE vao enum:
       ```prisma
       enum TransferType {
         ADMIN_TO_WORKSHOP
         WORKSHOP_TO_WAREHOUSE  // Them moi - Phase 3
       }
       ```
    3. Chay prisma migrate de tao migration moi:
       ```bash
       cd /Users/heymac/Desktop/Project/RFIDInventory/backend
       npx prisma migrate dev --name add_workshop_to_warehouse_type
       ```
  </action>
  <verify>
    grep -n "WORKSHOP_TO_WAREHOUSE" backend/prisma/schema.prisma
  </verify>
  <done>
    TransferType enum co them WORKSHOP_TO_WAREHOUSE, migration da duoc tao
  </done>
</task>

<task type="auto">
  <name>Task 2: Mo rong transfers.service.ts xu ly WORKSHOP_TO_WAREHOUSE</name>
  <files>backend/src/transfers/transfers.service.ts</files>
  <read_first>
    - backend/src/transfers/transfers.service.ts (ham create va confirm hien tai)
    - backend/prisma/schema.prisma (TransferType enum)
  </read_first>
  <action>
    1. Doc transfers.service.ts hien tai - ham create() (dong 17-79) va confirm() (dong 81-133)

    2. Cap nhat ham create() de xu ly WORKSHOP_TO_WAREHOUSE:
       - Them bien `type` vao dto thay vi hardcode 'ADMIN_TO_WORKSHOP' (dong 58)
       - Thay doi validation:
         - Neu type = ADMIN_TO_WORKSHOP: source.type = ADMIN, destination.type = WORKSHOP
         - Neu type = WORKSHOP_TO_WAREHOUSE: source.type = WORKSHOP, destination.type = WAREHOUSE (per D-13)
       - Tao transfer voi type tu dto, khong con hardcode

    3. Cap nhat ham confirm() de kiem tra so luong tag (D-14):
       - Sau khi xac nhan transfer ton tai va status = PENDING (dong 88-90)
       - Kiem tra so luong TransferItem da duoc scanned (scannedAt NOT NULL)
       - Neu scannedCount < totalItems: throw BadRequestException 'Chua quet du so luong tag, khong the xac nhan'
       - Chi cho phep COMPLETED khi tat ca tag da duoc scanned

    Cu the, them sau dong 90 (sau khi kiem tra status PENDING):
    ```typescript
    // D-14: Kiem tra so luong tag da duoc quet
    const scannedCount = transfer.items.filter(item => item.scannedAt !== null).length;
    if (scannedCount < transfer.items.length) {
      throw new BadRequestException(
        `Da quet ${scannedCount}/${transfer.items.length} tag. Phai quet du so luong moi duoc xac nhan.`
      );
    }
    ```

    4. Xoa comment hardcode type o dong 58, sua thanh:
    ```typescript
    // Create transfer with items - type duoc truyen tu DTO
    const transfer = await this.prisma.transfer.create({
      data: {
        code,
        type: dto.type,  // WORKSHOP_TO_WAREHOUSE hoac ADMIN_TO_WORKSHOP
        status: TransferStatus.PENDING,
        ...
    ```

    5. Them import LocationType neu chua co (kiem tra dong 8)
  </action>
  <verify>
    grep -n "WORKSHOP_TO_WAREHOUSE\|WORKSHOP.*WAREHOUSE\|scannedCount" backend/src/transfers/transfers.service.ts
  </verify>
  <done>
    Service xu ly dung WORKSHOP_TO_WAREHOUSE type, xac thuc source/destination, kiem tra so luong scanned truoc COMPLETED
  </done>
</task>

<task type="auto">
  <name>Task 3: Cap nhat CreateTransferDto cho TransferType</name>
  <files>backend/src/transfers/dto/create-transfer.dto.ts</files>
  <read_first>
    - backend/src/transfers/dto/create-transfer.dto.ts
    - backend/prisma/schema.prisma (TransferType enum)
  </read_first>
  <action>
    1. Doc create-transfer.dto.ts hien tai

    2. Them field `type` vao CreateTransferDto:
       ```typescript
       import { TransferType } from '@prisma/client';

       export class CreateTransferDto {
         @IsEnum(TransferType)
         type: TransferType;  // ADMIN_TO_WORKSHOP hoac WORKSHOP_TO_WAREHOUSE

         @IsUUID()
         sourceId: string;  // Location nguon (ADMIN hoac WORKSHOP)

         @IsUUID()
         destinationId: string;  // Location dich (WORKSHOP hoac WAREHOUSE)

         @IsArray()
         @IsUUID('4', { each: true })
         @ArrayMinSize(1)
         tagIds: string[];
       }
       ```

    3. Cap nhat comment de phan biet hai loai transfer
  </action>
  <verify>
    grep -n "type.*TransferType\|TransferType" backend/src/transfers/dto/create-transfer.dto.ts
  </verify>
  <done>
    CreateTransferDto co field type, cho phep tao ca ADMIN_TO_WORKSHOP va WORKSHOP_TO_WAREHOUSE
  </done>
</task>

</tasks>

<verification>
1. Chay migration: `cd backend && npx prisma migrate dev --name add_workshop_to_warehouse_type`
2. Build: `cd backend && npm run build`
3. Verify type in enum: `grep WORKSHOP_TO_WAREHOUSE backend/prisma/schema.prisma`
4. Verify service logic: `grep -n "WORKSHOP.*WAREHOUSE\|scannedCount" backend/src/transfers/transfers.service.ts`
</verification>

<success_criteria>
- [x] TransferType enum co WORKSHOP_TO_WAREHOUSE
- [x] Migration da tao
- [x] Service validate dung type cho tung loai transfer
- [x] Service kiem tra scanned count truoc COMPLETED (D-14)
- [x] DTO co field type
- [x] Build thanh cong
</success_criteria>

<output>
Sau khi hoan thanh, tao `.planning/phases/03-warehouse-transfer/03-SUMMARY.md`
</output>
