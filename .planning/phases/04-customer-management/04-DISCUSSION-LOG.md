# Phase 4: Customer Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 04-customer-management
**Areas discussed:** Customer Model, Customer Types, Outbound Type, Track tồn kho

---

## Customer Model

| Option | Description | Selected |
|--------|-------------|----------|
| A - Customer model riêng | Tạo Customer model độc lập | |
| B - Dùng Location | Location với type=CUSTOMER | ✓ |

**User's choice:** Option B
**Notes:** Nhất quán với Phase 2 (WORKSHOP), đơn giản hơn

---

## Customer Types

| Option | Description | Selected |
|--------|-------------|----------|
| A - HOTEL, RESORT, SPA | Nhiều loại | ✓ |
| B - Chỉ HOTEL, RESORT | Giới hạn | |

**User's choice:** Option A
**Notes:** Đủ cho nhu cầu thực tế

---

## Outbound Type

| Option | Description | Selected |
|--------|-------------|----------|
| A - Mở rộng Transfer | WAREHOUSE_TO_CUSTOMER | ✓ |
| B - OutboundOrder riêng | Tạo model mới | |

**User's choice:** Option A
**Notes:** Nhất quán với Phase 2-3

---

## Track tồn kho tại Customer

| Option | Description | Selected |
|--------|-------------|----------|
| A - Tag.locationId = Customer | Biết tag nào đang ở khách nào | ✓ |
| B - Chỉ track số lượng | Không biết tag cụ thể | |

**User's choice:** Option A
**Notes:** Đơn giản, infrastructure đã có sẵn

---

## Summary of Decisions

| Decision | Value |
|----------|-------|
| D-16 | Dùng Location với type=CUSTOMER |
| D-17 | HOTEL, RESORT, SPA |
| D-18 | Thêm WAREHOUSE_TO_CUSTOMER vào TransferType |
| D-19 | Tag.locationId = Customer khi COMPLETED |

---

*Discussion complete: 2026-03-26*
