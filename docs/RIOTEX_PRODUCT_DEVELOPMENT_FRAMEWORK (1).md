# Hệ Thống Theo Dõi Tài Sản RFID — Software Requirements Specification

## Document Metadata

| Field | Value |
|-------|-------|
| Document Type | Software Requirements Specification (SRS) |
| Product Name | RFID Asset Tracking System |
| Domain | Theo dõi tài sản RFID cho chuỗi cung ứng hàng may mặc |
| Version | 1.3 |
| Status | Working Draft |
| Last Updated | 2026-04-02 |
| Writing Style | Hybrid SRS - as-built snapshot with gap log |

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-04-02 | Bản SRS IEEE 830 ban đầu cho hệ thống RFID asset tracking |
| 1.1 | 2026-04-02 | Viết lại theo khung Hybrid, tái cấu trúc business rules, NFR và appendices |
| 1.2 | 2026-04-02 | Đồng bộ lại theo source hiện tại của backend: role enum, entity model, transfer workflow, API và ERD |
| 1.3 | 2026-04-02 | Làm rõ các mismatch giữa as-built và target-state: outbound cancel, dashboard websocket, public tag list và rule đổi product sau outbound |

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

Hệ thống Theo Dõi Tài Sản RFID hiện được triển khai như một nền tảng single-tenant, tag-centric, dùng RFID để theo dõi EPC, sản phẩm, vị trí, phiên quét, điều chuyển và lịch sử thao tác. Source backend hiện lưu entity chính dưới dạng `Tag`, `TagEvent`, `Transfer`, `Order`, `Session`, `Scan`, `ActivityLog` thay vì asset model thuần túy, nên tài liệu này mô tả lại theo đúng snapshot đang có trong code.

Giải pháp kết hợp Web Dashboard, Mobile App, RFID reader kết nối BLE, REST API, Socket.IO/WebSocket và cơ chế audit trail. Role enum hiện tại trong source gồm `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF`. Mục tiêu của phiên bản SRS này là phản ánh đúng implementation hiện có để BA, Dev và QA có thể review khoảng cách giữa business model mong muốn và hệ thống đang chạy; các rule chưa được source enforce sẽ được tách rõ thành gap log hoặc planned business rules thay vì trộn vào acceptance as-built.

---

## 1. Introduction

### 1.1 Product Purpose

Mục đích của hệ thống là cung cấp một nền tảng trực quan, có thể audit và đủ khả năng mở rộng để:

- Khởi tạo và quản lý RFID tag theo EPC, bao gồm gán tag vào product
- Quản lý vòng đời tag qua các location `ADMIN`, `WORKSHOP`, `WORKSHOP_WAREHOUSE`, `WAREHOUSE` và location khách hàng
- Ghi nhận điều chuyển nội bộ với các loại `ADMIN_TO_WORKSHOP`, `WORKSHOP_TO_WAREHOUSE`, `WAREHOUSE_TO_CUSTOMER`
- Hỗ trợ order, session, scan và inventory operations theo RBAC hiện có trong source
- Phát live scan và dashboard update qua WebSocket, đồng thời lưu activity log phục vụ audit

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
| Authentication & RBAC | JWT login, refresh token, roles `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF` |
| User Management | Quản lý user nội bộ, audit trail và refresh tokens |
| Category & Product Management | CRUD danh mục và sản phẩm theo policy |
| Tag Management | Khởi tạo tag trắng, tra cứu EPC, xem lịch sử, bulk assign tag vào product |
| Location Management | CRUD location, sync `WORKSHOP_WAREHOUSE`, phân cấp parent-child |
| Order Management | CRUD order, order items, cancel order và phân quyền theo role |
| Transfer Management | Điều chuyển `ADMIN_TO_WORKSHOP`, `WORKSHOP_TO_WAREHOUSE`, `WAREHOUSE_TO_CUSTOMER` |
| Session & Scan Management | Tạo session, lưu scan, gán product cho session, quét RFID realtime |
| Inventory & Dashboard | Inventory operations, stock summary, dashboard summary, category stats |
| Activity Logs & Real-Time Events | Activity log, live scan, tagsUpdated, transferUpdate, orderUpdate |

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
| Tag | Bản ghi RFID chính trong source, định danh bởi `epc` |
| TagEvent | Lịch sử sự kiện của tag, lưu theo `tagId`, `type`, `location`, `userId` |
| EPC | Electronic Product Code, mã định danh duy nhất của RFID tag |
| RFID | Radio-Frequency Identification |
| BLE | Bluetooth Low Energy |
| Location | Địa điểm vận hành: `ADMIN`, `WORKSHOP`, `WORKSHOP_WAREHOUSE`, `WAREHOUSE`, `HOTEL`, `RESORT`, `SPA`, `CUSTOMER` |
| Transfer | Phiên điều chuyển tag giữa các location |
| Session | Phiên quét RFID gắn với user và tùy chọn order |
| Scan | Dữ liệu EPC/RSSI trong một session |
| Order | Chứng từ nghiệp vụ riêng, gồm `INBOUND` hoặc `OUTBOUND` |
| RBAC | Role-Based Access Control |
| Single-tenant | Một instance hệ thống phục vụ một doanh nghiệp |

### 1.5 References

| Reference | Description |
|-----------|-------------|
| ISO/IEC 29161 | RFID data protocol and item identification practices |
| IEEE 830 | Recommended practice for Software Requirements Specifications |
| OWASP REST Security | Security practices for REST APIs |
| [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) | Nguồn sự thật cho enum, entity và relation của implementation hiện tại |

---

## 2. Overall Description

### 2.1 System Architecture Overview

