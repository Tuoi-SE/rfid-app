# RFID Inventory System

## What This Is

Hệ thống quản lý tồn kho RFID tag cho chuỗi cung ứng sản phẩm may mặc. Admin quản lý tag từ khi sản xuất → giao cho khách sạn/resort. Hệ thống track được số lượng tag đang ở đâu (xưởng, kho tổng, khách hàng).

## Core Value

Quản lý chính xác số lượng RFID tag tại mỗi điểm trong chuỗi cung ứng — từ xưởng may đến tay khách hàng.

## Requirements

### Validated

- ✓ Tags có thể gán sản phẩm (đã có dữ liệu sản phẩm)
- ✓ Admin/Manager có thể quản lý tag qua mobile app
- ✓ JWT authentication cho Admin và Warehouse Manager

### Active

- [ ] **TAGS-01**: Admin quét tag hàng loạt và gán sản phẩm
- [ ] **TAGS-02**: Track số lượng tag theo từng xưởng may
- [ ] **TAGS-03**: Track số lượng tag theo kho tổng (2 kho)
- [ ] **TAGS-04**: Manager quét verify khi nhập kho — số quét được = số nhập
- [ ] **TAGS-05**: Xuất tag cho khách hàng (khách sạn, resort) — chỉ cần track đã xuất
- [ ] **WORKSHOP-01**: Tạo/quản lý danh sách xưởng may
- [ ] **CUSTOMER-01**: Tạo/quản lý danh sách khách hàng (type: khách sạn/resort)
- [ ] **INVENTORY-01**: Tổng hợp tồn kho theo location (xưởng, kho, khách hàng)

### Out of Scope

- Xác nhận giao hàng từ khách (mở rộng sau) — chỉ track "đã xuất"
- Báo cáo doanh thu, chi phí
- Quản lý nhân viên xưởng (chỉ track số lượng tag)

## Context

- **Tech stack:** NestJS backend (Prisma + PostgreSQL), Next.js web, React Native mobile
- **Trạng thái:** Development — đã có database với dữ liệu mẫu
- **Models hiện có:** User, Product, Category, Tag, TagEvent, Order, Session, Scan, ActivityLog
- **Models cần thêm:** Workshop, Customer, InventoryTransaction

## Constraints

- **Tech**: Không đổi tech stack — tiếp tục NestJS + Prisma + PostgreSQL
- **Data**: Dữ liệu hiện có cần giữ — migration phải tương thích
- **Scanner**: Mobile app dùng máy quét RFID qua BLE — flow phải verify bằng quét thực tế

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 2 kho tổng + nhiều kho xưởng | Admin tự quyết định phân bổ | — Pending |
| Không có delivery confirmation | Mở rộng sau, hiện tại chỉ track xuất | — Pending |
| Verify bằng máy quét khi nhập kho | Đảm bảo dữ liệu chính xác, tránh human error | — Pending |

---

*Last updated: 2026-03-26 after questioning*
