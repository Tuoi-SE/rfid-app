---
phase: 04-customer-management
plan: "04"
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/prisma/schema.prisma
  - backend/src/transfers/transfers.service.ts
  - backend/prisma/seed.ts
autonomous: true
requirements:
  - CUSTOMER-01
  - TAGS-05

must_haves:
  truths:
    - "User can CRUD customer locations via Location API with type=HOTEL/RESORT/SPA filter"
    - "WAREHOUSE_TO_CUSTOMER transfer validates source.type=WAREHOUSE and destination.type in (HOTEL|RESORT|SPA)"
    - "Tags transferred to customer have Tag.status=OUT_OF_STOCK and Tag.locationId=customer on COMPLETED"
  artifacts:
    - path: backend/prisma/schema.prisma
      contains: "HOTEL" and "RESORT" and "SPA" in LocationType enum
    - path: backend/prisma/schema.prisma
      contains: "WAREHOUSE_TO_CUSTOMER" in TransferType enum
    - path: backend/src/transfers/transfers.service.ts
      contains: "WAREHOUSE_TO_CUSTOMER" validation block
    - path: backend/prisma/seed.ts
      contains: customer location seed data
  key_links:
    - from: backend/src/transfers/transfers.service.ts
      to: backend/prisma/schema.prisma
      via: TransferType enum import
    - from: transfers.confirm()
      to: Tag model
      via: prisma.tag.updateMany with locationRel + status
---

<objective>
Them Customer Management (CRUD khach hang) va chuan bi cho Outbound Flow.

** Muc tieu:** CRUD khach hang (khach san/resort) su dung Location voi type=CUSTOMER (HOTEL/RESORT/SPA). Them WAREHOUSE_TO_CUSTOMER vao TransferType de chuan bi cho Phase 5.

** Phase boundary:** Chi backend - schema update, transfer service update, seed data. Khong co UI/APIs moi (Location API da co tu Phase 2).
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/04-customer-management/04-CONTEXT.md

# Existing code references
@backend/prisma/schema.prisma
@backend/src/transfers/transfers.service.ts
@backend/src/locations/locations.service.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Cap nhat LocationType va TransferType enum</name>
  <files>backend/prisma/schema.prisma</files>
  <read_first>backend/prisma/schema.prisma</read_first>
  <action>
    1. Tim LocationType enum trong schema.prisma (dong 34-39)
    2. Thay the LocationType enum hien tai:
       ```prisma
       enum LocationType {
         ADMIN
         WORKSHOP
         WAREHOUSE
         HOTEL     // Phase 4 - D-17
         RESORT    // Phase 4 - D-17
         SPA       // Phase 4 - D-17
       }
       ```
       LUU Y: Khong xoa CUSTOMER vi co the con code cu tham chieu (decentralized approach)
    3. Tim TransferType enum (dong 41-44)
    4. Them WAREHOUSE_TO_CUSTOMER vao TransferType:
       ```prisma
       enum TransferType {
         ADMIN_TO_WORKSHOP
         WORKSHOP_TO_WAREHOUSE
         WAREHOUSE_TO_CUSTOMER  // Phase 4 - D-18
       }
       ```
    5. Chay `npx prisma generate` de cap nhat Prisma client
  </action>
  <acceptance_criteria>
    - grep "HOTEL" backend/prisma/schema.prisma -> co trong LocationType enum
    - grep "RESORT" backend/prisma/schema.prisma -> co trong LocationType enum
    - grep "SPA" backend/prisma/schema.prisma -> co trong LocationType enum
    - grep "WAREHOUSE_TO_CUSTOMER" backend/prisma/schema.prisma -> co trong TransferType enum
  </acceptance_criteria>
  <verify>
    <automated>npx prisma generate 2>&1 | head -20</automated>
  </verify>
  <done>
    LocationType co HOTEL, RESORT, SPA. TransferType co WAREHOUSE_TO_CUSTOMER.
    Prisma client da duoc generate.
  </done>
</task>