| Component | Technology / Runtime | Responsibility |
|-----------|----------------------|----------------|
| Web Dashboard | Next.js 16, React 19, Tailwind 4 | Theo dõi live view, quản lý dữ liệu, dashboard, admin tools theo RBAC |
| Mobile App | React Native + Expo SDK 55 | Kết nối reader, scan tag, kiểm kê, hỗ trợ tagging và warehouse operations |
| Backend API | NestJS 11, Node.js 20 | REST API, auth, RBAC, business rules, transfer workflow |
| Real-Time Layer | Socket.IO / WebSocket | Broadcast live scan, dashboard updates, transfer updates |
| Database | PostgreSQL 15+ via Prisma | Lưu user, tag, transfer, order, session, scan, event, activity logs |
| Cache | Redis 7+ | Cache, session support, transient state |
| RFID Reader | ST-H103 UHF (default) qua BLE | Quét EPC/RSSI và trả dữ liệu về mobile |

### 2.2 Context Diagram

**PlantUML source**
- [`rfid-context-diagram.puml`](./diagrams/rfid-context-diagram.puml)

![Figure 2-1. Context Diagram](./images/diagrams/rfid-context-diagram.png)

### 2.3 User Classes and Actors

| Actor / Role | Primary Responsibility | Channels |
|--------------|------------------------|----------|
| `SUPER_ADMIN` | Full access toàn hệ thống, user management, dashboard summary, transfer create/confirm theo route | Web |
| `ADMIN` | CRUD category/product/tag/order/session/location/inventory; create transfer; cancel transfer theo service hiện tại | Web, Mobile |
| `WAREHOUSE_MANAGER` | Quản lý order nghiệp vụ kho, tạo session, scan, create/confirm transfer, đọc inventory và activity log | Web, Mobile |
| `STAFF` | Đọc dữ liệu vận hành, tạo order, tạo session, tạo scan, xem activity log theo phạm vi hiện có | Web, Mobile |
| RFID Reader | Cung cấp EPC + RSSI qua BLE | Mobile integration |
| Customer Location | Điểm nhận hàng cuối dạng `HOTEL`, `RESORT`, `SPA`, hoặc `CUSTOMER` | No direct access |

### 2.4 Business Processes

#### BP-01: Khởi tạo và gán tag

1. `ADMIN` hoặc `SUPER_ADMIN` khởi tạo tag trắng qua `POST /api/tags`.
2. `ADMIN` hoặc `SUPER_ADMIN` gán tag vào product qua `PATCH /api/tags/assign`; snapshot source hiện chưa chặn theo `TagStatus`, còn business rule khóa đổi product theo trạng thái được theo dõi tại `PR-01`.
3. Trong live scan, EPC chưa tồn tại cũng có thể được auto-create bởi gateway dưới dạng tag `UNASSIGNED`.

#### BP-02: Điều chuyển `ADMIN_TO_WORKSHOP`

1. `SUPER_ADMIN`, `ADMIN` tạo transfer `PENDING` từ `ADMIN` sang `WORKSHOP`.
2. `SUPER_ADMIN` hoặc `WAREHOUSE_MANAGER` confirm transfer.
3. Khi confirm, tag được cập nhật location đích và status `IN_WORKSHOP`.

#### BP-03: Điều chuyển `WORKSHOP_TO_WAREHOUSE`

1. Transfer được tạo từ `WORKSHOP_WAREHOUSE`, không xuất trực tiếp từ `WORKSHOP`.
2. `SUPER_ADMIN` hoặc `WAREHOUSE_MANAGER` tạo transfer `PENDING`.
3. `SUPER_ADMIN` hoặc `WAREHOUSE_MANAGER` confirm; tag thiếu trong scan sẽ bị đánh dấu `MISSING`.

#### BP-04: Điều chuyển `WAREHOUSE_TO_CUSTOMER`

1. `SUPER_ADMIN` hoặc `WAREHOUSE_MANAGER` tạo transfer từ `WAREHOUSE` đến `HOTEL`, `RESORT`, `SPA`, hoặc `CUSTOMER`.
2. Transfer loại này được tạo ở trạng thái `COMPLETED` ngay.
3. Tag được cập nhật `locationId` sang đích và status `COMPLETED`.
4. Nếu cần reverse sau khi đã `COMPLETED`, snapshot source hiện dùng một administrative recovery flow riêng do `ADMIN` thực hiện qua action cancel.

#### BP-05: Session, scan và inventory

1. User có quyền tạo session (`SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF`) mở session quét.
2. Gateway nhận `scanStream`, enrich EPC bằng dữ liệu tag/product và phát `scanDetected`.
3. `inventoryUpdate` hiện chỉ được gửi tới room `admin:dashboard`, room này trong gateway hiện gắn với JWT role `ADMIN`.

#### Transfer Workflow State Model

**PlantUML source**
- [`transfer-workflow-state-model.puml`](./diagrams/transfer-workflow-state-model.puml)

![Figure 2-2. Transfer Workflow State Model](./images/diagrams/transfer-workflow-state-model.png)

### 2.5 Assumptions & Dependencies

| Assumption / Dependency | Impact |
|-------------------------|--------|
| RFID tags tuân thủ EPCglobal Gen2 | Bảo đảm tương thích reader |
| Reader có BLE interface | Mobile app giao tiếp trực tiếp với phần cứng |
| Network có thể gián đoạn | Mobile phải hỗ trợ queue + sync |
| EPC là duy nhất toàn hệ thống | Duplicate EPC làm sai lệch tracking |
| Hệ thống triển khai single-tenant | Không cần data isolation giữa nhiều tenant trong v1 |
| Source snapshot hiện còn role model legacy | Enum và guard vẫn dùng `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF` |
| `WORKSHOP_TO_WAREHOUSE` yêu cầu `WORKSHOP_WAREHOUSE` | Nghiệp vụ xưởng phải sync kho xưởng trước khi xuất |
| `CUSTOMER` vẫn tồn tại để backward compatibility | Destination customer có thể là `HOTEL`, `RESORT`, `SPA`, hoặc `CUSTOMER` |

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

