# Phase 1: Location Infrastructure - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Tạo Location model — nền tảng cho mọi tracking. Thêm Location entity với LocationType enum (ADMIN, WORKSHOP, WAREHOUSE, CUSTOMER), thêm locationId foreign key vào Tag model, và seed data cho 5 locations. Đây là foundation cho Phase 2-5.
</domain>

<decisions>
## Implementation Decisions

### Location Code Format
- **D-01:** Format code theo chuẩn logistics: `WH-HN-01`, `WS-A`, `KS-HN-01`
  - WH = Warehouse, WS = Workshop, KS = Khách Sạn
  - Theo sau là mã địa phương hoặc số thứ tự
  - Không dùng underscore, dùng hyphen

### Location Structure
- **D-02:** Flat structure — không có parent-child hierarchy
  - Mỗi xưởng/kho là 1 location độc lập
  - Xưởng A và Kho của Xưởng A là 2 location riêng

### Location Editable
- **D-03:** Chỉ sửa được tên và address
  - Type cố định sau khi tạo
  - Không đổi type để tránh logic sai

### Location Soft Delete
- **D-04:** Không cho xoá location có tags
  - Nếu location có tags → không xoá được
  - Tránh orphan data ngay từ foundation

### Seed Data (từ requirements)
- **D-05:** Seed 5 locations:
  - ADMIN (type: ADMIN) — vị trí gốc khi tag được tạo
  - WH-HN-01 (type: WAREHOUSE) — Kho Tổng Hà Nội
  - WH-HCM-01 (type: WAREHOUSE) — Kho Tổng HCM
  - WS-A (type: WORKSHOP) — Xưởng May A
  - WS-B (type: WORKSHOP) — Xưởng May B

### Claude's Discretion
- Chi tiết seed address cụ thể
- Index strategy cụ thể
- Migration approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision, tech stack (NestJS + Prisma + PostgreSQL)
- `.planning/REQUIREMENTS.md` — Requirements WORKSHOP-01, INVENTORY-01
- `.planning/ROADMAP.md` — Phase 1 goal

### Existing Code
- `backend/prisma/schema.prisma` — Current Tag model với `location String?` freeform
- `backend/prisma/seed.ts` — Existing seed pattern (upsert pattern)

### Research
- `.planning/research/workshop-research.md` — Location model design patterns
- `.planning/research/inventory-research.md` — Multi-location tracking patterns
- `.planning/research/customer-research.md` — Customer entity design

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma.location.upsert()` pattern — từ seed.ts hiện tại, áp dụng cho Location seed
- Enum pattern từ schema.prisma — LocationType sẽ theo format tương tự

### Established Patterns
- NestJS module structure: model + service + controller (nếu cần CRUD sau)
- Prisma relation pattern: `@relation(fields: [locationId], references: [id])`

### Integration Points
- Tag model → Location via `locationId` foreign key
- TagEvent có thể reference Location thay vì `location String?`

</code_context>

<specifics>
## Specific Ideas

- Code format: `WH-HN-01` = Warehouse Hà Nội số 1
- Code format: `WS-A` = Workshop A
- Code format: `KS-HN-01` = Khách Sạn Hà Nội số 1 (sẽ dùng ở Phase 4)

</specifics>

<deferred>
## Deferred Ideas

- CRUD API cho Location — Phase 2 (Workshop Management) hoặc Phase 4 (Customer Management)
- Location hierarchy (sub-zones) — có thể cần khi xưởng lớn lên
- Xoá location có tags (force delete) — mở rộng sau với migration workflow

</deferred>

---

*Phase: 01-location-infrastructure*
*Context gathered: 2026-03-26*