<task type="auto">
  <name>Task 2: Cap nhat TransfersService cho WAREHOUSE_TO_CUSTOMER</name>
  <files>backend/src/transfers/transfers.service.ts</files>
  <read_first>backend/src/transfers/transfers.service.ts</read_first>
  <action>
    1. Tim section "Type-specific validation" trong create() (dong 26-43)
    2. Them else-if block cho WAREHOUSE_TO_CUSTOMER:
       ```typescript
       } else if (dto.type === 'WAREHOUSE_TO_CUSTOMER') {
         if (source.type !== LocationType.WAREHOUSE) {
           throw new BadRequestException('Vị trí nguồn phải là WAREHOUSE');
         }
         if (
           destination.type !== LocationType.HOTEL &&
           destination.type !== LocationType.RESORT &&
           destination.type !== LocationType.SPA &&
           destination.type !== 'CUSTOMER'  // backward compat
         ) {
           throw new BadRequestException('Vị trí đích phải là HOTEL, RESORT, hoặc SPA');
         }
       }
       ```
    3. Tim confirm() method, xu ly WAREHOUSE_TO_CUSTOMER:
       - Thay vi `status: TagStatus.IN_STOCK` (dòng 124)
       - Dung prisma.transaction de update tags:
         ```typescript
         const isWarehouseToCustomer = transfer.type === 'WAREHOUSE_TO_CUSTOMER';
         await this.prisma.tag.updateMany({
           where: { id: { in: transfer.items.map(item => item.tagId) } },
           data: {
             locationRel: { connect: { id: transfer.destinationId } },
             status: isWarehouseToCustomer ? TagStatus.OUT_OF_STOCK : TagStatus.IN_STOCK,
           },
         });
         ```
       LUU Y: Theo D-19, Tag.status = OUT_OF_STOCK khi xuat cho customer
  </action>
  <acceptance_criteria>
    - grep "WAREHOUSE_TO_CUSTOMER" backend/src/transfers/transfers.service.ts -> ton tai
    - grep "OUT_OF_STOCK" backend/src/transfers/transfers.service.ts -> ton tai trong confirm()
    - grep "destination.type !== LocationType.HOTEL" backend/src/transfers/transfers.service.ts -> ton tai
  </acceptance_criteria>
  <verify>
    <automated>npx tsc --noEmit backend/src/transfers/transfers.service.ts 2>&1 | head -20</automated>
  </verify>
  <done>
    WAREHOUSE_TO_CUSTOMER validation xac dinh source=WAREHOUSE, destination=HOTEL/RESORT/SPA.
    Confirm() update Tag.status = OUT_OF_STOCK cho WAREHOUSE_TO_CUSTOMER transfers.
  </done>
</task>

<task type="auto">
  <name>Task 3: Seed customer locations</name>
  <files>backend/prisma/seed.ts</files>
  <read_first>backend/prisma/seed.ts</read_first>
  <action>
    1. Doc seed.ts hien tai de hieu pattern
    2. Them customer locations (HOTEL, RESORT, SPA) vao seed data:
       - KS-HN-01 (HOTEL) - Khach San Ha Noi 1, dia chi: "123 Nguyen Chi Thanh, Hanoi"
       - RS-HN-01 (RESORT) - Resort Ha Noi 1, dia chi: "456 West Lake, Hanoi"
       - SPA-HN-01 (SPA) - Spa Ha Noi 1, dia chi: "789 Truc Bach, Hanoi"
       - KS-HCM-01 (HOTEL) - Khach San Ho Chi Minh 1, dia chi: "1 Dong Khoi, HCMC"
    3. Dung upsert pattern nhu location hien tai:
       ```typescript
       await prisma.location.upsert({
         where: { code: 'KS-HN-01' },
         update: {},
         create: { code: 'KS-HN-01', name: 'Khach San Ha Noi 1', type: 'HOTEL', address: '123 Nguyen Chi Thanh, Hanoi' },
       });
       ```
    4. Chay seed: `npx prisma db seed` hoac `ts-node prisma/seed.ts`
  </action>
  <acceptance_criteria>
    - grep "KS-HN-01" backend/prisma/seed.ts -> ton tai
    - grep "RS-HN-01" backend/prisma/seed.ts -> ton tai
    - grep "SPA-HN-01" backend/prisma/seed.ts -> ton tai
    - grep "type: 'HOTEL'" backend/prisma/seed.ts -> ton tai
    - grep "type: 'RESORT'" backend/prisma/seed.ts -> ton tai
    - grep "type: 'SPA'" backend/prisma/seed.ts -> ton tai
  </acceptance_criteria>
  <verify>
    <automated>grep -c "HOTEL\|RESORT\|SPA" backend/prisma/seed.ts</automated>
  </verify>
  <done>
    Seed data co 4 customer locations: 2 HOTEL, 1 RESORT, 1 SPA.
  </done>
</task>

</tasks>

<verification>
1. Schema hop le: `npx prisma validate`
2. TypeScript compile: `npx tsc --noEmit` (neu co loi thi chi laycac file da sua)
3. Prisma generate: `npx prisma generate`
4. Seed chay thanh cong: `npx prisma db seed`
</verification>

<success_criteria>
- LocationType co HOTEL, RESORT, SPA
- TransferType co WAREHOUSE_TO_CUSTOMER
- TransfersService validate WAREHOUSE_TO_CUSTOMER: source=WAREHOUSE, destination=HOTEL/RESORT/SPA
- TransfersService confirm() set Tag.status=OUT_OF_STOCK cho WAREHOUSE_TO_CUSTOMER
- Seed co 4 customer locations (2 HOTEL, 1 RESORT, 1 SPA)
</success_criteria>

<output>
Sau khi hoan thanh, tao `.planning/phases/04-customer-management/04-SUMMARY.md` voi:
- Files da sua
- Changes da thuc hien
- Verification results
</output>
