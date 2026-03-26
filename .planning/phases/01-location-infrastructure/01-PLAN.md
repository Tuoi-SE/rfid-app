---
phase: "01-location-infrastructure"
plan: "01"
type: "execute"
wave: 1
depends_on: []
files_modified:
  - "backend/prisma/schema.prisma"
  - "backend/prisma/seed.ts"
autonomous: true
requirements:
  - "WORKSHOP-01"
  - "INVENTORY-01"
must_haves:
  truths:
    - "Location model exists with ADMIN, WORKSHOP, WAREHOUSE, CUSTOMER types"
    - "Tag model has locationId foreign key pointing to Location"
    - "2 warehouses (WH-HN-01, WH-HCM-01) are seeded"
    - "2 workshops (WS-A, WS-B) are seeded"
    - "ADMIN location exists for tag creation origin"
  artifacts:
    - path: "backend/prisma/schema.prisma"
      contains: "model Location"
      provides: "Location entity for tracking"
    - path: "backend/prisma/schema.prisma"
      contains: "enum LocationType"
      provides: "Type enum: ADMIN, WORKSHOP, WAREHOUSE, CUSTOMER"
    - path: "backend/prisma/schema.prisma"
      contains: "locationId String?"
      provides: "Foreign key on Tag model"
    - path: "backend/prisma/seed.ts"
      contains: "WH-HN-01"
      provides: "Seed data for Hanoi warehouse"
    - path: "backend/prisma/seed.ts"
      contains: "WS-A"
      provides: "Seed data for Workshop A"
---

<objective>
Tạo Location model — nền tảng cho mọi tracking

Tạo Location entity với LocationType enum (ADMIN, WORKSHOP, WAREHOUSE, CUSTOMER), thêm locationId foreign key vào Tag model, và seed data cho 5 locations: ADMIN, WH-HN-01, WH-HCM-01, WS-A, WS-B.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@backend/prisma/schema.prisma
@backend/prisma/seed.ts
</context>

<interfaces>
From backend/prisma/schema.prisma (existing Tag model):
```prisma
model Tag {
  id        String    @id @default(uuid())
  epc       String    @unique
  productId String?
  product   Product?  @relation(fields: [productId], references: [id])
  status    TagStatus @default(IN_STOCK)
  location  String?   // existing freeform string - keep for migration
  lastSeenAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  scans     Scan[]
  events    TagEvent[]
}
```

From backend/prisma/seed.ts (existing upsert pattern):
```typescript
await prisma.category.upsert({
  where: { name: cat.name },
  update: {},
  create: cat,
});
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Thêm LocationType enum và Location model vào schema.prisma</name>
  <files>backend/prisma/schema.prisma</files>
  <action>
Thêm vào backend/prisma/schema.prisma, sau enum OrderStatus (trước model User):

```prisma
enum LocationType {
  ADMIN
  WORKSHOP
  WAREHOUSE
  CUSTOMER
}

