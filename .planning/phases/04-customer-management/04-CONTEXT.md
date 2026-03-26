# Phase 4: Customer Management - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

CRUD khách hàng (khách sạn/resort) + Outbound đến Customer. Dùng Location với type=CUSTOMER. Thêm WAREHOUSE_TO_CUSTOMER vào TransferType. Tag.locationId = Customer khi COMPLETED.

Đây là foundation cho Phase 5 (Outbound Flow).
</domain>

<decisions>
## Implementation Decisions

### Customer Model
- **D-16:** Dùng Location với type=CUSTOMER
  - Không tạo Customer model riêng
  - Giống Phase 2 (Workshop dùng Location với type=WORKSHOP)
  - Nhất quán với existing pattern

### Customer Types
- **D-17:** Thêm HOTEL, RESORT, SPA vào LocationType enum
  - CUSTOMER: HOTEL | RESORT | SPA
  - Đủ cho nhu cầu hiện tại

### Outbound Type (liên quan Phase 5)
- **D-18:** Thêm WAREHOUSE_TO_CUSTOMER vào TransferType
  - Mở rộng Transfer model
  - Giống WORKSHOP_TO_WAREHOUSE (Phase 3)
  - Workflow: WAREHOUSE → Customer (2-step: PENDING → COMPLETED)

### Track tồn kho tại Customer
- **D-19:** Tag.locationId = Customer khi COMPLETED
  - Tag đã xuất → Tag.locationId = Customer (khách sạn/resort)
  - Tag.status = OUT_OF_STOCK (đã xuất)
  - Query đơn giản: Tag.locationId → Customer biết tag nào đang ở khách nào

### Transfer Workflow (từ Phase 2-3)
- **D-07:** 2-step: PENDING → COMPLETED
- **D-08:** WAREHOUSE_MANAGER tạo + Customer confirm
- **D-14:** Không cho COMPLETED nếu thiếu

### Customer Location
- **D-03:** Type cố định sau tạo (từ Phase 1)
- **D-04:** Không xoá nếu có tags

### Claude's Discretion
- Seed data cho Customer locations
- DTO cho WAREHOUSE_TO_CUSTOMER transfer
- LocationType update cho CUSTOMER với HOTEL/RESORT/SPA

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision
- `.planning/REQUIREMENTS.md` — CUSTOMER-01, TAGS-05
- `.planning/ROADMAP.md` — Phase 4 goal

### Phase 1 Context (Prior Decisions)
- `.planning/phases/01-location-infrastructure/01-CONTEXT.md` — Location model, decisions D-01 to D-05

### Phase 2 Context (Prior Decisions)
- `.planning/phases/02-workshop-management/02-CONTEXT.md` — Transfer model, decisions D-06 to D-11

### Phase 3 Context (Prior Decisions)
- `.planning/phases/03-warehouse-transfer/03-CONTEXT.md` — WORKSHOP_TO_WAREHOUSE, decisions D-12 to D-15

### Existing Code
- `backend/prisma/schema.prisma` — TransferType, LocationType
- `backend/src/transfers/transfers.service.ts` — Transfer workflow
- `backend/src/locations/locations.service.ts` — Location CRUD

</canonical_refs>

<specifics>
## Specific Ideas

- Location codes: `KS-HN-01` = Khách Sạn Hà Nội 1, `RS-HN-01` = Resort
- HOTEL = Khách sạn, RESORT = Khu nghĩ dưỡng, SPA = Spa
- Transfer WAREHOUSE_TO_CUSTOMER: source=WAREHOUSE, destination=CUSTOMER

</specifics>

<deferred>
## Deferred Ideas

- Customer delivery confirmation — Phase 5 hoặc future
- Customer hierarchical (chain/property) — future
- Báo cáo thống kê khách hàng — future

</deferred>

---

*Phase: 04-customer-management*
*Context gathered: 2026-03-26*
