# Hệ Thống Theo Dõi Tài Sản RFID — Software Requirements Specification

## Document Metadata

| Field | Value |
|-------|-------|
| Document Type | Software Requirements Specification (SRS) |
| Product Name | RFID Asset Tracking System |
| Domain | Theo dõi tài sản RFID cho chuỗi cung ứng hàng may mặc |
| Version | 1.1 |
| Status | Working Draft |
| Last Updated | 2026-04-02 |
| Writing Style | Hybrid SRS |

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-04-02 | Bản SRS IEEE 830 ban đầu cho hệ thống RFID asset tracking |
| 1.1 | 2026-04-02 | Viết lại theo khung Hybrid, chuẩn hóa role model `SUPER_ADMIN`, `TAGGING_STAFF`, `WAREHOUSE_STAFF`, gom lại business rules, NFR và appendices |

## Mục lục

- [Executive Summary](#executive-summary)
- [1. Introduction](#1-introduction)
- [2. Overall Description](#2-overall-description)
- [3. Business Rules & Data](#3-business-rules--data)
- [4. Functional Requirements](#4-functional-requirements)
- [5. Non-Functional Requirements](#5-non-functional-requirements)
- [6. System Constraints](#6-system-constraints)
- [7. System Evolution](#7-system-evolution)
- [8. Verification & Acceptance](#8-verification--acceptance)
- [Appendices](#appendices)

---

## Executive Summary

Hệ thống Theo Dõi Tài Sản RFID là một nền tảng single-tenant giúp doanh nghiệp sản xuất và phân phối hàng may mặc theo dõi vị trí, trạng thái và lịch sử của từng tài sản RFID theo thời gian thực. Hệ thống giải quyết các vấn đề cốt lõi của kiểm kê thủ công: mất nhiều thời gian, sai số cao, khó truy vết thất thoát và thiếu bằng chứng xác nhận khi bàn giao hàng giữa các địa điểm.

Giải pháp kết hợp Web Dashboard, Mobile App, RFID reader kết nối BLE, REST API, WebSocket live view và cơ chế audit trail. Mô hình vận hành gồm ba vai trò nội bộ: `SUPER_ADMIN` điều phối và quản trị hệ thống; `TAGGING_STAFF` xử lý gắn tag tại location `ADMIN`; `WAREHOUSE_STAFF` vận hành kho, xác nhận chuyển giao và kiểm kê. Mục tiêu của tài liệu này là cung cấp một đặc tả SRS đủ chặt để BA, Dev, QA và stakeholder có thể dùng chung như nguồn sự thật cho phạm vi, luồng nghiệp vụ, luật nghiệp vụ, interface và tiêu chí nghiệm thu.

---

## 1. Introduction

### 1.1 Product Purpose

Mục đích của hệ thống là cung cấp một nền tảng trực quan, có thể audit và đủ khả năng mở rộng để:

- Gắn RFID tag cho tài sản và liên kết với product tương ứng
- Ghi nhận vòng đời tài sản từ khu gắn tag `ADMIN` đến `WORKSHOP`, `WAREHOUSE` và khách hàng
- Xác nhận chuyển giao bằng scan thay vì đếm tay
- Theo dõi quét live trên web và mobile
- Lưu lịch sử bất biến cho từng tài sản và từng hành động người dùng

### 1.2 Intended Audience

Tài liệu này dành cho:

- Product Owner / Business Analyst
- Backend, Web, Mobile Developers
- QA / Test Engineers
- Technical Lead / Solution Architect
- Stakeholder nghiệp vụ phía doanh nghiệp

### 1.3 Project Scope

#### In Scope

| Module | Description |
|--------|-------------|
| Authentication & RBAC | JWT login, refresh token, role-based access control |
| User Management | Quản lý user nội bộ theo role `SUPER_ADMIN`, `TAGGING_STAFF`, `WAREHOUSE_STAFF` |
| Product & Asset Tagging | Tra cứu product, tạo asset, gán RFID tag, bulk assign |
| Location Management | CRUD location cho `ADMIN`, `WORKSHOP`, `WAREHOUSE`, `HOTEL`, `RESORT`, `SPA` |
| Transfer Management | Chuyển giao `WORKSHOP_TO_WAREHOUSE` và `WAREHOUSE_TO_CUSTOMER` |
| Real-Time Scanning | BLE scan từ mobile, live view trên web qua WebSocket |
| Inventory Sessions | Kiểm kê, phát hiện missing, lưu session, offline sync |
| Audit & History | Asset events, activity logs, history timeline |
| API & Integration Surface | REST API nội bộ và WebSocket cho live monitoring |

#### Out of Scope

| Module | Rationale |
|--------|-----------|
| Customer portal | Khách hàng không sử dụng hệ thống trong v1 |
| Multi-tenant SaaS | Chỉ phục vụ một doanh nghiệp trên mỗi instance |
| Billing / Subscription | Không thuộc phạm vi vận hành RFID nội bộ |
| QR fallback | RFID là phương thức chính |
| Laundry lifecycle tracking | Không trong vòng đời v1 |
| ERP integration | Không tích hợp hệ ERP bên ngoài trong v1 |
| IoT sensor ingestion | Không lấy dữ liệu tự động từ sensor ngoài RFID reader |

### 1.4 Definitions & Acronyms

| Term | Definition |
|------|------------|
| Asset | Tài sản vật lý được gắn RFID tag |
| EPC | Electronic Product Code, mã định danh duy nhất của RFID tag |
| RFID | Radio-Frequency Identification |
| BLE | Bluetooth Low Energy |
| Location | Địa điểm vận hành: `ADMIN`, `WORKSHOP`, `WAREHOUSE`, `HOTEL`, `RESORT`, `SPA` |
| Transfer | Phiên chuyển giao tài sản giữa các địa điểm |
| Session | Phiên quét RFID để kiểm kê hoặc theo dõi |
| RBAC | Role-Based Access Control |
| Single-tenant | Một instance hệ thống phục vụ một doanh nghiệp |

### 1.5 References

| Reference | Description |
|-----------|-------------|
| ISO/IEC 29161 | RFID data protocol and item identification practices |
| IEEE 830 | Recommended practice for Software Requirements Specifications |
| OWASP REST Security | Security practices for REST APIs |
| [`docs/PLAN-super-admin-role.md`](./PLAN-super-admin-role.md) | Ghi chú thiết kế role model `SUPER_ADMIN` |

---

## 2. Overall Description

### 2.1 System Architecture Overview

| Component | Technology / Runtime | Responsibility |
|-----------|----------------------|----------------|
| Web Dashboard | Next.js 16, React 19, Tailwind 4 | Theo dõi live view, quản lý dữ liệu, dashboard, admin tools theo RBAC |
| Mobile App | React Native + Expo SDK 55 | Kết nối reader, scan tag, kiểm kê, hỗ trợ tagging và warehouse operations |
| Backend API | NestJS 11, Node.js 20 | REST API, auth, RBAC, business rules, transfer workflow |
| Real-Time Layer | Socket.IO / WebSocket | Broadcast live scan, dashboard updates, transfer updates |
| Database | PostgreSQL 15+ via Prisma | Lưu user, asset, transfer, session, event, activity logs |
| Cache | Redis 7+ | Cache, session support, transient state |
| RFID Reader | ST-H103 UHF (default) qua BLE | Quét EPC/RSSI và trả dữ liệu về mobile |

### 2.2 Context Diagram

**PlantUML source**
- [`rfid-context-diagram.puml`](./diagrams/rfid-context-diagram.puml)

![Figure 2-1. Context Diagram](./images/diagrams/rfid-context-diagram.png)

### 2.3 User Classes and Actors

| Actor / Role | Primary Responsibility | Channels |
|--------------|------------------------|----------|
| `SUPER_ADMIN` | Quản lý users/roles, audit, điều phối batch tagging, tạo/hủy transfer, xem dashboard tổng hợp | Web |
| `TAGGING_STAFF` | Gắn tag tại location `ADMIN`, tạo/assign asset, theo dõi quét live | Web, Mobile |
| `WAREHOUSE_STAFF` | Scan verify, kiểm kê, confirm transfer, theo dõi tồn kho và live view | Web, Mobile |
| RFID Reader | Cung cấp EPC + RSSI qua BLE | Mobile integration |
| Customer Location | Điểm nhận hàng cuối, không phải user trực tiếp của hệ thống | No direct access |

### 2.4 Business Processes

#### BP-01: Batch Tagging tại location `ADMIN`

1. `SUPER_ADMIN` tạo và phân ca nhiều tài khoản `TAGGING_STAFF` nếu batch lớn.
2. `TAGGING_STAFF` tra cứu product và gắn RFID tag cho tài sản tại `ADMIN`.
3. Hệ thống tạo asset record, kiểm tra EPC duy nhất và ghi audit theo `userId`.

#### BP-02: Bàn giao xuống `WORKSHOP`

1. Tài sản đã gắn tag được bàn giao vật lý xuống `WORKSHOP`.
2. `WORKSHOP` tiếp nhận để tiếp tục xử lý nghiệp vụ sản xuất / đóng gói.

#### BP-03: Chuyển giao `WORKSHOP_TO_WAREHOUSE`

1. `SUPER_ADMIN` tạo transfer ở trạng thái `PENDING`.
2. `WAREHOUSE_STAFF` scan verify tại kho đích.
3. Chỉ khi tất cả item đã được quét, transfer mới được confirm.

#### BP-04: Quản lý kho và kiểm kê

1. Kho theo dõi tài sản đã nhận.
2. `WAREHOUSE_STAFF` thực hiện inventory sessions.
3. Kết quả quét được đẩy live lên web cho các user nội bộ theo RBAC.

#### BP-05: Xuất hàng `WAREHOUSE_TO_CUSTOMER`

1. `SUPER_ADMIN` tạo transfer từ `WAREHOUSE` đến location khách hàng.
2. Luồng này hoàn tất ngay trong một bước.
3. Asset chuyển sang `OUT_OF_STOCK` và location đích là customer.

#### Transfer Workflow State Model

```text
WORKSHOP_TO_WAREHOUSE

START --SUPER_ADMIN creates--> PENDING --WAREHOUSE_STAFF confirms--> COMPLETED
PENDING --SUPER_ADMIN cancels--> CANCELLED

WAREHOUSE_TO_CUSTOMER

START --SUPER_ADMIN creates--> COMPLETED
```

### 2.5 Assumptions & Dependencies

| Assumption / Dependency | Impact |
|-------------------------|--------|
| RFID tags tuân thủ EPCglobal Gen2 | Bảo đảm tương thích reader |
| Reader có BLE interface | Mobile app giao tiếp trực tiếp với phần cứng |
| Network có thể gián đoạn | Mobile phải hỗ trợ queue + sync |
| EPC là duy nhất toàn hệ thống | Duplicate EPC làm sai lệch tracking |
| Hệ thống triển khai single-tenant | Không cần data isolation giữa nhiều tenant trong v1 |

---

## 3. Business Rules & Data

### 3.1 Business Rules

#### 3.1.1 Authentication & Security

- Mọi user nội bộ đều đăng nhập qua JWT access token + refresh token.
- Password phải được hash bằng bcrypt.
- Login phải có rate limiting.
- Mọi request bảo vệ bởi auth guard, trừ route public được đánh dấu rõ.

#### 3.1.2 Role-Based Access Control & Web Access

Tất cả role nội bộ có thể truy cập web; RBAC quyết định họ được xem hoặc thao tác gì.

| Capability | SUPER_ADMIN | TAGGING_STAFF | WAREHOUSE_STAFF |
|-----------|-------------|---------------|-----------------|
| Web dashboard / live view | Yes | Yes | Yes |
| User management | Yes | No | No |
| Activity logs | Yes | No | No |
| Product / asset lookup | Yes | Yes | Yes |
| Asset create / assign | Yes | Yes | Read only unless explicitly granted |
| Transfer create / cancel | Yes | No | No |
| Transfer confirm | Yes | No | Yes |
| Inventory sessions | Yes | Limited | Yes |

#### 3.1.3 Tagging & Asset Registration

- EPC phải unique trong toàn hệ thống.
- Chỉ asset hợp lệ mới được assign vào product.
- Tất cả thao tác gắn tag phải được audit theo `userId`.
- Nhiều `TAGGING_STAFF` có thể xử lý cùng một batch, nhưng event và activity log phải tách theo từng người thao tác.

#### 3.1.4 Transfer & Warehouse Validation

- `WORKSHOP_TO_WAREHOUSE`: source phải là `WORKSHOP`, destination phải là `WAREHOUSE`.
- `WAREHOUSE_TO_CUSTOMER`: source phải là `WAREHOUSE`, destination phải là location khách hàng.
- Chỉ `SUPER_ADMIN` được tạo hoặc hủy transfer.
- Chỉ `WAREHOUSE_STAFF` mới được confirm receipt ở workflow 2 bước.
- Confirm chỉ hợp lệ khi tất cả transfer items đã có `scannedAt`.

#### 3.1.5 Real-Time Monitoring & Sessions

- Mobile scan phải có phản hồi gần real-time.
- Web live view phải nhận được dữ liệu quét qua WebSocket.
- Inventory sessions phải hỗ trợ lưu offline và đồng bộ lại khi có mạng.
- Hệ thống có thể phát hiện asset `MISSING` dựa trên chênh lệch giữa kỳ vọng và scan session hiện tại.

#### 3.1.6 Data Deletion, Retention & Auditability

- Asset events là immutable, append-only.
- Activity logs không được xóa bởi user nghiệp vụ.
- Xóa dữ liệu nghiệp vụ dùng soft delete khi phù hợp.
- Activity logs lưu tối thiểu 24 tháng; asset events lưu lâu dài.

### 3.2 Logical Data Model / ERD

```text
┌─────────────────────────────────────────────────────────────┐
│                      CORE ENTITIES                         │
│                                                             │
│  User ──────┐                                              │
│             ├── createdById ─────────────┐                 │
│  Asset ─────┼── assetId ─────┐           │                 │
│             │                │           │                 │
│  Product ◄──┘                │           │                 │
│                               ▼           ▼                 │
│  Location ◄──── sourceId / destinationId  Transfer         │
│      ▲                              │                      │
│      └──────────── locationId ◄─────┘                      │
│                                                             │
│  AssetEvent(assetId, userId, locationId, type, data)       │
│  ActivityLog(userId, entity, action, details)              │
│  TransferItem(transferId, assetId, scannedAt)              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Core Entity Definitions

#### 3.3.1 Users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | User identifier |
| username | String | Unique | Login username |
| password | String | Not Null | Bcrypt hashed password |
| role | Enum | Not Null | `SUPER_ADMIN`, `TAGGING_STAFF`, `WAREHOUSE_STAFF` |
| isActive | Boolean | Default true | Soft-active flag |
| createdAt | DateTime | Not Null | Creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

#### 3.3.2 Assets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Asset identifier |
| epc | String | Unique | RFID EPC |
| name | String | Nullable | Optional asset display name |
| status | Enum | Not Null | `IN_STOCK`, `OUT_OF_STOCK`, `IN_TRANSIT`, `MISSING` |
| productId | UUID | FK -> Product, Nullable | Related product |
| locationId | UUID | FK -> Location, Nullable | Current location |
| createdAt | DateTime | Not Null | Creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

#### 3.3.3 Locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Location identifier |
| name | String | Not Null | Human-readable name |
| code | String | Unique | Short code |
| type | Enum | Not Null | `ADMIN`, `WORKSHOP`, `WAREHOUSE`, `HOTEL`, `RESORT`, `SPA` |
| address | String | Nullable | Physical address |
| isActive | Boolean | Default true | Soft-active flag |
| createdAt | DateTime | Not Null | Creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

#### 3.3.4 Products & Categories

| Entity | Key Fields | Notes |
|--------|------------|-------|
| Product | `id`, `name`, `sku`, `categoryId` | Product lookup for tagging and inventory |
| Category | `id`, `name`, `code`, `description` | Grouping for product catalog |

#### 3.3.5 Transfers & TransferItems

| Entity | Key Fields | Notes |
|--------|------------|-------|
| Transfer | `id`, `code`, `type`, `status`, `sourceId`, `destinationId`, `createdById`, `completedAt` | Transfer header |
| TransferItem | `id`, `transferId`, `assetId`, `scannedAt` | Per-asset validation within transfer |

#### 3.3.6 AssetEvents & ActivityLogs

| Entity | Key Fields | Notes |
|--------|------------|-------|
| AssetEvent | `assetId`, `type`, `userId`, `locationId`, `data`, `timestamp` | Immutable asset lifecycle events |
| ActivityLog | `action`, `entity`, `entityId`, `details`, `userId`, `timestamp` | HTTP mutation and administrative audit trail |

### 3.4 Indexing, Retention & Auditability

#### 3.4.1 Indexing

| Table | Columns | Type | Purpose |
|-------|---------|------|---------|
| assets | epc | Unique | Fast EPC lookup |
| assets | status | Index | Filter by status |
| assets | locationId | Index | Filter by location |
| assets | productId | Index | Filter by product |
| asset_events | assetId, timestamp | Composite | Asset history query |
| transfers | status | Index | Filter by status |
| transfers | sourceId, destinationId | Composite | Location-based query |
| activity_logs | userId, timestamp | Composite | User audit history |

#### 3.4.2 Retention

| Data | Retention | Policy |
|------|-----------|--------|
| Activity logs | 24 months | Archive older records |
| Asset events | Permanent | Full audit trail |
| Soft-deleted records | 30 days minimum | Grace period before purge |

---

## 4. Functional Requirements

### 4.1 Feature Prioritization

| Feature | Priority | Notes |
|---------|----------|-------|
| Authentication & RBAC | Must | Core access control |
| User & role management | Must | Needed for `SUPER_ADMIN` operations |
| Product / category lookup | Must | Required before tagging |
| Asset registration & tagging | Must | Core business value |
| Location management | Must | Needed for routing and traceability |
| Workshop -> Warehouse transfer | Must | Core 2-step verification workflow |
| Warehouse -> Customer dispatch | Must | Core outbound flow |
| Real-time scan & web live view | Must | Core tracking capability |
| Inventory sessions & missing detection | Must | Core warehouse operations |
| Asset history & activity logs | Must | Traceability and audit |
| Find asset by radar | Should | Operational support feature |
| Bulk report export / import | Could | Useful but not core v1 blocker |

### 4.2 Overall Use Case Diagram

**PlantUML source**
- [`rfid-usecase-overview.puml`](./diagrams/rfid-usecase-overview.puml)

![Figure 4-1. Use Case Overview](./images/diagrams/rfid-usecase-overview.png)

### 4.3 Decomposed Use Case Diagrams

#### 4.3.1 UC-001 Tagging & Asset Registration

**PlantUML source**
- [`uc-001-gan-rfid-tag-cho-san-pham-moi.puml`](./diagrams/uc-001-gan-rfid-tag-cho-san-pham-moi.puml)

![Figure 4-2. UC-001](./images/diagrams/uc-001-gan-rfid-tag-cho-san-pham-moi.png)

#### 4.3.2 UC-002 Workshop to Warehouse Transfer

**PlantUML source**
- [`uc-002-chuyen-hang-tu-xuong-ve-kho.puml`](./diagrams/uc-002-chuyen-hang-tu-xuong-ve-kho.puml)

![Figure 4-3. UC-002](./images/diagrams/uc-002-chuyen-hang-tu-xuong-ve-kho.png)

#### 4.3.3 UC-003 Warehouse to Customer Dispatch

**PlantUML source**
- [`uc-003-xuat-hang-cho-khach-hang.puml`](./diagrams/uc-003-xuat-hang-cho-khach-hang.puml)

![Figure 4-4. UC-003](./images/diagrams/uc-003-xuat-hang-cho-khach-hang.png)

#### 4.3.4 UC-004 Daily Inventory & Live Monitoring

**PlantUML source**
- [`uc-004-kiem-ke-hang-ngay.puml`](./diagrams/uc-004-kiem-ke-hang-ngay.puml)

![Figure 4-5. UC-004](./images/diagrams/uc-004-kiem-ke-hang-ngay.png)

### 4.4 Use Case Specifications

#### 4.4.1 UC-001: Gắn RFID tag cho sản phẩm mới

| Field | Description |
|-------|-------------|
| Primary Actor | `TAGGING_STAFF` |
| Supporting Actor | RFID Reader |
| Trigger | Cần gắn tag cho một batch tài sản mới tại `ADMIN` |
| Preconditions | User đã đăng nhập; product tồn tại; reader kết nối thành công |
| Main Flow | 1. Tra cứu product.<br>2. Bắt đầu scan tag.<br>3. Hệ thống nhận EPC/RSSI.<br>4. User xác nhận assign asset vào product.<br>5. Hệ thống lưu asset, event và activity log. |
| Alternate / Error Flow | EPC trùng -> từ chối tạo asset.<br>Reader mất kết nối -> yêu cầu reconnect.<br>Product không tồn tại -> không cho assign. |
| Postconditions | Asset hợp lệ được tạo/assign; thao tác được audit theo `userId`. |

#### 4.4.2 UC-002: Chuyển hàng từ xưởng về kho

| Field | Description |
|-------|-------------|
| Primary Actors | `SUPER_ADMIN`, `WAREHOUSE_STAFF` |
| Trigger | Cần nhận lô hàng từ `WORKSHOP` về `WAREHOUSE` |
| Preconditions | Transfer chưa tồn tại ở trạng thái hoàn tất; asset đang ở source location |
| Main Flow | 1. `SUPER_ADMIN` tạo transfer `PENDING`.<br>2. `WAREHOUSE_STAFF` scan verify từng asset.<br>3. Hệ thống ghi `scannedAt` cho transfer items.<br>4. `WAREHOUSE_STAFF` confirm transfer.<br>5. Hệ thống cập nhật location và status. |
| Alternate / Error Flow | Asset không ở source -> từ chối tạo transfer.<br>Thiếu item chưa scan -> không cho confirm.<br>`SUPER_ADMIN` có thể cancel khi transfer còn `PENDING`. |
| Postconditions | Transfer `COMPLETED` hoặc `CANCELLED`; asset history được cập nhật. |

#### 4.4.3 UC-003: Xuất hàng cho khách hàng

| Field | Description |
|-------|-------------|
| Primary Actor | `SUPER_ADMIN` |
| Trigger | Cần xuất hàng từ `WAREHOUSE` cho location khách hàng |
| Preconditions | Asset đang `IN_STOCK` tại source warehouse |
| Main Flow | 1. Tạo transfer `WAREHOUSE_TO_CUSTOMER`.<br>2. Hệ thống tự hoàn tất transfer.<br>3. Asset được cập nhật `OUT_OF_STOCK` và location đích là customer. |
| Alternate / Error Flow | Asset không ở source hoặc không `IN_STOCK` -> từ chối tạo transfer. |
| Postconditions | Transfer `COMPLETED`; asset được đánh dấu đã xuất. |

#### 4.4.4 UC-004: Kiểm kê hàng ngày

| Field | Description |
|-------|-------------|
| Primary Actor | `WAREHOUSE_STAFF` |
| Supporting Actors | RFID Reader, authenticated web clients |
| Trigger | Bắt đầu phiên kiểm kê hoặc theo dõi live scanning |
| Preconditions | Reader kết nối; user đã đăng nhập; session hợp lệ |
| Main Flow | 1. Mở màn hình scan, hệ thống auto-start.<br>2. Mobile nhận EPC/RSSI.<br>3. Web live view nhận update qua WebSocket.<br>4. Session được lưu.<br>5. Hệ thống phát hiện missing nếu có. |
| Alternate / Error Flow | Offline -> queue scan trong local storage.<br>BLE lỗi -> retry / reconnect.<br>Queue đầy -> cảnh báo user. |
| Postconditions | Session được đồng bộ; inventory summary và events được cập nhật. |

### 4.5 Functional Requirement Catalogue

| ID | Requirement | Actors | Outcome |
|----|-------------|--------|---------|
| FR-001 | User authentication and token management | All internal users | Login/logout/refresh hoạt động an toàn |
| FR-002 | User and role administration | `SUPER_ADMIN` | Quản lý tài khoản và phân quyền |
| FR-003 | Product and category lookup | `SUPER_ADMIN`, `TAGGING_STAFF`, `WAREHOUSE_STAFF` | Tìm product để tagging và tra cứu |
| FR-004 | Asset registration and EPC uniqueness | `SUPER_ADMIN`, `TAGGING_STAFF` | Asset mới được tạo với EPC hợp lệ |
| FR-005 | Bulk asset assignment to product | `SUPER_ADMIN`, `TAGGING_STAFF` | Asset gắn đúng product, có audit |
| FR-006 | Location management | `SUPER_ADMIN` and allowed roles by RBAC | Quản lý location phục vụ routing |
| FR-007 | Transfer creation and cancellation | `SUPER_ADMIN` | Tạo/hủy transfer đúng business rules |
| FR-008 | Transfer confirmation | `WAREHOUSE_STAFF` | Nhận hàng và hoàn tất transfer |
| FR-009 | Real-time scanning and web live monitoring | All internal users by RBAC | Live scan hiển thị trên mobile và web |
| FR-010 | Inventory sessions and missing detection | `WAREHOUSE_STAFF` | Kiểm kê và phát hiện missing |
| FR-011 | Asset history and activity log | System, `SUPER_ADMIN` | Full traceability and audit |
| FR-012 | Find asset by radar / RSSI | Operational roles | Hỗ trợ tìm tài sản cụ thể |

---

## 5. Non-Functional Requirements

### 5.1 Security

| ID | Requirement | Target / Rule |
|----|-------------|---------------|
| NFR-SEC-01 | JWT access token | 15-minute expiry, chứa userId và role |
| NFR-SEC-02 | Refresh token | 7-day expiry, stored hashed, revocable |
| NFR-SEC-03 | Password storage | bcrypt với cost phù hợp production |
| NFR-SEC-04 | Role-based access | CASL / policy-based authorization per role |
| NFR-SEC-05 | Transport security | HTTPS/TLS 1.2+ bắt buộc ở production |
| NFR-SEC-06 | Input validation | DTO validation cho tất cả endpoint |
| NFR-SEC-07 | Auditability | Tất cả mutation quan trọng phải lưu userId, entity, action |

### 5.2 Performance & Capacity

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Scan-to-display latency | < 1s |
| NFR-PERF-02 | Simple read API p95 | < 200ms |
| NFR-PERF-03 | Filtered list API p95 | < 300ms |
| NFR-PERF-04 | WebSocket broadcast latency | < 100ms |
| NFR-PERF-05 | Web dashboard load | < 2s FCP |
| NFR-PERF-06 | Mobile cold start | < 3s |
| NFR-PERF-07 | Max assets per instance | 100,000 |
| NFR-PERF-08 | Max locations per instance | 1,000 |
| NFR-PERF-09 | Max concurrent users | 100 |

### 5.3 Scalability & Modifiability

| ID | Requirement | Expectation |
|----|-------------|-------------|
| NFR-SCAL-01 | Deployment model | Single instance đủ cho v1 single-tenant |
| NFR-SCAL-02 | Reader extensibility | Cho phép thêm reader adapter khác ngoài ST-H103 |
| NFR-SCAL-03 | Domain modularity | Backend phải tách module theo domain nghiệp vụ |
| NFR-SCAL-04 | API evolution | Có thể mở rộng endpoint mà không phá vỡ core workflows |
| NFR-SCAL-05 | Role evolution | Có thể thay đổi ma trận quyền mà không phải viết lại toàn hệ thống |

### 5.4 Usability & Maintainability

| ID | Requirement | Expectation |
|----|-------------|-------------|
| NFR-USE-01 | Role-aware UI | Web và mobile hiển thị tính năng theo RBAC |
| NFR-USE-02 | Scan feedback | User nhìn thấy EPC, RSSI, product name theo thời gian thực |
| NFR-USE-03 | Actionable errors | Lỗi phải có message rõ và hướng recovery |
| NFR-MAIN-01 | Maintainable code structure | Backend, web, mobile tách theo feature/domain |
| NFR-MAIN-02 | Interface documentation | API phải có tài liệu đủ cho tích hợp nội bộ |

### 5.5 Reliability & Availability

| ID | Requirement | Target / Rule |
|----|-------------|---------------|
| NFR-REL-01 | System uptime | > 99.5% |
| NFR-REL-02 | Transaction integrity | 0% data loss trong workflow nghiệp vụ |
| NFR-REL-03 | Cache failure fallback | Bypass cache, fallback DB |
| NFR-REL-04 | Offline support | Mobile queue + sync |
| NFR-REL-05 | Graceful shutdown | < 30s |

---

## 6. System Constraints

### 6.1 Technical Constraints

| Constraint | Detail |
|-----------|--------|
| Backend stack | NestJS 11, Node.js 20 LTS |
| Web stack | Next.js 16, React 19, Tailwind 4 |
| Mobile stack | React Native + Expo SDK 55 |
| Data layer | PostgreSQL 15+, Prisma ORM |
| Cache layer | Redis 7+ |
| Real-time transport | WebSocket / Socket.IO |
| Hardware baseline | ST-H103 UHF reader qua BLE |
| Deployment model | Single-tenant on-premise hoặc single-tenant cloud |

### 6.2 Compliance & Operational Constraints

| Constraint | Detail |
|-----------|--------|
| Audit trail mandatory | Mọi mutation quan trọng phải truy vết được theo user |
| RFID-first operation | Không thiết kế fallback QR như workflow chính |
| Customer portal out of scope | Customer chỉ là location đích, không phải actor trực tiếp |
| No billing / subscription | Không có financial subsystem trong v1 |
| No multi-tenant segmentation | Không có tenant isolation trong v1 |
| No laundry lifecycle | Không theo dõi vòng đời giặt / tái sử dụng trong v1 |

---

## 7. System Evolution

### 7.1 Near-Term Roadmap

| Initiative | Goal |
|-----------|------|
| Role-specific web views | Tối ưu dashboard/live view theo từng role |
| Batch tagging orchestration | Phân công batch tagging tốt hơn cho nhiều account |
| Missing / exception alerts | Cảnh báo sớm khi scan thiếu hoặc có lệch trạng thái |
| Import / export reports | Hỗ trợ Excel/CSV cho báo cáo nội bộ |

### 7.2 Medium-Term Extensions

| Initiative | Goal |
|-----------|------|
| Reader adapter expansion | Hỗ trợ nhiều loại RFID reader hơn |
| Workshop execution workflows | Làm rõ và số hóa sâu hơn giai đoạn `WORKSHOP` |
| Customer acknowledgement support | Hỗ trợ xác nhận giao nhận nâng cao cho khách hàng nội bộ / đối tác |
| Advanced analytics | Trend inventory, anomaly detection, operational KPIs |

### 7.3 Explicitly Deferred Initiatives

| Initiative | Status |
|-----------|--------|
| Multi-tenant SaaS | Deferred |
| Customer self-service portal | Deferred |
| Laundry lifecycle tracking | Deferred |
| IoT sensor integration | Deferred |
| Microservice architecture split | Deferred until scale / team / ops complexity justifies it |

---

## 8. Verification & Acceptance

### 8.1 Core Acceptance Criteria

| ID | Criteria | Test Method | Pass Condition |
|----|----------|-------------|----------------|
| AC-01 | Asset được tạo với EPC | POST /api/assets -> GET | Asset tồn tại |
| AC-02 | Asset được gán cho product | PATCH /api/assets/assign -> GET asset | `asset.productId` được set |
| AC-03 | Transfer WORKSHOP -> WAREHOUSE hoàn thành 2 bước | Create -> scan -> confirm | `status = COMPLETED` |
| AC-04 | Transfer WAREHOUSE -> CUSTOMER hoàn thành 1 bước | Create transfer | `status = COMPLETED` ngay |
| AC-05 | Confirm thất bại nếu chưa scan đủ | Confirm với thiếu item | Trả về lỗi validation |
| AC-06 | Asset history chứa đủ events | GET /api/assets/:id/history | Timeline đầy đủ |
| AC-07 | Live scan lên web trong thời gian thực | Scan -> web listener | Client nhận update < 1s |
| AC-08 | Cả 3 role truy cập web đúng theo RBAC | Login bằng 3 role | Route/action hiển thị đúng quyền |
| AC-09 | `WAREHOUSE_STAFF` không thể hủy transfer | Gọi cancel endpoint | 403 Forbidden |
| AC-10 | `SUPER_ADMIN` xem được activity logs | GET /api/activity-logs | Có dữ liệu hợp lệ |
| AC-11 | Nhiều `TAGGING_STAFF` cùng xử lý batch vẫn audit đúng | Hai user tagging cùng batch | Event/log lưu đúng `userId` |

### 8.2 Security & Quality Verification

| ID | Criteria | Test | Pass Condition |
|----|----------|------|----------------|
| SC-01 | Password hashed | DB inspection | Không có plain text |
| SC-02 | JWT expiry enforced | Chờ quá hạn | 401 returned |
| SC-03 | Refresh token revocable | Logout -> reuse token | 401 returned |
| SC-04 | Rate limit enforced | Spam request | 429 returned |
| QC-01 | Offline queue sync | Mất mạng -> khôi phục | Queue được sync lại |
| QC-02 | Cache failure fallback | Disable Redis | Hệ thống vẫn đọc từ DB |

---

## Appendices

### Appendix A. Interface Reference

#### A.1 Client Surfaces

##### Web Dashboard

| Screen | Route | Access | Purpose |
|--------|-------|--------|---------|
| Dashboard | `/dashboard` | All internal roles | Tổng quan hoạt động |
| Live Scan | `/tags/live` | All internal roles | Theo dõi quét live |
| Assets | `/assets` | All internal roles | Tra cứu tài sản |
| Locations | `/locations` | RBAC | Quản lý / tra cứu location |
| Transfers | `/transfers` | RBAC | Quản lý / tra cứu transfer |
| Users | `/users` | `SUPER_ADMIN` | Quản lý users |
| Activity Logs | `/activity-logs` | `SUPER_ADMIN` | Audit log viewer |

##### Mobile App

| Screen | Purpose |
|--------|---------|
| `KetNoiScreen` | Kết nối RFID reader qua BLE |
| `QuetTheScreen` | Quét RFID realtime và kiểm kê |
| `CapTheScreen` | Tagging tại location `ADMIN` |
| `GiaoDichScreen` | Xem và thao tác các giao dịch |
| `TimTheScreen` | Tìm tài sản theo RSSI |

#### A.2 Hardware Interface: ST-H103 UHF RFID Reader

| Spec | Value |
|------|-------|
| Connection | BLE |
| Service UUID | `0000FFE0-0000-1000-8000-00805F9B34FB` |
| Write Characteristic | `0000FFE3-...` |
| Notify Characteristic | `0000FFE4-...` |
| MTU Size | 512 bytes |
| Protocol | BB Protocol + CF Protocol |
| Buffer | Circular 8192 bytes |

**BB Protocol Packet Format**

```text
[0xBB] [Type] [Cmd] [LenH] [LenL] [Payload...] [Checksum] [0x7E]
```

| Command | Hex Bytes | Purpose |
|---------|-----------|---------|
| START_INVENTORY | `BB 00 27 00 03 22 FF FF 4A 7E` | Bắt đầu quét liên tục |
| STOP_INVENTORY | `BB 00 28 00 00 28 7E` | Dừng quét |
| SINGLE_INVENTORY | `BB 00 22 00 00 22 7E` | Quét một lần |

#### A.3 REST API Summary

| Module | Method | Endpoint | Auth | Purpose |
|--------|--------|----------|------|---------|
| Auth | POST | `/api/auth/login` | Public | Login |
| Auth | POST | `/api/auth/refresh` | Public | Refresh token |
| Auth | POST | `/api/auth/logout` | Auth | Logout |
| Users | GET/POST | `/api/users` | `SUPER_ADMIN` | User listing / creation |
| Users | GET/PATCH/DELETE | `/api/users/:id` | `SUPER_ADMIN` | User management |
| Products | GET | `/api/products` | Auth | Product lookup |
| Assets | GET | `/api/assets` | Auth | Asset list |
| Assets | GET | `/api/assets/:id` | Auth | Asset detail |
| Assets | GET | `/api/assets/epc/:epc` | Auth | Asset by EPC |
| Assets | GET | `/api/assets/:id/history` | Auth | Asset history |
| Assets | POST | `/api/assets` | Auth | Create asset |
| Assets | PATCH | `/api/assets/:id` | Auth | Update asset |
| Assets | PATCH | `/api/assets/assign` | Auth | Bulk assign asset |
| Locations | GET/POST | `/api/locations` | Auth | Location list / create |
| Locations | GET/PATCH/DELETE | `/api/locations/:id` | Auth | Location management |
| Transfers | GET | `/api/transfers` | Auth | Transfer list |
| Transfers | POST | `/api/transfers` | `SUPER_ADMIN` | Create transfer |
| Transfers | GET | `/api/transfers/:id` | Auth | Transfer detail |
| Transfers | POST | `/api/transfers/:id/confirm` | `WAREHOUSE_STAFF` | Confirm transfer |
| Transfers | POST | `/api/transfers/:id/cancel` | `SUPER_ADMIN` | Cancel transfer |
| Sessions | GET/POST | `/api/sessions` | Auth | Session list / create |
| Sessions | GET | `/api/sessions/:id` | Auth | Session detail |
| Dashboard | GET | `/api/dashboard/summary` | Auth | Dashboard summary |
| Activity Logs | GET | `/api/activity-logs` | `SUPER_ADMIN` | Audit trail |

#### A.4 WebSocket Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `scanStream` | Client -> Server | `{epc, rssi}[]` | Mobile gửi raw scan data |
| `liveScan` | Server -> Client | `{epc, rssi, assetId, asset, isNew}` | Live scan update |
| `inventoryUpdate` | Server -> Authenticated web clients | `{totalAssets, newAssets, summary}` | Dashboard / live view update |
| `transferUpdate` | Server -> All | Transfer data | Transfer status change |

#### A.5 Communication Interfaces

| Interface | Protocol | Port | Purpose |
|-----------|----------|------|---------|
| Backend API | HTTPS / REST | 443 prod / 3000 dev | Client-server communication |
| WebSocket | WSS | Same as API | Real-time updates |
| Database | PostgreSQL wire | 5432 | ORM to database |
| Cache | Redis | 6379 | Cache / session support |
| Mobile to Reader | BLE | N/A | RFID scanning |

### Appendix B. Error Handling Reference

#### B.1 Input Validation

| Endpoint | Validation | Error Code | Message |
|----------|------------|------------|---------|
| POST /api/auth/login | username required | AUTH_001 | `Username là bắt buộc` |
| POST /api/assets | unique EPC | ASSET_001 | `EPC đã tồn tại` |
| POST /api/assets | valid EPC format | ASSET_002 | `EPC không hợp lệ` |
| POST /api/transfers | source must be WORKSHOP | TRANS_001 | `Source phải là WORKSHOP` |
| POST /api/transfers | destination must be WAREHOUSE | TRANS_002 | `Destination phải là WAREHOUSE` |
| POST /api/transfers/:id/confirm | all scanned | TRANS_003 | `Tất cả items phải được quét` |
| POST /api/transfers/:id/confirm | status must be PENDING | TRANS_004 | `Chỉ PENDING mới xác nhận được` |
| POST /api/transfers/:id/cancel | role must be SUPER_ADMIN | TRANS_005 | `Chỉ SUPER_ADMIN được hủy` |

#### B.2 BLE Reader Errors

| Code | Condition | User Message | Recovery |
|------|-----------|--------------|----------|
| BLE_001 | Reader not found | `Không tìm thấy máy quét` | Auto-retry |
| BLE_002 | Connection lost | `Mất kết nối. Đang kết nối lại...` | Reconnect with backoff |
| BLE_003 | BLE disabled | `Bluetooth đang tắt` | Open settings |
| BLE_004 | Scan timeout | `Hết thời gian quét` | Retry |
| BLE_005 | Buffer overflow | `Bộ nhớ đệm đầy` | Restart reader |

#### B.3 API Error Format

```json
{
  "statusCode": 400,
  "error": {
    "code": "ASSET_001",
    "message": "Asset with this EPC already exists",
    "details": {
      "field": "epc",
      "value": "E2 80 69 15 00 00 40 1E CC 01 11 3D"
    }
  },
  "timestamp": "2026-04-02T10:30:00.000Z",
  "path": "/api/assets"
}
```

#### B.4 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | GET / PATCH thành công |
| 201 | POST tạo mới thành công |
| 204 | Delete thành công |
| 400 | Validation error |
| 401 | Authentication failed |
| 403 | Authorization failed |
| 404 | Resource not found |
| 409 | Conflict |
| 429 | Rate limit exceeded |
| 500 | Internal error |

#### B.5 Offline Mode & Logging

| Scenario | Expected Behavior |
|----------|-------------------|
| Network lost | Queue scans in local storage |
| Queue full | Warn user |
| Network restored | Auto-sync queue FIFO |
| Sync conflict | Server wins |
| System errors | Log with appropriate severity |

| Log Level | Usage |
|-----------|-------|
| ERROR | Exceptions, failed transactions |
| WARN | Cache misses, retries |
| INFO | Request logs |
| DEBUG | Detailed diagnostics |

### Appendix C. Enum Values

```typescript
enum AssetStatus {
  IN_STOCK
  OUT_OF_STOCK
  IN_TRANSIT
  MISSING
}

enum LocationType {
  ADMIN
  WORKSHOP
  WAREHOUSE
  HOTEL
  RESORT
  SPA
}

enum TransferType {
  WORKSHOP_TO_WAREHOUSE
  WAREHOUSE_TO_CUSTOMER
}

enum TransferStatus {
  PENDING
  COMPLETED
  CANCELLED
}

enum AssetEventType {
  CREATED
  ASSIGNED
  SCANNED
  MOVED
  MISSING
  OUT_OF_STOCK
}

enum Role {
  SUPER_ADMIN
  TAGGING_STAFF
  WAREHOUSE_STAFF
}
```

### Appendix D. Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/rfid_inventory
JWT_SECRET=your-32-char-secret-minimum
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
PORT=3000
CORS_ORIGINS=https://app.example.com

REDIS_HOST=localhost
REDIS_PORT=6379

RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

### Appendix E. Glossary

| Term | Definition |
|------|------------|
| Asset | Sản phẩm được gắn RFID tag |
| EPC | Mã unique cho RFID tag |
| BLE | Bluetooth Low Energy |
| Transfer | Chuyển giao giữa các location |
| Session | Phiên quét RFID |
| RSSI | Cường độ tín hiệu, thường từ -90 đến -30 dBm |
| Live View | Màn hình web theo dõi kết quả quét real-time |

### Appendix F. Document Governance

| Topic | Approach |
|-------|----------|
| Document information | Quản lý tại phần `Document Metadata` ở đầu tài liệu |
| Revision history | Theo dõi trong bảng `Revision History` và lịch sử commit Git |
| Approval model | Tài liệu working draft được review qua BA / Tech Lead / stakeholder nghiệp vụ trước khi chốt baseline |
| Change control | Mọi thay đổi phạm vi, role model, business rules, API hoặc acceptance criteria phải được cập nhật trực tiếp trong SRS này cùng commit liên quan |
| Source of truth | File Markdown này là bản làm việc chính; sơ đồ PlantUML và ảnh render trong `docs/diagrams` và `docs/images/diagrams` là artefact đi kèm |
