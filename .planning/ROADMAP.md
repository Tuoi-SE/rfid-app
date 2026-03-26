# Roadmap

## Phase 1: Location Infrastructure

**Goal:** Tạo Location model — nền tảng cho mọi tracking

**Requirement IDs:** INVENTORY-01 (Location foundation)

**Plans:** 1 plan

Plans:
- [x] 01-PLAN.md — Thêm Location model với LocationType enum, cập nhật Tag với locationId FK, seed 5 locations (ADMIN, 2 WAREHOUSE, 2 WORKSHOP)

## Phase 2: Workshop Management

**Goal:** CRUD xưởng + Transfer Admin→Workshop

**Requirement IDs:** WORKSHOP-01, TAGS-02

**Plans:** 2 plans

Plans:
- [ ] 02-PLAN.md — Transfer model và API (2-step workflow: Admin tạo PENDING → Workshop confirm COMPLETED)
- [ ] 02-02-PLAN.md — Location CRUD API với filter type=WORKSHOP (Workshop management)

## Phase 3: Warehouse Transfer

**Goal:** Transfer Workshop→Warehouse với scan verify

**Requirement IDs:** TBD

## Phase 4: Customer Management

**Goal:** CRUD khách hàng (khách sạn/resort)

**Requirement IDs:** TBD

## Phase 5: Outbound Flow

**Goal:** Xuất kho → khách hàng, track đã xuất

**Requirement IDs:** TBD