| Capability | SUPER_ADMIN | ADMIN | WAREHOUSE_MANAGER | STAFF |
|-----------|-------------|-------|-------------------|-------|
| User management | Yes | No | No | No |
| Dashboard summary REST API | Yes | No | No | No |
| WebSocket live scan (`scan:live`) | Yes | Yes | Yes | Yes |
| WebSocket dashboard aggregate (`inventoryUpdate`) | No | Yes | No | No |
| Category / Product read | Yes | Yes | Yes | Yes |
| Category / Product create-update-delete | Yes | Yes | No | No |
| Tag list endpoint (`GET /api/tags`) | Public | Public | Public | Public |
| Tag detail / history | Yes | Yes | Yes | Yes |
| Tag create-update-delete-assign | Yes | Yes | No | No |
| Order create | Yes | Yes | Yes | Yes |
| Order update-delete-cancel | Yes | Yes | Yes | No |
| Session read / create | Yes | Yes | Yes | Yes |
| Session assign product | Yes | Yes | No | No |
| Inventory read | Yes | Yes | Yes | Yes |
| Inventory create operation | Yes | Yes | No | No |
| Transfer create | Yes | Yes | Yes | No |
| Transfer confirm | Yes | No | Yes | No |
| Transfer cancel (effective service behavior) | No | Yes | No | No |
| Activity logs | Yes, full | No | Yes, scoped | Yes, scoped |

Ghi chú implementation hiện tại:

- `POST /api/transfers/:id/cancel` được decorator cho `SUPER_ADMIN` và `ADMIN`, nhưng service hiện chỉ cho `ADMIN` thực thi thành công.
- `GET /api/dashboard/summary` dùng CASL `read Dashboard`, hiện chỉ `SUPER_ADMIN` có quyền.
- Mọi websocket client có JWT hợp lệ đều join room `scan:live`, nhưng room `admin:dashboard` chỉ join khi JWT role là `ADMIN`.
- `GET /api/tags` hiện là public endpoint trong controller; đây là hành vi as-built của source và cần được chốt lại về mặt security nếu business muốn thu hẹp bằng auth/RBAC.

#### 3.1.3 Tag Management & Assignment

- EPC phải unique trong toàn hệ thống (`Tag.epc` là unique key).
- `POST /api/tags` cho phép khởi tạo tag trắng; `PATCH /api/tags/assign` dùng để bulk assign tag vào một product.
- `POST /api/tags/live` là public route để nhận live scan; gateway cũng có thể auto-create tag mới khi nhận EPC chưa tồn tại từ `scanStream`.
- Tag đang là entity tracked chính trong source; product được gắn vào tag qua `productId`.
- Business baseline mong muốn: product của tag chỉ được phép gán hoặc đổi khi tag còn ở chuỗi nội bộ: `UNASSIGNED`, `IN_WORKSHOP`, hoặc `IN_WAREHOUSE`.
- Business baseline mong muốn: tag đang `IN_TRANSIT` không được đổi `productId` để tránh sai lệch traceability giữa lúc điều chuyển.
- Business baseline mong muốn: tag đã xuất khách hàng và ở trạng thái `COMPLETED` không được đổi `productId`; nếu transfer outbound bị hủy và tag quay lại luồng nội bộ thì mới được phép cập nhật lại product.
- `TagEvent` lưu lịch sử theo `tagId`, nhưng `location` và `userId` hiện đang là string field chứ không phải relation đầy đủ trong Prisma schema.

Ghi chú implementation gap hiện tại:

- `backend/src/tags/tags.service.ts` hiện chỉ kiểm tra product tồn tại rồi update `productId`; chưa chặn theo `TagStatus` hoặc `location`.
- `PATCH /api/tags/assign` cũng chưa lọc để chỉ cho phép gán lại các tag còn nằm trong chuỗi nội bộ; source còn set `Tag.status = IN_WORKSHOP` cho các tag được assign.

#### 3.1.4 Transfer & Warehouse Validation

- `ADMIN_TO_WORKSHOP`: source phải là `ADMIN`, destination phải là `WORKSHOP`.
- `WORKSHOP_TO_WAREHOUSE`: source phải là `WORKSHOP_WAREHOUSE`, destination phải là `WAREHOUSE`.
- `WAREHOUSE_TO_CUSTOMER`: source phải là `WAREHOUSE`, destination phải là `HOTEL`, `RESORT`, `SPA`, hoặc `CUSTOMER`.
- Create transfer hiện được route guard cho `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`.
- Confirm transfer hiện được route guard cho `SUPER_ADMIN`, `WAREHOUSE_MANAGER`.
- Cancel transfer hiện được service check cho `ADMIN` duy nhất.
- `WAREHOUSE_TO_CUSTOMER` được tạo với `status = COMPLETED`, `completedAt = now()`, và `TransferItem.scannedAt` cũng được set ngay.
- Transfer `WAREHOUSE_TO_CUSTOMER` vẫn có thể đi sang `CANCELLED` sau khi đã `COMPLETED`.
- Ở `confirm`, nếu request không gửi scan list thì service sẽ auto-receive toàn bộ items.
- Tag không xuất hiện trong scan confirm sẽ bị cập nhật status `MISSING`.

#### 3.1.5 Real-Time Monitoring & Sessions

- WebSocket connection yêu cầu JWT token; mọi client hợp lệ đều join room `scan:live`.
- Nếu JWT role là `ADMIN`, client còn được join room `admin:dashboard` để nhận `inventoryUpdate`.
- `scanStream` trả về dữ liệu enrich gồm `tagId`, `epc`, `rssi`, `status`, `product`, `isNew`.
- Gateway phát các event chính: `scanDetected`, `inventoryUpdate`, `tagsUpdated`, `liveScan`, `sessionCreated`, `transferUpdate`, `orderUpdate`.
- Session được lưu qua module `Session`; `Scan` là entity riêng gắn với `sessionId` và `tagEpc`.

#### 3.1.6 Data Deletion, Retention & Auditability

