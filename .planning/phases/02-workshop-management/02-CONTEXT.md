# Phase 2: Workshop Management - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

CRUD xưởng + Transfer Admin→Workshop. Tạo Transfer model để track việc chuyển thẻ từ Admin đến xưởng may. 2-step workflow: Admin tạo Transfer (PENDING) → Xưởng scan confirm (COMPLETED). Tag được gán locationId khi COMPLETED và status = IN_STOCK.

Đây là foundation cho Phase 3 (Workshop→Warehouse transfer).
</domain>

<decisions>
## Implementation Decisions

### Workshop CRUD Approach
- **D-06:** Dùng chung Location API với filter type=WORKSHOP
  - Không tạo WorkshopService riêng
  - CRUD = CRUD trên Location model, filter theo type=WORKSHOP
  - Phase 1 đã tạo Location model với type=WORKSHOP

### Transfer Status Flow
- **D-07:** 2-step workflow với xác nhận
  - Bước 1: Admin tạo Transfer → status = PENDING (tags chưa thuộc xưởng)
  - Bước 2: Xưởng scan confirm đã nhận đủ → status = COMPLETED, Tag.locationId = Workshop, Tag.status = IN_STOCK

### Transfer Permissions
- **D-08:** Admin tạo Transfer + Manager xưởng confirm
  - Admin: tạo transfer, chọn xưởng đích
  - Manager xưởng (WAREHOUSE_MANAGER): scan confirm đã nhận hàng

### Tag Status on Transfer Complete
- **D-09:** Khi Transfer COMPLETED → Tag.status = IN_STOCK
  - Tag.locationId = Workshop (xưởng đích)
  - Tag.status = IN_STOCK (sẵn sàng được may)

### Transfer Model Fields (từ Phase 1 research)
- **D-10:** Transfer model cần fields:
  - id, code (unique), type (ADMIN_TO_WORKSHOP)
  - status (PENDING, COMPLETED, CANCELLED)
  - sourceId (Location - ADMIN)
  - destinationId (Location - Workshop)
  - createdById (User - Admin)
  - items: TransferItem[] (các tag trong transfer)
  - createdAt, completedAt

### Tag.locationRel Update on Transfer
- **D-11:** Khi Transfer COMPLETED → update Tag.locationRel = destination Workshop
  - Và Tag.status = IN_STOCK
  - Location Rel (không phải location string) được update

### Claude's Discretion
- Chi tiết DTO cho Transfer create/confirm
- Endpoint paths cụ thể (/api/transfers, /api/transfers/:id/confirm)
- TransferItem model details (tagId, scannedAt, condition)
- Index strategy cho Transfer model

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision, tech stack
- `.planning/REQUIREMENTS.md` — WORKSHOP-01, TAGS-02
- `.planning/ROADMAP.md` — Phase 2 goal

### Phase 1 Context (Prior Decisions)
- `.planning/phases/01-location-infrastructure/01-CONTEXT.md` — Location model, LocationType enum, decisions D-01 to D-05

### Research
- `.planning/research/workshop-research.md` — Transfer model design patterns, Workshop Location patterns
- `.planning/research/inventory-research.md` — Multi-location tracking, verification workflows

### Existing Code
- `backend/prisma/schema.prisma` — Current schema (Location model từ Phase 1)
- `backend/src/categories/categories.controller.ts` — CRUD pattern (NestJS controller)
- `backend/src/categories/categories.service.ts` — CRUD pattern (NestJS service)
- `backend/src/orders/orders.service.ts` — Order creation pattern với code generation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- CategoriesService pattern — CRUD service với findAll, findOne, create, update, remove
- OrdersService code generation: `${type}-${Date.now()}-${randomBytes}`
- NestJS module pattern: module + controller + service + dto

### Established Patterns
- @Roles(Role.ADMIN) cho protected endpoints
- JwtAuthGuard + RolesGuard cho authentication/authorization
- PrismaService cho database access

### Integration Points
- Transfer → Tag.locationRel thông qua Prisma FK
- Transfer → Location (sourceId, destinationId)
- Transfer → User (createdById)
- EventsGateway.emit('transferUpdate') khi transfer thay đổi

</code_context>

<specifics>
## Specific Ideas

- Transfer code format: `TRF-{timestamp}-{random}` hoặc `W2S-{timestamp}`
- Transfer COMPLETED = khi destination workshop scan confirm đủ số lượng
- Transfer CANCELLED = admin hủy transfer trước khi COMPLETED

</specifics>

<deferred>
## Deferred Ideas

- Workshop→Warehouse transfer — Phase 3
- Customer delivery confirmation — Phase 5
- Location hierarchy (sub-zones) — future
- Workshop production tracking (may bao lâu, công suất) — future

</deferred>

---

*Phase: 02-workshop-management*
*Context gathered: 2026-03-26*
