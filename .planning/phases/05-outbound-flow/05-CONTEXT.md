# Phase 5: Outbound Flow - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Xuất kho → Customer. Warehouse tạo Outbound Transfer (WAREHOUSE_TO_CUSTOMER) → COMPLETED ngay khi xuất. Không cần Customer xác nhận đã nhận hàng.

Tất cả Warehouse đều được phép xuất. Giới hạn số lượng xuất không vượt quá số lượng hiện có trong Warehouse.

Không có dashboard cho outbound stats trong phase này. Query trực tiếp khi cần.
</domain>

<decisions>
## Implementation Decisions

### Xác nhận từ Customer
- **D-20:** Không cần Customer xác nhận đã nhận hàng
  - Warehouse xuất → COMPLETED ngay khi tạo
  - Đơn giản hóa Phase 5, không phụ thuộc Customer integration
  - Phase tương lai có thể thêm confirmation nếu cần

### Warehouse nào được xuất
- **D-21:** Tất cả Warehouse đều được phép xuất cho Customer
  - WH-HN-01, WH-HCM-01 đều có thể tạo WAREHOUSE_TO_CUSTOMER Transfer
  - Không giới hạn warehouse nào

### Số lượng xuất
- **D-22:** Giới hạn theo tồn kho Warehouse
  - Warehouse không thể xuất quá số lượng tag hiện có tại warehouse đó
  - Validation: `items.length <= warehouse.stockCount`
  - Tránh overselling/out-of-stock khi xuất

### Dashboard/Thống kê
- **D-23:** Không dashboard outbound trong Phase 5
  - Query trực tiếp bất kỳ lúc nào
  - Mở rộng Phase 6+ nếu cần dashboard

### Transfer Workflow (từ Phase 2-4)
- **D-07:** 2 step: PENDING → COMPLETED (nhưng Phase 5: tạo là COMPLETED ngay)
- **D-08:** WAREHOUSE_MANAGER tạo Outbound
- **D-14:** Giới hạn theo tồn kho
- **D-18:** WAREHOUSE_TO_CUSTOMER TransferType đã có từ Phase 4
- **D-19:** COMPLETED → Tag.locationRel = Customer, Tag.status = OUT_OF_STOCK

### Claude's Discretion
- Chi tiết service validation tồn kho
- Query Outbound history theo Customer/Warehouse/ngày
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision
- `.planning/REQUIREMENTS.md` — TAGS-05
- `.planning/ROADMAP.md` — Phase 5 goal

### Phase 1-4 Context (Prior Decisions)
- `.planning/phases/01-location-infrastructure/01-CONTEXT.md` — D-01 to D-05
- `.planning/phases/02-workshop-management/02-CONTEXT.md` — D-06 to D-11
- `.planning/phases/03-warehouse-transfer/03-CONTEXT.md` — D-12 to D-15
- `.planning/phases/04-customer-management/04-CONTEXT.md` — D-16 to D-19

### Existing Code
- `backend/prisma/schema.prisma` — TransferType, LocationType
- `backend/src/transfers/transfers.service.ts` — Transfer workflow
- `backend/src/locations/locations.service.ts` — Location queries
</canonical_refs>

<specifics>
## Specific Ideas

- Warehouse stock limit: `items.length <= warehouse.totalTags`
- Query Outbound history: filter by destinationId (Customer) + date range
- OUT_OF_STOCK status khi COMPLETED để phân biệt với IN_STOCK tại Warehouse

</specifics>

<deferred>
## Deferred Ideas

- Customer delivery confirmation — mở rộng Phase 5+ nếu cần
- Dashboard outbound stats — mở rộng Phase 6+
- Customer hierarchical (chain/property) — future
- Xuất điều chỉnh sửa — sửa số lượng sau khi đã xuất
</deferred>

---

*Phase: 05-outbound-flow*
*Context gathered: 2026-03-26*