- User, Location, Category, Product, Tag và Order đều có `deletedAt` để hỗ trợ soft delete.
- `ActivityLog` luôn gắn `userId` relation và lưu `details`, `ipAddress`, `createdAt`.
- `TagEvent` được append-only theo hướng triển khai hiện tại.
- Source hiện chưa có cơ chế purge/retention scheduler rõ ràng; retention là hành vi vận hành chứ chưa được code enforce.

### 3.2 Logical Data Model / ERD

Sơ đồ dưới đây phản ánh snapshot `schema.prisma` hiện tại ở mức logical/as-built.

**PlantUML source**
- [`logical-data-model-erd.puml`](./diagrams/logical-data-model-erd.puml)

![Figure 3-1. Logical Data Model / ERD](./images/diagrams/logical-data-model-erd.png)

### 3.3 Core Entity Definitions

#### 3.3.1 Users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | User identifier |
| username | String | Unique | Login username |
| password | String | Not Null | Bcrypt hashed password |
| role | Enum | Not Null | `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF` |
| locationId | UUID | FK -> Location, Nullable | Assigned operating location |
| createdById / updatedById / deletedById | UUID | FK -> User, Nullable | Self-audit fields |
| deletedAt | DateTime | Nullable | Soft delete timestamp |
| createdAt | DateTime | Not Null | Creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

#### 3.3.2 Tags

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Tag identifier |
| epc | String | Unique | RFID EPC |
| productId | UUID | FK -> Product, Nullable | Related product |
| status | Enum | Not Null | `UNASSIGNED`, `IN_WORKSHOP`, `IN_WAREHOUSE`, `IN_TRANSIT`, `COMPLETED`, `MISSING` |
| locationId | UUID | FK -> Location, Nullable | Current location |
| lastSeenAt | DateTime | Nullable | Last realtime detection |
| createdById | UUID | FK -> User, Nullable | Audit creator |
| updatedById | UUID | FK -> User, Nullable | Audit updater |
| deletedById | UUID | FK -> User, Nullable | Audit deleter |
| deletedAt | DateTime | Nullable | Soft delete timestamp |
| createdAt | DateTime | Not Null | Creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

#### 3.3.3 Locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Location identifier |
| name | String | Not Null | Human-readable name |
| code | String | Unique | Short code |
| type | Enum | Not Null | `ADMIN`, `WORKSHOP`, `WORKSHOP_WAREHOUSE`, `WAREHOUSE`, `HOTEL`, `RESORT`, `SPA`, `CUSTOMER` |
| address | String | Nullable | Physical address |
| parentId | UUID | FK -> Location, Nullable | Parent location |
| createdById / updatedById / deletedById | UUID | FK -> User, Nullable | Audit fields |
| deletedAt | DateTime | Nullable | Soft delete timestamp |
| createdAt | DateTime | Not Null | Creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

#### 3.3.4 Products & Categories

| Entity | Key Fields | Notes |
|--------|------------|-------|
| Category | `id`, `name`, `description`, `createdById`, `deletedAt` | Product grouping |
| Product | `id`, `name`, `sku`, `description`, `categoryId`, `createdById`, `deletedAt` | Product catalog |

#### 3.3.5 Orders, Sessions & Scans

| Entity | Key Fields | Notes |
|--------|------------|-------|
| Order | `id`, `code`, `type`, `status`, `locationId`, `createdById`, `deletedAt` | Business order header |
| OrderItem | `id`, `orderId`, `productId`, `quantity`, `scannedQuantity` | Order line |
| Session | `id`, `name`, `startedAt`, `endedAt`, `totalTags`, `userId`, `orderId` | Scan session |
| Scan | `id`, `tagEpc`, `sessionId`, `rssi`, `scannedAt` | Per-scan record |

#### 3.3.6 Transfers, TagEvents & ActivityLogs

| Entity | Key Fields | Notes |
|--------|------------|-------|
| Transfer | `id`, `code`, `type`, `status`, `sourceId`, `destinationId`, `createdById`, `completedAt` | Transfer header |
| TransferItem | `id`, `transferId`, `tagId`, `condition`, `scannedAt` | Per-tag validation within transfer |
| TagEvent | `id`, `tagId`, `type`, `location`, `description`, `userId`, `createdAt` | Tag lifecycle event |
| ActivityLog | `id`, `userId`, `action`, `entity`, `entityId`, `details`, `ipAddress`, `createdAt` | Administrative audit trail |

### 3.4 Indexing, Retention & Auditability

#### 3.4.1 Indexing

| Table | Columns | Type | Purpose |
|-------|---------|------|---------|
| tags | epc | Unique | Fast EPC lookup |
| tags | status | Index | Filter by status |
| tags | locationId | Index | Filter by location |
| tags | productId | Index | Filter by product |
| tag_events | tagId, createdAt | Composite | Tag history query |
| scans | tagEpc, scannedAt | Composite | Session scan query |
| sessions | userId, orderId | Composite | Session filtering |
| orders | status, locationId | Composite | Order filtering |
| transfers | status | Index | Filter by status |
| transfers | type, sourceId, destinationId | Composite | Location-based query |
| activity_logs | userId, timestamp | Composite | User audit history |

#### 3.4.2 Retention

| Data | Retention | Policy |
|------|-----------|--------|
| Activity logs | No automatic purge in source | Retention vận hành bên ngoài code |
| Tag events | No automatic purge in source | Append-only by current implementation |
| Soft-deleted records | No scheduled purge in source | `deletedAt` used as logical delete |

---

## 4. Functional Requirements

### 4.1 Feature Prioritization

| Feature | Priority | Notes |
|---------|----------|-------|
| Authentication & RBAC | Must | Core access control |
| User & role management | Must | Needed for `SUPER_ADMIN` operations |
| Category / product management | Must | Back-office CRUD nền tảng |
| Tag initialization / assignment | Must | Tag-centric core flow trong source |
| Location management | Must | Needed for routing and traceability |
| Orders | Must | Đã có module và policy riêng |
| Transfers | Must | Gồm `ADMIN_TO_WORKSHOP`, `WORKSHOP_TO_WAREHOUSE`, `WAREHOUSE_TO_CUSTOMER` |
| Sessions & scans | Must | Core realtime scanning flow |
| Inventory | Must | Stock summary và inventory history |
| Dashboard & category stats | Must | Đã có controller/service riêng |
| Tag history & activity logs | Must | Traceability and audit |
| Route/role normalization | Should | Source hiện còn legacy role semantics |
| Bulk report export / import | Could | Chưa là core blocker trong source hiện tại |