model Location {
  id        String       @id @default(uuid())
  code      String       @unique  // "ADMIN", "WH-HN-01", "WH-HCM-01", "WS-A", "WS-B"
  name      String                  // "Kho Admin", "Kho Tổng Hà Nội", "Xưởng May A"
  type      LocationType
  address   String?
  deletedAt DateTime?    // Soft delete - không xoá location có tags
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  tags      Tag[]

  @@index([type])
  @@index([code])
  @@index([deletedAt])
}
```

Quy tắc:
- code là unique identifier dùng cho seed và reference
- type cố định sau khi tạo (không sửa được - D-03)
- deletedAt cho soft delete - không xoá location có tags (D-04)
- Flat structure - không có parentId (D-02)
</action>
  <verify>
    <automated>grep -A5 "enum LocationType" backend/prisma/schema.prisma && grep -A12 "model Location" backend/prisma/schema.prisma</automated>
  </verify>
  <done>LocationType enum và Location model tồn tại trong schema với các trường: id, code (unique), name, type, address, deletedAt, createdAt, updatedAt</done>
  <read_first>backend/prisma/schema.prisma</read_first>
  <acceptance_criteria>
    - Schema chứa `enum LocationType { ADMIN WORKSHOP WAREHOUSE CUSTOMER }`
    - Schema chứa `model Location` với các trường: id, code (unique), name, type, address, deletedAt, createdAt, updatedAt
    - Schema chứa `tags Tag[]` relation
    - Có index trên type, code, deletedAt
    - Không có parentId hay relation hierarchy (flat - D-02)
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Thêm locationId foreign key vào Tag model</name>
  <files>backend/prisma/schema.prisma</files>
  <action>
Cập nhật model Tag trong backend/prisma/schema.prisma.

Thêm sau trường `location String?` hiện có:

```prisma
locationId  String?
location    Location?  @relation(fields: [locationId], references: [id])
```

Thêm index:
```prisma
@@index([locationId])
```

Giữ nguyên trường `location String?` hiện có — dùng cho migration data và denormalized display text. Chỉ thêm locationId là FK chính thức.
</action>
  <verify>
    <automated>grep -B2 -A2 "locationId" backend/prisma/schema.prisma && grep "location.*Location" backend/prisma/schema.prisma</automated>
  </verify>
  <done>Tag model có locationId String? với Location relation và index trên locationId</done>
  <read_first>backend/prisma/schema.prisma</read_first>
  <acceptance_criteria>
    - Tag model chứa `locationId String?`
    - Tag model chứa `location Location? @relation(fields: [locationId], references: [id])`
    - Có `@@index([locationId])` trong Tag model
    - Trường `location String?` hiện có vẫn được giữ nguyên
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Thêm seed data cho 5 locations trong seed.ts</name>
  <files>backend/prisma/seed.ts</files>
  <action>
Thêm seed data cho 5 Location vào backend/prisma/seed.ts theo format code D-01.

Thêm sau phần seed categories, trước phần seed products:

```typescript
// Seed Locations - D-05
const locations = await Promise.all([
  // ADMIN - vị trí gốc khi tag được tạo
  prisma.location.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Kho Admin',
      type: 'ADMIN',
      address: 'Trung tâm quản lý',
    },
  }),

  // WAREHOUSE - Kho Tổng Hà Nội
  prisma.location.upsert({
    where: { code: 'WH-HN-01' },
    update: {},
    create: {
      code: 'WH-HN-01',
      name: 'Kho Tổng Hà Nội',
      type: 'WAREHOUSE',
      address: 'Hà Nội',
    },
  }),

  // WAREHOUSE - Kho Tổng HCM
  prisma.location.upsert({
    where: { code: 'WH-HCM-01' },
    update: {},
    create: {
      code: 'WH-HCM-01',
      name: 'Kho Tổng HCM',
      type: 'WAREHOUSE',
      address: 'Hồ Chí Minh',
    },
  }),

  // WORKSHOP - Xưởng May A
  prisma.location.upsert({
    where: { code: 'WS-A' },
    update: {},
    create: {
      code: 'WS-A',
      name: 'Xưởng May A',
      type: 'WORKSHOP',
      address: 'Khu công nghiệp A',
    },
  }),

  // WORKSHOP - Xưởng May B
  prisma.location.upsert({
    where: { code: 'WS-B' },
    update: {},
    create: {
      code: 'WS-B',
      name: 'Xưởng May B',
      type: 'WORKSHOP',
      address: 'Khu công nghiệp B',
    },
  }),
]);

console.log(`✅ Seeded ${locations.length} locations`);
```

Đặt seed Location TRƯỚC seed products vì products không phụ thuộc vào Location, nhưng đặt trước để locationId có thể reference được khi seed Tags sau này.
</action>
  <verify>
    <automated>grep -E "WH-HN-01|WH-HCM-01|WS-A|WS-B|ADMIN" backend/prisma/seed.ts | head -20</automated>
  </verify>
  <done>Seed data tồn tại cho: ADMIN, WH-HN-01, WH-HCM-01, WS-A, WS-B (5 locations)</done>
  <read_first>backend/prisma/seed.ts</read_first>
  <acceptance_criteria>
    - Seed chứa upsert cho ADMIN (code: 'ADMIN', type: 'ADMIN')
    - Seed chứa upsert cho WH-HN-01 (type: 'WAREHOUSE')
    - Seed chứa upsert cho WH-HCM-01 (type: 'WAREHOUSE')
    - Seed chứa upsert cho WS-A (type: 'WORKSHOP')
    - Seed chứa upsert cho WS-B (type: 'WORKSHOP')
    - Code format đúng: WH-HN-01, WH-HCM-01, WS-A, WS-B (có hyphen - D-01)
    - Có console.log xác nhận số lượng locations đã seed
  </acceptance_criteria>
</task>

</tasks>

<verification>
- Chạy `npx prisma validate` để validate schema
- Chạy `npx prisma generate` để generate Prisma client
- Kiểm tra Location table được tạo đúng trong migration
</verification>

<success_criteria>
- Location model tồn tại với LocationType enum (ADMIN, WORKSHOP, WAREHOUSE, CUSTOMER)
- Tag model có locationId foreign key tới Location
- Seed data chạy thành công tạo 5 locations (ADMIN + 2 WAREHOUSE + 2 WORKSHOP)
- Location codes đúng format: WH-HN-01, WH-HCM-01, WS-A, WS-B (D-01)
- Location có deletedAt cho soft delete (D-04)
- Prisma migrate có thể chạy mà không có lỗi
</success_criteria>

<output>
Sau khi hoàn thành, tạo `.planning/phases/01-location-infrastructure/01-SUMMARY.md`
</output>
