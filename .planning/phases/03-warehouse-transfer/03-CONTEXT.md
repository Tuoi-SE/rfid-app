# Phase 3: Warehouse Transfer - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Transfer Workshop→Warehouse với scan verify. Xưởng may xong → Manager nhập kho tổng. 2-step workflow: Workshop tạo Transfer (PENDING) → Manager kho confirm (COMPLETED). Tag được gán locationId = Warehouse khi COMPLETED và status = IN_STOCK.

Đây là tiếp nối Phase 2 (Admin→Workshop). Phase 3 hoàn thành chu trình: Admin→Workshop→Warehouse.
</domain>

<decisions>
## Implementation Decisions

### Transfer Type
- **D-12:** Thêm `WORKSHOP_TO_WAREHOUSE` vào TransferType enum
  - ADMIN_TO_WORKSHOP (Phase 2)
  - WORKSHOP_TO_WAREHOUSE (Phase 3) ← thêm mới

### Warehouse Destination
- **D-13:** Admin chọn kho đích khi tạo Transfer
  - Admin linh hoạt chọn WH-HN-01 hoặc WH-HCM-01
  - Không có rule cố định xưởng nào vào kho nào

### Verify Quantity
- **D-14:** Không cho COMPLETED nếu thiếu thẻ
  - Tạo Transfer 1000 thẻ → Quét được 998 → KHÔNG cho COMPLETED
  - Phải tìm đủ 1000 mới nhận
  - Tránh mất hàng do "để xưởng tìm"

### Tag Status on Warehouse Transfer Complete
- **D-15:** COMPLETED → Tag.status = IN_STOCK
  - Giống Phase 2 (D-09)
  - Tag đã nhập kho tổng → status = IN_STOCK
  - LocationId = Warehouse đích

### Transfer Status Flow (từ Phase 2)
- **D-07:** 2-step: PENDING → COMPLETED
  - Workshop tạo Transfer (PENDING)
  - Manager kho confirm (COMPLETED)

### Transfer Permissions (từ Phase 2)
- **D-08:** Workshop tạo + Manager kho confirm
  - Workshop (WAREHOUSE_MANAGER): tạo transfer
  - Manager kho (WAREHOUSE_MANAGER): confirm đã nhận hàng

### Claude's Discretion
- Chi tiết DTO cho Warehouse Transfer
- Endpoint paths (có thể dùng chung /transfers với filter type)
- Validation: source phải là WORKSHOP, destination phải là WAREHOUSE

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision
- `.planning/REQUIREMENTS.md` — TAGS-03, TAGS-04, INVENTORY-01
- `.planning/ROADMAP.md` — Phase 3 goal

### Phase 1 Context (Prior Decisions)
- `.planning/phases/01-location-infrastructure/01-CONTEXT.md` — Location model, decisions D-01 to D-05

### Phase 2 Context (Prior Decisions)
- `.planning/phases/02-workshop-management/02-CONTEXT.md` — Transfer model, decisions D-06 to D-11

### Existing Code
- `backend/prisma/schema.prisma` — Transfer model với TransferType, TransferStatus
- `backend/src/transfers/transfers.service.ts` — Phase 2 transfer service
- `backend/src/transfers/transfers.controller.ts` — Phase 2 transfer controller

</canonical_refs>

<specifics>
## Specific Ideas

- Transfer type: WORKSHOP_TO_WAREHOUSE
- Validation: source.type = WORKSHOP, destination.type = WAREHOUSE
- COMPLETED = quét đủ số lượng mới cho nhận
- Tag.locationId = Warehouse khi COMPLETED
- Tag.status = IN_STOCK khi COMPLETED

</specifics>

<deferred>
## Deferred Ideas

- Customer delivery confirmation — Phase 5
- Workshop production tracking (IN_PROGRESS) — future
- Báo cáo thống kê xưởng/kho — future

</deferred>

---

*Phase: 03-warehouse-transfer*
*Context gathered: 2026-03-26*