### 4.2 Overall Use Case Diagram

**PlantUML source**
- [`rfid-usecase-overview.puml`](./diagrams/rfid-usecase-overview.puml)

![Figure 4-1. Use Case Overview](./images/diagrams/rfid-usecase-overview.png)

### 4.3 Decomposed Use Case Diagrams

#### 4.3.1 UC-001 Tag Initialization & Assignment

**PlantUML source**
- [`uc-001-gan-rfid-tag-cho-san-pham-moi.puml`](./diagrams/uc-001-gan-rfid-tag-cho-san-pham-moi.puml)

![Figure 4-2. UC-001](./images/diagrams/uc-001-gan-rfid-tag-cho-san-pham-moi.png)

#### 4.3.2 UC-002 Internal Transfer Workflow

**PlantUML source**
- [`uc-002-chuyen-hang-tu-xuong-ve-kho.puml`](./diagrams/uc-002-chuyen-hang-tu-xuong-ve-kho.puml)

![Figure 4-3. UC-002](./images/diagrams/uc-002-chuyen-hang-tu-xuong-ve-kho.png)

#### 4.3.3 UC-003 Warehouse to Customer Dispatch

**PlantUML source**
- [`uc-003-xuat-hang-cho-khach-hang.puml`](./diagrams/uc-003-xuat-hang-cho-khach-hang.puml)

![Figure 4-4. UC-003](./images/diagrams/uc-003-xuat-hang-cho-khach-hang.png)

#### 4.3.4 UC-004 Session & Live Scan Monitoring

**PlantUML source**
- [`uc-004-kiem-ke-hang-ngay.puml`](./diagrams/uc-004-kiem-ke-hang-ngay.puml)

![Figure 4-5. UC-004](./images/diagrams/uc-004-kiem-ke-hang-ngay.png)

### 4.4 Use Case Specifications

#### 4.4.1 UC-001: Khởi tạo tag và gán vào sản phẩm

| Field | Description |
|-------|-------------|
| Primary Actors | `SUPER_ADMIN`, `ADMIN` |
| Supporting Actors | RFID Reader, EventsGateway |
| Trigger | Cần khởi tạo tag trắng hoặc gán một nhóm tag vào product |
| Preconditions | User có quyền `create/update Tag`; product tồn tại nếu dùng assign |
| Main Flow | 1. Tạo tag qua `POST /api/tags` hoặc nhận EPC mới từ realtime scan.<br>2. Hệ thống đảm bảo `epc` là unique.<br>3. User gọi `PATCH /api/tags/assign` với `productId` và `tagIds[]` để gán product cho tag.<br>4. Snapshot source hiện set `Tag.status = IN_WORKSHOP` cho các tag được assign.<br>5. Hệ thống emit `tagsUpdated` và lưu audit fields liên quan. |
| Alternate / Error Flow | EPC trùng -> từ chối tạo tag.<br>Product không tồn tại -> không cho assign.<br>User không có quyền `update Tag` -> trả về forbidden.<br>Business rule khóa đổi product khi tag `IN_TRANSIT` hoặc `COMPLETED` hiện đang được theo dõi tại `PR-01`, chưa được source enforce. |
| Postconditions | Tag tồn tại trong hệ thống và có thể đã gắn product; ở snapshot source hiện tại, bulk assign còn đưa tag về `IN_WORKSHOP`. |

#### 4.4.2 UC-002: Điều chuyển nội bộ

| Field | Description |
|-------|-------------|
| Primary Actors | `SUPER_ADMIN`, `WAREHOUSE_MANAGER` |
| Trigger | Cần điều chuyển tag giữa `ADMIN -> WORKSHOP` hoặc `WORKSHOP_WAREHOUSE -> WAREHOUSE` |
| Preconditions | Tag hợp lệ đang ở source; loại transfer và source/destination đúng rule hiện có |
| Main Flow | 1. `SUPER_ADMIN` hoặc `WAREHOUSE_MANAGER` tạo transfer qua `POST /api/transfers`.<br>2. Với transfer không phải `WAREHOUSE_TO_CUSTOMER`, hệ thống tạo `PENDING`.<br>3. `SUPER_ADMIN` hoặc `WAREHOUSE_MANAGER` confirm transfer.<br>4. Hệ thống cập nhật `TransferItem.scannedAt`, location đích và `TagStatus` phù hợp. |
| Alternate / Error Flow | Source sai loại -> trả về validation error.<br>`WORKSHOP_TO_WAREHOUSE` xuất trực tiếp từ `WORKSHOP` -> bị từ chối.<br>Tag thiếu trong scan bị cập nhật `MISSING`. |
| Postconditions | Transfer `COMPLETED` hoặc `CANCELLED`; tag về `IN_WORKSHOP`, `IN_WAREHOUSE`, hoặc `MISSING` tùy kết quả confirm. |

#### 4.4.3 UC-003: Xuất hàng cho khách hàng

