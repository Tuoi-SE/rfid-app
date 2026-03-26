# Phase 1: Location Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 01-location-infrastructure
**Areas discussed:** Location Code Format, Location Structure, Location Editable, Soft Delete

---

## Location Code Format

| Option | Description | Selected |
|--------|-------------|----------|
| A - Underscore format | `KHO_TONG_1`, `XUONG_A` | |
| B - Short warehouse code | `WH-HN-01`, `WS-A` | ✓ |
| C - Tự nhập | User tự đặt mã | |

**User's choice:** Option B — Short warehouse code
**Notes:** Theo chuẩn logistics/quốc tế, ngắn gọn

---

## Parent-child Hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| A - Flat structure | Mỗi xưởng/kho là 1 location độc lập | ✓ |
| B - Có hierarchy | Xưởng A → Zone 1, Zone 2 | |

**User's choice:** Option A — Flat structure
**Notes:** "Mỗi xưởng sẽ có kho hết" — tức là xưởng và kho là 2 location riêng

---

## Location Editable

| Option | Description | Selected |
|--------|-------------|----------|
| A - Được sửa | Đổi tên, type, address thoải mái | |
| B - Chỉ đổi tên/address | Không đổi type sau khi tạo | ✓ |
| C - Không sửa | Tạo mới, không sửa | |

**User's choice:** Option B
**Notes:** Type cố định, tránh logic sai

---

## Soft Delete Locations

| Option | Description | Selected |
|--------|-------------|----------|
| A - Không cho xoá | Location có tags thì không xoá được | ✓ |
| B - Migrate trước | Phải di chuyển hết tags đi chỗ khác mới xoá được | |
| C - Xoá được | Tags giữ nguyên reference đã xoá | |

**User's choice:** Option A (recommended)
**Notes:** Đơn giản và an toàn nhất cho Phase 1 foundation

---

## Claude's Discretion

- Chi tiết seed address cụ thể
- Index strategy cụ thể cho Location model
- Migration approach từ `location String?` sang `locationId FK`

---

*Discussion complete: 2026-03-26*
