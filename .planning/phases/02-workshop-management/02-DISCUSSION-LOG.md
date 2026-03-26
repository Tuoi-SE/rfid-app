# Phase 2: Workshop Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-workshop-management
**Areas discussed:** Workshop CRUD Approach, Transfer Status Flow, Transfer Permissions, Tag Status on Transfer Complete

---

## Workshop CRUD Approach

| Option | Description | Selected |
|--------|-------------|----------|
| A - Dùng chung Location API | Filter type=WORKSHOP trên Location CRUD | ✓ |
| B - WorkshopService riêng | Tạo module/service riêng cho workshop | |

**User's choice:** Option A
**Notes:** Đơn giản, không cần tạo thêm model/service riêng

---

## Transfer Status Flow

| Option | Description | Selected |
|--------|-------------|----------|
| A - 2-step | Tạo (PENDING) → Xưởng confirm (COMPLETED) | ✓ |
| B - 1-step | Tạo = COMPLETED luôn | |

**User's choice:** Option A
**Notes:** Phù hợp với flow thực tế — xưởng verify bằng máy quét

---

## Transfer Permissions

| Option | Description | Selected |
|--------|-------------|----------|
| A - Admin tạo + Admin confirm | Admin kiểm soát hoàn toàn | |
| B - Admin tạo + Manager xưởng confirm | Xưởng xác nhận đã nhận hàng | ✓ |

**User's choice:** Option B
**Notes:** "Admin tạo xong thì manager chỉ việc confirm khi nhận tag rồi"

---

## Tag Status on Transfer Complete

| Option | Description | Selected |
|--------|-------------|----------|
| A - Tag.status = IN_STOCK | Đổi status khi COMPLETED | ✓ |
| B - Giữ nguyên status | Chỉ đổi locationId | |

**User's choice:** Option A
**Notes:** Thực tế hơn — tag đến xưởng → IN_STOCK để sẵn sàng được may

---

## Summary of Decisions

| Decision | Value |
|----------|-------|
| D-06 | Workshop CRUD = Location API với filter type=WORKSHOP |
| D-07 | 2-step: Admin tạo (PENDING) → Xưởng confirm (COMPLETED) |
| D-08 | Admin tạo + Manager xưởng confirm |
| D-09 | COMPLETED → Tag.status = IN_STOCK |
| D-10 | Transfer model: id, code, type, status, sourceId, destinationId, createdById, items[] |
| D-11 | COMPLETED → Tag.locationRel = destination Workshop |

---

*Discussion complete: 2026-03-26*