| Field | Description |
|-------|-------------|
| Primary Actors | `SUPER_ADMIN`, `WAREHOUSE_MANAGER` |
| Trigger | Cần xuất tag từ `WAREHOUSE` tới location khách hàng |
| Preconditions | Source là `WAREHOUSE`; destination là `HOTEL`, `RESORT`, `SPA`, hoặc `CUSTOMER` |
| Main Flow | 1. User tạo transfer loại `WAREHOUSE_TO_CUSTOMER`.<br>2. Service tạo transfer ở trạng thái `COMPLETED` ngay.<br>3. `TransferItem.scannedAt` được set ngay khi create.<br>4. Hệ thống cập nhật `Tag.locationId` sang destination và `Tag.status = COMPLETED`. |
| Alternate / Error Flow | Source hoặc destination sai type -> trả về validation error.<br>Nếu cần reverse sau outbound, snapshot source hiện dùng administrative cancel flow riêng do `ADMIN` thực hiện, không phải thao tác của primary actor trong UC-003. |
| Postconditions | Transfer hoàn tất một bước, không cần `confirm`; nếu cần hoàn tác sau đó thì phải đi qua luồng cancel hành chính riêng trong source hiện tại. |

#### 4.4.4 UC-004: Session và live scan

| Field | Description |
|-------|-------------|
| Primary Actors | `WAREHOUSE_MANAGER`, `STAFF` |
| Supporting Actors | RFID Reader, authenticated web clients |
| Trigger | Bắt đầu một session quét hoặc phát live scan qua WebSocket |
| Preconditions | Reader kết nối; `WAREHOUSE_MANAGER` hoặc `STAFF` có quyền vận hành phiên quét; websocket token hợp lệ |
| Main Flow | 1. `WAREHOUSE_MANAGER` hoặc `STAFF` tạo session qua `POST /api/sessions`.<br>2. Client gửi `scanStream` hoặc `liveScan` payload.<br>3. Gateway enrich dữ liệu tag/product và phát `scanDetected` cho các authenticated websocket clients trong room `scan:live`.<br>4. Nếu EPC chưa tồn tại, gateway auto-create tag mới.<br>5. Aggregate `inventoryUpdate` hiện là một luồng websocket riêng chỉ phát tới room `admin:dashboard` của JWT role `ADMIN`. |
| Alternate / Error Flow | Token websocket không hợp lệ -> disconnect.<br>Reader lỗi -> client retry.<br>EPC mới chưa tồn tại -> auto-create tag `UNASSIGNED`. |
| Postconditions | Session, scan và realtime events được xử lý cho flow vận hành kho; web live view chạy qua `scan:live`, còn dashboard aggregate là luồng riêng của room `admin:dashboard`. |

### 4.5 Functional Requirement Catalogue

| ID | Requirement | Actors | Outcome |
|----|-------------|--------|---------|
| FR-001 | User authentication and token management | All internal users | Login/logout/refresh hoạt động an toàn |
| FR-002 | User and role administration | `SUPER_ADMIN` | Quản lý tài khoản và phân quyền |
| FR-003 | Category and product lookup / CRUD | `SUPER_ADMIN`, `ADMIN` for manage; others for read | Catalog phục vụ tagging và order flows |
| FR-004 | Tag creation, lookup and EPC uniqueness | `SUPER_ADMIN`, `ADMIN` | Tag mới được tạo với EPC hợp lệ |
| FR-005 | Bulk tag assignment to product | `SUPER_ADMIN`, `ADMIN` | Snapshot source gán `productId`, lưu audit, và đưa tag được assign về `IN_WORKSHOP`; rule khóa reassignment theo `TagStatus` đang theo `PR-01` |
| FR-006 | Location management and workshop warehouse sync | `SUPER_ADMIN`, `ADMIN` | Quản lý location phục vụ routing |
| FR-007 | Order creation and management | `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF` by policy | Vận hành đơn hàng theo role |
| FR-008 | Transfer creation, confirmation and administrative cancellation | `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER` | Điều chuyển theo 3 loại transfer hiện có; cancel hiện là administrative flow riêng |
| FR-009 | Session creation and scan processing | `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF` by policy | Quản lý session và scan |
| FR-010 | Inventory operations and stock summary | `SUPER_ADMIN`, `ADMIN`, read access cho `WAREHOUSE_MANAGER`, `STAFF` | Kiểm kê và thống kê tồn kho |
| FR-011 | Dashboard, tag history and activity log | System with role-based access | Traceability, dashboard summary và audit |
| FR-012 | Real-time websocket events | Authenticated websocket clients | Live scan, transfer and order updates |

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
| NFR-PERF-07 | Max tags per instance | 100,000 |
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

### 8.1 Core Acceptance Criteria (As-Built)

| ID | Criteria | Test Method | Pass Condition |
|----|----------|-------------|----------------|
| AC-01 | Tag được tạo với EPC unique | POST /api/tags -> GET /api/tags/:epc | Tag tồn tại |
| AC-02 | Tag được gán product thành công trong snapshot source | PATCH /api/tags/assign | `tag.productId` được set; với bulk assign hiện tại tag được đưa về `IN_WORKSHOP` |
| AC-03 | Transfer `ADMIN_TO_WORKSHOP` hoặc `WORKSHOP_TO_WAREHOUSE` hoàn thành 2 bước | Create -> confirm | `status = COMPLETED` |
| AC-04 | Transfer `WAREHOUSE_TO_CUSTOMER` hoàn thành 1 bước | Create transfer | Tạo ra `COMPLETED` ngay; `locationId` sang destination và `Tag.status = COMPLETED` |
| AC-05 | `WORKSHOP_TO_WAREHOUSE` xuất từ `WORKSHOP` bị từ chối | Create transfer sai source | Trả về validation error |
| AC-06 | Tag history chứa đủ events | GET /api/tags/:epc/history | Timeline hợp lệ |
| AC-07 | Live scan phát `scanDetected` theo thời gian thực | scanStream -> websocket listener | Client nhận update < 1s |
| AC-08 | Role enum hiện tại hoạt động đúng guard/policy | Login bằng `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF` | Endpoint trả đúng quyền |
| AC-09 | Cancel transfer hiện chỉ thành công với `ADMIN` | Gọi cancel bằng nhiều role | Chỉ `ADMIN` thành công |
| AC-10 | `SUPER_ADMIN` xem dashboard summary | GET /api/dashboard/summary | Có dữ liệu hợp lệ |
| AC-11 | EPC lạ từ `scanStream` được auto-create | Gửi EPC chưa tồn tại | Tag mới được tạo `UNASSIGNED` |
| AC-12 | `GET /api/tags` hiện hoạt động public trong snapshot source | Gọi endpoint không kèm token | Trả dữ liệu danh sách tag thành công |
| AC-13 | Transfer outbound đã `COMPLETED` vẫn có thể bị hủy bằng luồng hiện tại | Create `WAREHOUSE_TO_CUSTOMER` -> cancel bằng `ADMIN` | Transfer sang `CANCELLED`; tag quay về `sourceId` với trạng thái nội bộ phù hợp |

