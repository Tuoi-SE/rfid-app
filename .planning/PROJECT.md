# RFID Inventory System

## What This Is

Hệ thống quản lý tồn kho RFID tag cho chuỗi cung ứng sản phẩm may mặc. Admin quản lý tag từ khi sản xuất → giao cho khách sạn/resort. Hệ thống track được số lượng tag đang ở đâu (xưởng, kho tổng, khách hàng).

## Core Value

Quản lý chính xác số lượng RFID tag tại mỗi điểm trong chuỗi cung ứng — từ xưởng may đến tay khách hàng.

## Current Milestone: v1.1 Performance & Scale Preparation

**Goal:** Chuẩn bị kiến trúc để scale — Redis cache, connection pooling, batch scan, service boundaries

**Target features:**
- Redis cache layer cho inventory queries
- Connection pooling tối ưu cho concurrent scans
- Batch scan buffer — gửi nhiều tag cùng lúc
- Service boundaries — tách logic thành modules rõ ràng

## Requirements

### Validated

- ✓ Tags có thể gán sản phẩm (đã có dữ liệu sản phẩm)
- ✓ Admin/Manager có thể quản lý tag qua mobile app
- ✓ JWT authentication cho Admin và Warehouse Manager
- ✓ Location infrastructure (ADMIN, WAREHOUSE, WORKSHOP, HOTEL/RESORT/SPA)
- ✓ Transfer workflow (Admin→Workshop→Warehouse→Customer)
- ✓ **SCALE-02**: Connection pooling tối ưu cho concurrent scans — Phase 06
- ✓ **REDIS-01, REDIS-02, REDIS-03**: Redis infrastructure (docker-compose, CacheModule, /health) — Phase 07
- ✓ **CACHE-01, CACHE-02, CACHE-03**: Cache integration for Tags (cache-aside, 5-min TTL) — Phase 08
- ✓ **CACHE-04, CACHE-05, CACHE-06**: Cache integration for Inventory Summary (30-sec TTL + jitter) — Phase 09

### Active

- [ ] **SCALE-03**: Batch scan buffer — gửi nhiều tag cùng lúc
- [ ] **SCALE-04**: Service boundaries — tách logic modules rõ ràng

### Out of Scope

- Database-per-service (giai đoạn 3 — khi scale >1000 users)
- Eventual consistency model
- Message queue cho cross-service sync
- Xác nhận giao hàng từ khách (mở rộng sau)
- Báo cáo doanh thu, chi phí
- Quản lý nhân viên xưởng

## Context

- **Tech stack:** NestJS backend (Prisma + PostgreSQL), Next.js web, React Native mobile
- **Trạng thái:** Development — đã có database với dữ liệu mẫu
- **Scale hiện tại:** <100 users, scan nhiều tag/người, multi-warehouse
- **Real-time requirement:** Bắt buộc — inventory phải update ngay khi scan

## Constraints

- **Tech**: Không đổi tech stack — tiếp tục NestJS + Prisma + PostgreSQL
- **Data**: Dữ liệu hiện có cần giữ — migration phải tương thích
- **Scanner**: Mobile app dùng máy quét RFID qua BLE — flow phải verify bằng quét thực tế
- **Real-time**: Không chấp nhận delayed consistency cho inventory

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Redis cache trước microservice | Giải quyết 80% bottleneck trước khi phức tạp hóa | — Pending |
| Shared DB vẫn là primary | Real-time requirement bắt buộc shared DB | — Pending |
| Microservice chỉ khi >1000 users | Tránh over-engineering quá sớm | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-03-27 after milestone v1.1 started*