### 8.2 Planned Business Rules Pending Enforcement

| ID | Planned Rule | Current Status | Next Action |
|----|--------------|----------------|-------------|
| PR-01 | Chỉ cho phép đổi `productId` khi tag còn ở trạng thái nội bộ (`UNASSIGNED`, `IN_WORKSHOP`, `IN_WAREHOUSE`) | Chưa được source enforce; `tags.service.ts` vẫn cho update/assign nếu product tồn tại và bulk assign còn set status về `IN_WORKSHOP` | Sửa `PATCH /api/tags/assign` và `PATCH /api/tags/:epc` để chặn theo `TagStatus`, đồng thời không reset status sai nghiệp vụ |

Ghi chú implementation gap:

- `PR-01` là business rule đã chốt trong SRS, nhưng snapshot source hiện tại ở `backend/src/tags/tags.service.ts` chưa enforce theo `TagStatus`, nên chưa thể đưa vào nhóm acceptance as-built.

### 8.3 Security & Quality Verification

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

| Surface | Access | Purpose |
|--------|--------|---------|
| Dashboard summary | `SUPER_ADMIN` | Tổng quan KPI qua `GET /api/dashboard/summary` |
| Live scan web view | Authenticated websocket clients | Nhận `scanDetected` qua room `scan:live` |
| Dashboard aggregate websocket | `ADMIN` trong snapshot source | Nhận `inventoryUpdate` qua room `admin:dashboard` |
| Category / Product management | `ADMIN`, `SUPER_ADMIN` | Quản lý catalog |
| Tag management | `ADMIN`, `SUPER_ADMIN`; detail/history read cho role khác; list endpoint hiện public | Tra cứu EPC, assign tag, xem lịch sử; rule khóa đổi product theo `TagStatus` đang theo `PR-01` |
| Orders | Theo policy từng role | Quản lý đơn hàng |
| Sessions / scans | Theo policy từng role | Phiên quét và dữ liệu scan |
| Inventory | `ADMIN`, `SUPER_ADMIN` để mutate; read rộng hơn | Tồn kho và history |
| Transfers | `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER` theo route guard | Điều chuyển tag |
| Users | `SUPER_ADMIN` | Quản lý users |
| Activity logs | `SUPER_ADMIN` full; `WAREHOUSE_MANAGER`, `STAFF` scoped | Audit log viewer |

##### Mobile App

| Surface | Purpose |
|--------|---------|
| Reader connection | Kết nối RFID reader qua BLE |
| Live scan | Gửi `scanStream` / `liveScan` |
| Session creation | Tạo phiên quét |
| Order operations | Tạo và thao tác order theo role |
| Transfer actions | Tạo / confirm transfer theo role |

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
| Categories | GET | `/api/categories` | Auth | Category list |
| Categories | GET | `/api/categories/stats` | Auth | Category stats |
| Categories | POST/PATCH/DELETE | `/api/categories` and `/api/categories/:id` | Policy `manage Category` | Category management |
| Products | GET | `/api/products` | Auth | Product lookup |
| Products | POST/PATCH/DELETE | `/api/products` and `/api/products/:id` | Policy `manage Product` | Product management |
| Tags | GET | `/api/tags` | Public | Tag list endpoint trong snapshot source; cần security review nếu muốn thu hẹp bằng auth |
| Tags | GET | `/api/tags/:epc` | Policy `read Tag` | Tag detail |
| Tags | GET | `/api/tags/:epc/history` | Policy `read Tag` | Tag history |
| Tags | POST | `/api/tags` | Policy `create Tag` | Create tag |
| Tags | PATCH | `/api/tags/assign` | Policy `update Tag` | Bulk assign tag; snapshot source hiện set `Tag.status = IN_WORKSHOP`, chưa enforce gate theo `TagStatus` |
| Tags | PATCH | `/api/tags/:epc` | Policy `update Tag` | Update tag; business rule chặn đổi `productId` khi `IN_TRANSIT` hoặc `COMPLETED` đang theo `PR-01` |
| Tags | DELETE | `/api/tags/:epc` | Policy `delete Tag` | Soft delete tag |
| Tags | POST | `/api/tags/live` | Public | Live scan ingest |
| Orders | GET/POST | `/api/orders` | Policy `read/create Order` | Order list / create |
| Orders | GET/PATCH/DELETE | `/api/orders/:id` | Policy `read/update/delete Order` | Order detail / update / remove |
| Orders | PATCH | `/api/orders/:id/cancel` | Policy `update Order` | Cancel order |
| Sessions | GET/POST | `/api/sessions` | Policy `read/create Session` | Session list / create |
| Sessions | GET | `/api/sessions/:id` | Policy `read Session` | Session detail |
| Sessions | PATCH | `/api/sessions/:id/assign-product` | Policy `update Session` | Assign product to session |
| Inventory | POST | `/api/inventory` | Policy `create Inventory` | Bulk inventory operation |
| Inventory | GET | `/api/inventory/stock-summary` | Policy `read Inventory` | Stock summary |
| Inventory | GET | `/api/inventory/history` | Policy `read Inventory` | Inventory history |
| Locations | GET | `/api/locations` | Policy `read Location` | Location list |
| Locations | POST/PATCH/DELETE | `/api/locations` and `/api/locations/:id` | Policy `manage Location` | Location management |
| Locations | POST | `/api/locations/sync-warehouses` | Policy `update Location` | Sync workshop warehouses |
| Transfers | GET | `/api/transfers` | Auth | Transfer list |
| Transfers | GET | `/api/transfers/:id` | Auth | Transfer detail |
| Transfers | POST | `/api/transfers` | `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER` | Create transfer |
| Transfers | POST | `/api/transfers/:id/confirm` | `SUPER_ADMIN`, `WAREHOUSE_MANAGER` | Confirm transfer |
| Transfers | POST | `/api/transfers/:id/cancel` | Route: `SUPER_ADMIN`, `ADMIN`; service effective: `ADMIN` | Cancel transfer |
| Transfers | POST | `/api/transfers/:id/destination` | `ADMIN` | Update destination |
| Dashboard | GET | `/api/dashboard/summary` | Policy `read Dashboard` | Dashboard summary |
| Activity Logs | GET | `/api/activity-logs` | Policy `read ActivityLog` | Audit trail |

#### A.4 WebSocket Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `scanStream` | Client -> Server | `{epc, rssi}[]` | Mobile gửi raw scan data |
| `scanDetected` | Server -> Client room `scan:live` | `{tagId, epc, rssi, status, product, isNew}[]` | Enriched live scan update cho authenticated websocket clients |
| `inventoryUpdate` | Server -> Client room `admin:dashboard` | `{totalScanned, existingTags, newTags, timestamp}` | Aggregate dashboard update cho JWT role `ADMIN` trong snapshot source |
| `tagsUpdated` | Server -> Client | none | Tag data changed |
| `liveScan` | Server -> Client room `scan:live` | raw scan array | Pass-through live scan update |
| `sessionCreated` | Server -> Client | session payload | Session created notification |
| `transferUpdate` | Server -> All | Transfer data | Transfer status change |
| `orderUpdate` | Server -> All | Order data | Order status change |

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
| POST /api/tags | unique EPC | TAG_001 | `EPC đã tồn tại` |
| POST /api/tags | valid EPC format | TAG_002 | `EPC không hợp lệ` |
| POST /api/transfers | `ADMIN_TO_WORKSHOP` source must be `ADMIN` | TRANS_001 | `Vị trí nguồn phải là ADMIN` |
| POST /api/transfers | `WORKSHOP_TO_WAREHOUSE` source must be `WORKSHOP_WAREHOUSE` | TRANS_002 | `Vị trí xuất điều chuyển bắt buộc phải là Kho Xưởng` |
| POST /api/transfers | `WAREHOUSE_TO_CUSTOMER` source must be `WAREHOUSE` | TRANS_003 | `Vị trí nguồn phải là WAREHOUSE` |
| POST /api/transfers/:id/confirm | status must be PENDING | TRANS_004 | `Transfer không ở trạng thái PENDING` |
| POST /api/transfers/:id/cancel | role must be `ADMIN` in current service | TRANS_005 | `Chỉ ADMIN có quyền hủy phiếu điều chuyển.` |

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
    "code": "TAG_001",
    "message": "Tag with this EPC already exists",
    "details": {
      "field": "epc",
      "value": "E2 80 69 15 00 00 40 1E CC 01 11 3D"
    }
  },
  "timestamp": "2026-04-02T10:30:00.000Z",
  "path": "/api/tags"
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
enum LocationType {
  ADMIN
  WORKSHOP
  WORKSHOP_WAREHOUSE
  WAREHOUSE
  HOTEL
  RESORT
  SPA
  CUSTOMER
}

enum TransferType {
  ADMIN_TO_WORKSHOP
  WORKSHOP_TO_WAREHOUSE
  WAREHOUSE_TO_CUSTOMER
}

enum TransferStatus {
  PENDING
  COMPLETED
  CANCELLED
}

enum OrderType {
  INBOUND
  OUTBOUND
}

enum OrderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TagStatus {
  UNASSIGNED
  IN_WORKSHOP
  IN_WAREHOUSE
  IN_TRANSIT
  COMPLETED
  MISSING
}

enum Role {
  SUPER_ADMIN
  ADMIN
  WAREHOUSE_MANAGER
  STAFF
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
| Tag | Bản ghi EPC chính trong hệ thống |
| TagEvent | Lịch sử sự kiện gắn với tag |
| EPC | Mã unique cho RFID tag |
| BLE | Bluetooth Low Energy |
| Transfer | Chuyển giao giữa các location |
| Session | Phiên quét RFID |
| Scan | Bản ghi EPC/RSSI thuộc một session |
| Order | Chứng từ nghiệp vụ `INBOUND` / `OUTBOUND` |
| Workshop Warehouse | Location loại `WORKSHOP_WAREHOUSE`, dùng làm source hợp lệ cho `WORKSHOP_TO_WAREHOUSE` |
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

### Appendix G. Known As-Built vs Target-State Gaps

| Gap ID | Topic | As-Built Snapshot | Target / Decision Needed |
|--------|-------|-------------------|--------------------------|
| GAP-01 | Transfer cancel quyền | Route cho `SUPER_ADMIN`, `ADMIN`; service hiện chỉ cho `ADMIN` | Chốt lại actor nào được hủy transfer trong business baseline và sửa route/service cho đồng nhất |
| GAP-02 | Dashboard monitoring | `GET /api/dashboard/summary` là `SUPER_ADMIN`; `inventoryUpdate` websocket room lại là `ADMIN` | Quyết định có hợp nhất về một role hoặc tách rõ REST summary và live aggregate lâu dài |
| GAP-03 | Tag list exposure | `GET /api/tags` hiện public | Chốt có giữ public hay đưa về auth/RBAC |
| GAP-04 | Gate đổi product theo `TagStatus` | Business baseline chỉ cho đổi `productId` khi tag còn ở trạng thái nội bộ, nhưng source chưa enforce và bulk assign còn reset status về `IN_WORKSHOP` | Sửa `tags.service.ts` và test tương ứng để rule này thành behavior thật |
