# RIOTEX Product Development Framework

> **Product Strategy → Product Design → Product Delivery → Continuous Optimization**
>
> Tài liệu này xây dựng dựa trên codebase thực tế của hệ thống RFID Inventory Management,
> không phải lý thuyết chung chung. Mọi reference đều mapping trực tiếp vào code đang chạy.

---

## Mục lục

1. [Strategy & Alignment](#1-strategy--alignment)
2. [Solution Discovery (5S Framework)](#2-solution-discovery-5s-framework)
3. [Technical Definition](#3-technical-definition)
4. [Optimization Loop](#4-optimization-loop)
5. [Chiến lược phát triển theo giai đoạn](#5-chiến-lược-phát-triển-theo-giai-đoạn)
6. [Phụ lục: Data Model & API Reference](#6-phụ-lục-data-model--api-reference)

---

## 1. Strategy & Alignment

> **Output: Vision & Themes**

### 1.1. Problem Definition (Pain Points thực tế Riotex)

| # | Pain Point | Hậu quả | Mức độ |
|---|-----------|---------|--------|
| P1 | 2 kho (WAREHOUSE) + nhiều xưởng (WORKSHOP) → không biết chính xác bao nhiêu chăn ga gối ở đâu | Kiểm kê thủ công mất 1-2 ngày/lần, sai số 5-15% | Critical |
| P2 | Hàng chuyển từ xưởng về kho → không verify được số lượng thực nhận vs số lượng gửi | Thất thoát không phát hiện được, mất hàng âm thầm | Critical |
| P3 | Xuất hàng cho khách sạn/resort/spa → chỉ ghi sổ tay, không trace được từng sản phẩm | Không biết khách hàng nào đang giữ bao nhiêu hàng, khó đối soát | High |
| P4 | Mỗi sản phẩm (ga giường, gối, khăn...) có nhiều kích cỡ/loại → quản lý bằng Excel rời rạc | Nhầm hàng khi xuất kho, mất thời gian tra cứu | High |
| P5 | Không có lịch sử di chuyển sản phẩm → khi mất hàng không biết mất ở khâu nào | Không quy trách nhiệm, không cải thiện quy trình | Medium |
| P6 | Muốn mở rộng phục vụ khách sạn/bệnh viện → không scale được nếu tiếp tục quản lý thủ công | Giới hạn tăng trưởng kinh doanh | Strategic |

### 1.2. Vision Statement

> **"Xây dựng hệ sinh thái quản lý vòng đời chăn ga gối bằng RFID — từ sản xuất (Workshop) → nhập kho (Warehouse) → xuất cho khách hàng (Hotel/Resort/Spa) → giặt → tái sử dụng — với khả năng tracking real-time từng sản phẩm đơn lẻ qua mã EPC."**

### 1.3. Strategic Themes

| Theme | Mô tả | Mapping vào hệ thống |
|-------|-------|---------------------|
| **Real-time Inventory Visibility** | Biết chính xác số lượng và vị trí từng sản phẩm tại mọi thời điểm | Dashboard summary, Stock summary by location, Tag status tracking |
| **Lifecycle Tracking** | Theo dõi toàn bộ hành trình sản phẩm từ khi gắn RFID đến khi thanh lý | TagEvent history (CREATED → ASSIGNED → SCANNED → MOVED → MISSING) |
| **Multi-location Management** | Quản lý nhiều loại địa điểm: kho, xưởng, khách hàng | Location model với 6 loại: ADMIN, WORKSHOP, WAREHOUSE, HOTEL, RESORT, SPA |
| **Scan-to-Verify** | Xác nhận bằng scan RFID thay vì đếm tay | Transfer confirm workflow, Session-based verification, Missing tag detection |
| **Platformization** | Tiến tới SaaS cho khách sạn/bệnh viện | Multi-tenant architecture foundation, Role-based access (ADMIN, WAREHOUSE_MANAGER) |

### 1.4. Target Users (Đã implement trong hệ thống)

| User | Role trong app | Quyền hạn (CASL) | Screens chính |
|------|---------------|-------------------|---------------|
| **Quản lý / Admin** | `ADMIN` | Full access: CRUD tất cả modules, tạo transfer, quản lý user | Web Dashboard (tất cả trang) |
| **Nhân viên kho** | `WAREHOUSE_MANAGER` | Read products/categories/tags, create/update sessions & scans, confirm transfers | Mobile App (Quét thẻ, Giao dịch, Cấp thẻ) |
| **Nhân viên xưởng** | (Dùng mobile) | Scan tags tại xưởng, tạo sessions | Mobile App (Quét thẻ) |

---

## 2. Solution Discovery (5S Framework)

> **Output: Concept & Design**

### 2.1. Strategy Layer (Why — Tại sao build hệ thống này)

**Bài toán cốt lõi**: Asset Tracking + Supply Chain Visibility cho ngành chăn ga gối

**Chuỗi giá trị Riotex**:
```
Xưởng sản xuất (WORKSHOP)
    │
    │ ← Gắn RFID tag cho từng sản phẩm
    │
    ▼
Chuyển kho (WORKSHOP_TO_WAREHOUSE transfer)
    │
    │ ← Scan verify: số lượng nhận = số lượng gửi
    │
    ▼
Kho trung tâm (WAREHOUSE) × 2
    │
    │ ← Quản lý tồn kho, phân loại theo sản phẩm/danh mục
    │
    ▼
Xuất cho khách hàng (WAREHOUSE_TO_CUSTOMER transfer)
    │
    │ ← 1-step: tạo = hoàn thành ngay, tag → OUT_OF_STOCK
    │
    ▼
Khách hàng (HOTEL / RESORT / SPA)
    │
    │ ← [Phase tương lai] Tracking giặt, tuổi thọ sản phẩm
    │
    ▼
[Tương lai] Thu hồi / Thanh lý
```

**Tech core đã triển khai**:
- RFID scanning qua Bluetooth Low Energy (ST-H103 UHF reader)
- Mobile app (React Native + Expo) cho nhân viên scan
- Web dashboard (Next.js) cho quản lý
- Real-time WebSocket cho live tracking
- REST API (NestJS) xử lý business logic

### 2.2. Scope Layer (What — Feature nào, ưu tiên gì)

#### Phase 1 — Core MVP (Đã hoàn thành)

| Feature | Module | Status | Chi tiết |
|---------|--------|--------|----------|
| Gắn RFID tag cho sản phẩm | `tags/`, `products/` | Done | Mỗi tag có EPC duy nhất, gán vào Product qua `productId` |
| Scan bằng điện thoại | Mobile `BLEService` | Done | Kết nối ST-H103 qua BLE, parse BB/CF protocol |
| Dashboard tổng quan | `dashboard/` | Done | Tổng products, tags, categories, users + tag status breakdown |
| Tồn kho theo kho | `inventory/` | Done | Stock summary theo product/category, CHECK_IN/CHECK_OUT operations |
| Lịch sử di chuyển tag | `TagEvent` model | Done | Timeline: CREATED → ASSIGNED → SCANNED → MOVED → MISSING |
| Quản lý sản phẩm & danh mục | `products/`, `categories/` | Done | CRUD với SKU, pagination, search, category filter |
| Quản lý locations | `locations/` | Done | 6 loại: ADMIN, WORKSHOP, WAREHOUSE, HOTEL, RESORT, SPA |
| Authentication & Authorization | `auth/`, `casl/` | Done | JWT + refresh token, RBAC (ADMIN, WAREHOUSE_MANAGER) |

#### Phase 2 — Workflow Management (Đã hoàn thành)

| Feature | Module | Status | Chi tiết |
|---------|--------|--------|----------|
| Transfer xưởng → kho | `transfers/` | Done | WORKSHOP_TO_WAREHOUSE, 2-step: PENDING → confirm → COMPLETED |
| Scan verify nhập kho | `transfers/` confirm | Done | Tất cả items phải có `scannedAt` trước khi complete |
| Transfer kho → khách hàng | `transfers/` | Done | WAREHOUSE_TO_CUSTOMER, 1-step: tạo = COMPLETED ngay |
| Đơn hàng nhập/xuất | `orders/`, `sessions/` | Done | INBOUND/OUTBOUND orders với quantity tracking |
| Live scanning real-time | `events/` gateway | Done | WebSocket broadcast scan data tới dashboard |
| Activity logging | `activity-log/` | Done | Interceptor-based audit trail cho mọi HTTP request |

#### Phase 3 — Extended (Kế hoạch)

| Feature | Status | Mục tiêu |
|---------|--------|----------|
| Alert: Missing items | Partial | Phát hiện tag "mất tích" qua session comparison |
| Alert: Overdue items | Planned | Tag ở khách hàng quá lâu không quay về |
| Import Excel hàng loạt | Partial | `seed-excel.ts` có sẵn, UI "Import Excel" đã có link trên Sidebar |
| Export báo cáo | Planned | UI "Export Reports" đã có link trên Sidebar |
| Reconciliation (kiểm kê) | Framework | Session entity hỗ trợ, workflow chưa build |

#### Phase 4 — Platform/SaaS (Kế hoạch dài hạn)

| Feature | Status | Mục tiêu |
|---------|--------|----------|
| Laundry tracking (số lần giặt) | Planned | Tracking vòng đời: giặt → sử dụng → giặt |
| Loss rate reporting (% thất thoát) | Planned | So sánh tag assigned vs tag missing theo thời gian |
| Lifecycle prediction (tuổi thọ) | Planned | Dự đoán khi nào cần thay sản phẩm dựa trên số lần giặt |
| Multi-tenant (khách sạn chains) | Planned | Mỗi chuỗi khách sạn có tenant riêng |
| Subscription model | Planned | SaaS billing theo số tag/location |

### 2.3. Skeleton Layer (UX Flow — Luồng người dùng chính)

#### Flow 1: Gắn RFID tag cho sản phẩm mới (Mobile — CapTheScreen)

```
┌─────────────────────────────────────────────────────────┐
│  NHÂN VIÊN KHO mở app → Tab "Cấp Thẻ"                 │
│                                                         │
│  1. Tìm kiếm sản phẩm (search by name/SKU)            │
│     → GET /api/products?limit=1000                      │
│     → Chọn sản phẩm (ví dụ: "Ga giường King Size")    │
│                                                         │
│  2. Bắt đầu scan RFID                                  │
│     → BLEService.batDauQuet()                          │
│     → Gửi lệnh BB 00 27 00 03 22 FF FF 4A 7E          │
│     → Nhận data: EPC + RSSI từng tag                    │
│     → Chỉ lấy tag scan SAU khi chọn sản phẩm          │
│                                                         │
│  3. Xác nhận gán tag                                    │
│     → Hiển thị danh sách EPC đã scan                    │
│     → Bấm "Gán thẻ"                                    │
│     → PATCH /api/tags/assign {productId, tagIds}        │
│     → Update local cache tên tag ngay lập tức           │
│                                                         │
│  4. Tiếp tục scan cho sản phẩm khác                    │
│     → Reset session → quay lại bước 1                   │
└─────────────────────────────────────────────────────────┘
```

#### Flow 2: Chuyển hàng từ xưởng về kho (Web — Admin tạo, Mobile — Kho verify)

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN tạo transfer trên Web Dashboard                  │
│                                                         │
│  1. Tạo transfer                                        │
│     → POST /api/transfers                               │
│     → type: WORKSHOP_TO_WAREHOUSE                       │
│     → source: Workshop A (LocationType = WORKSHOP)      │
│     → destination: Kho 1 (LocationType = WAREHOUSE)     │
│     → tagIds: [list các tag cần chuyển]                 │
│     → Validate: tags phải đang ở source location        │
│     → Validate: tags không trong transfer PENDING khác  │
│     → Status = PENDING                                  │
│     → Code auto-gen: TRF-{timestamp}-{hex}              │
│                                                         │
│  2. Nhân viên kho SCAN VERIFY (Mobile/Web)              │
│     → Scan từng tag bằng RFID reader                    │
│     → Hệ thống match EPC với transfer items             │
│     → Update scannedAt cho mỗi item đã scan             │
│                                                         │
│  3. Xác nhận hoàn tất                                   │
│     → POST /api/transfers/:id/confirm                   │
│     → Validate: TẤT CẢ items phải có scannedAt          │
│     → Update tag.locationId = destination                │
│     → Update tag.status = IN_STOCK                      │
│     → Update transfer.status = COMPLETED                │
│     → WebSocket broadcast: transferUpdate               │
│                                                         │
│  ⚠️ Nếu scan thiếu → không cho confirm                 │
│  ⚠️ Nếu cần hủy → POST /api/transfers/:id/cancel       │
│     (chỉ ADMIN, chỉ khi PENDING)                       │
└─────────────────────────────────────────────────────────┘
```

#### Flow 3: Xuất hàng cho khách hàng (Web — 1-step workflow)

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN xuất hàng cho khách hàng                         │
│                                                         │
│  1. Tạo transfer                                        │
│     → POST /api/transfers                               │
│     → type: WAREHOUSE_TO_CUSTOMER                       │
│     → source: Kho 1 (WAREHOUSE)                         │
│     → destination: Sunrise Hotel (HOTEL)                │
│     → tagIds: [list tags cần xuất]                      │
│                                                         │
│  2. Hệ thống tự động hoàn tất (1-STEP)                 │
│     → Validate: tags phải IN_STOCK tại source           │
│     → Status = COMPLETED ngay lập tức                   │
│     → tag.locationId = destination (khách hàng)         │
│     → tag.status = OUT_OF_STOCK                         │
│     → completedAt = now()                               │
│                                                         │
│  → Không cần scan verify (khách hàng không scan)        │
│  → Tracking chỉ 1 chiều: xuất ra, không confirm nhận   │
└─────────────────────────────────────────────────────────┘
```

#### Flow 4: Quét kiểm kê hàng ngày (Mobile — QuetTheScreen)

```
┌─────────────────────────────────────────────────────────┐
│  NHÂN VIÊN KHO kiểm kê tồn kho                        │
│                                                         │
│  1. Mở app → Tab "Quét Thẻ" (auto-start scan)         │
│     → BLEService gửi START_INVENTORY                    │
│     → Nhận liên tục: EPC + RSSI                         │
│                                                         │
│  2. Realtime display                                    │
│     → Tổng tags | Có mặt (✅) | Vắng mặt (❌)         │
│     → Mỗi tag: tên, EPC, RSSI (color-coded), count     │
│     → Live push → POST /api/tags/live                   │
│     → WebSocket broadcast → Web dashboard               │
│                                                         │
│  3. Phát hiện MISSING tags                              │
│     → Tags đã scan trước nhưng phiên này không thấy     │
│     → Đánh dấu ❌ trên danh sách                       │
│     → TagEvent MISSING được tạo trên server              │
│                                                         │
│  4. Lưu phiên                                           │
│     → POST /api/sessions                                │
│     → Lưu tất cả scans với EPC, RSSI, timestamp         │
│     → Nếu offline → lưu AsyncStorage, sync sau          │
└─────────────────────────────────────────────────────────┘
```

#### Flow 5: Thực hiện đơn hàng nhập/xuất (Mobile — GiaoDichScreen)

```
┌─────────────────────────────────────────────────────────┐
│  NHÂN VIÊN KHO thực hiện đơn hàng                      │
│                                                         │
│  1. Mở app → Tab "Giao Dịch"                           │
│     → GET /api/orders?limit=100                         │
│     → Hiển thị đơn PENDING / IN_PROGRESS                │
│     → Mỗi đơn: code, loại (NHẬP/XUẤT), items, progress │
│                                                         │
│  2. Chọn đơn hàng → Bắt đầu scan                      │
│     → Hiển thị checklist: sản phẩm, SL yêu cầu, đã quét│
│     → Bấm "Bắt đầu Quét" → RFID scan                  │
│     → Match tag → product name → order item              │
│     → Cập nhật progress realtime                        │
│                                                         │
│  3. Nộp kết quả                                         │
│     → POST /api/sessions {orderId, scans}               │
│     → Server update OrderItem.scannedQuantity            │
│     → Auto transition: PENDING → IN_PROGRESS → COMPLETED│
│     → Tags update status: IN_STOCK hoặc OUT_OF_STOCK    │
│     → WebSocket broadcast: orderUpdate                  │
└─────────────────────────────────────────────────────────┘
```

#### Flow 6: Tìm thẻ bị thất lạc (Mobile — TimTheScreen)

```
┌─────────────────────────────────────────────────────────┐
│  NHÂN VIÊN tìm tag cụ thể bằng "radar"                 │
│                                                         │
│  1. Mở app → Tab "Tìm Thẻ"                             │
│     → Tìm kiếm theo tên hoặc EPC                       │
│     → Chọn tag cần tìm                                  │
│                                                         │
│  2. Chế độ Radar                                        │
│     → Auto-start scan                                   │
│     → Hiển thị vòng tròn pulsing + % signal strength    │
│     → RSSI range -90 → -30 dBm = 0% → 100%            │
│     → Màu: 🔴 <20% | 🟠 20-50% | 🟡 50-80% | 🟢 >80% │
│     → Hint: "Sản phẩm ở rất gần!" / "Di chuyển quét..."│
│     → Update mỗi 500ms, signal timeout 1.5s             │
│                                                         │
│  → Use case: tìm ga giường bị lẫn trong đống hàng      │
└─────────────────────────────────────────────────────────┘
```

### 2.4. Surface Layer (UI/UX — Giao diện thực tế)

#### Mobile App (5 Tab chính)

| Tab | Icon | Screen | Chức năng chính |
|-----|------|--------|----------------|
| Kết Nối | 🔗 | `KetNoiScreen` | Tìm và kết nối RFID reader qua BLE |
| Giao Dịch | 📋 | `GiaoDichScreen` | Thực hiện đơn hàng nhập/xuất kho |
| Quét Thẻ | 📡 | `QuetTheScreen` | Scan RFID realtime, kiểm kê, lưu phiên |
| Cấp Thẻ | 🏷️ | `CapTheScreen` | Gán RFID tag cho sản phẩm |
| Tìm Thẻ | 🔍 | `TimTheScreen` | Radar tìm tag cụ thể theo RSSI |

**UX Key Principles đã áp dụng**:
- Scan 1-click: mở tab → auto-start scan (QuetTheScreen)
- Trạng thái rõ ràng: 🟢 có mặt / 🔴 vắng mặt
- Signal strength color-coded: xanh (mạnh) → đỏ (yếu)
- Offline-first: lưu local → sync khi có mạng
- Long-press để đổi tên tag (không cần vào menu)

#### Web Dashboard (11 trang)

| Trang | Route | Chức năng |
|-------|-------|----------|
| Dashboard | `/` | Tổng quan: stats cards, tag status breakdown, recent activity |
| Danh mục | `/categories` | CRUD danh mục sản phẩm |
| Sản phẩm | `/products` | CRUD sản phẩm với SKU, filter theo category |
| Thẻ RFID | `/tags` | Quản lý tags, bulk edit, timeline history |
| Đơn hàng | `/orders` | Tạo/theo dõi đơn nhập/xuất với progress bar |
| Tồn kho | `/inventory` | Stock summary, category distribution, CHECK_IN/CHECK_OUT |
| Phiên quét | `/sessions` | Lịch sử các phiên scan |
| Users | `/users` | Quản lý tài khoản (Admin only) |
| Activity Logs | `/activity-logs` | Audit trail (Admin only) |
| Login | `/login` | Đăng nhập |

---

## 3. Technical Definition

> **Output: Build Planning — Architecture, Tech Stack, Data Model, API Design**

### 3.1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │   Mobile App      │    │      Web Dashboard                │   │
│  │   React Native    │    │      Next.js 16                   │   │
│  │   Expo SDK 55     │    │      React 19 + Tailwind 4        │   │
│  │                   │    │      React Query 5 + React Table  │   │
│  │  ┌─────────────┐ │    │                                    │   │
│  │  │ BLE Service │ │    │  ┌────────────────────────────┐   │   │
│  │  │ (ble-plx)   │ │    │  │ Socket.IO Client           │   │   │
│  │  └──────┬──────┘ │    │  │ (Live Capture page)        │   │   │
│  │         │BLE     │    │  └─────────────┬──────────────┘   │   │
│  │  ┌──────▼──────┐ │    │                │                   │   │
│  │  │ ST-H103 UHF │ │    │                │                   │   │
│  │  │ RFID Reader │ │    │                │                   │   │
│  │  └─────────────┘ │    │                │                   │   │
│  └────────┬─────────┘    └────────────────┤───────────────────┘   │
│           │ HTTP/REST                     │ HTTP + WebSocket      │
└───────────┼───────────────────────────────┼───────────────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS 11)                          │
│                     Port: 3000                                   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │   Tags   │  │ Transfer │  │   Events     │   │
│  │ JWT+CASL │  │ CRUD+Live│  │ Workflow │  │  Gateway     │   │
│  │ Passport │  │ Assign   │  │ 2-step   │  │  Socket.IO   │   │
│  └──────────┘  └──────────┘  │ 1-step   │  └──────────────┘   │
│                               └──────────┘                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Products │  │ Sessions │  │  Orders  │  │  Inventory   │   │
│  │ + Categ. │  │ + Scans  │  │ IN/OUT   │  │  Check-in/out│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Location │  │Dashboard │  │ Users    │  │ ActivityLog  │   │
│  │ 6 types  │  │ Summary  │  │ RBAC     │  │ Interceptor  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Prisma ORM 7.5 + PostgreSQL 15              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2. Tech Stack (Đang chạy thực tế)

| Layer | Technology | Version | Vai trò |
|-------|-----------|---------|---------|
| **Backend Framework** | NestJS | 11.0.1 | Modular monolith, dependency injection |
| **ORM** | Prisma | 7.5.0 | Type-safe database access, migrations |
| **Database** | PostgreSQL | 15 | Primary data store |
| **Auth** | Passport + JWT | 11.0.0 / 11.0.0 | Access token (short) + Refresh token (7 days) |
| **Authorization** | CASL | 6.8.0 | Role-based access control (ADMIN, WAREHOUSE_MANAGER) |
| **Real-time** | Socket.IO | 4.8.3 | WebSocket for live scan, transfer updates |
| **API Docs** | Swagger | - | Available at `/api/docs` |
| **Rate Limiting** | @nestjs/throttler | - | 100 req/60s global |
| **Web Framework** | Next.js | 16.1.6 | React Server Components + Client Components |
| **Web UI** | React + Tailwind | 19.2.3 / 4 | Component-based UI with utility CSS |
| **Server State** | React Query | 5.90.21 | Caching, auto-refresh, optimistic updates |
| **Tables** | React Table | 8.21.3 | Sortable, filterable data tables |
| **Mobile Framework** | React Native + Expo | 0.83.2 / SDK 55 | Cross-platform mobile app |
| **BLE** | react-native-ble-plx | 3.5.1 | Bluetooth Low Energy communication |
| **Mobile State** | Zustand | 5.0.11 | Lightweight state management |
| **Offline Storage** | AsyncStorage | - | Local persistence for offline mode |
| **Navigation** | React Navigation | 7.1.31 | Tab + Stack navigation |
| **Language** | TypeScript | 5.7.3 | Type safety across all projects |

### 3.3. Data Model (Prisma Schema)

```
┌─────────────────────────────────────────────────────────────┐
│                      CORE ENTITIES                           │
│                                                              │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐               │
│  │  User   │    │ Category │    │ Location │               │
│  │─────────│    │──────────│    │──────────│               │
│  │ id      │    │ id       │    │ id       │               │
│  │ username│    │ name     │    │ name     │               │
│  │ password│    │ code     │    │ code     │               │
│  │ role    │    │ desc     │    │ type     │←── LocationType│
│  │ (ADMIN/ │    └────┬─────┘    │ address  │    ADMIN      │
│  │  WH_MGR)│         │          │ contact* │    WORKSHOP   │
│  └────┬────┘         │          │ isActive │    WAREHOUSE  │
│       │              │          └────┬─────┘    HOTEL      │
│       │              │               │          RESORT     │
│       │         ┌────▼─────┐   ┌────▼─────┐    SPA        │
│       │         │ Product  │   │   Tag    │               │
│       │         │──────────│   │──────────│               │
│       │         │ id       │   │ id       │               │
│       │         │ name     │◄──┤ epc      │ (unique)      │
│       │         │ sku      │   │ status   │←── TagStatus  │
│       │         │ categoryId│   │ productId│    IN_STOCK   │
│       │         │ desc     │   │ locationId    OUT_OF_STOCK│
│       │         │ tagCount │   │ name     │    IN_TRANSIT  │
│       │         └──────────┘   │ customerId    MISSING     │
│       │                        └────┬─────┘               │
│       │                             │                      │
│  ┌────▼──────────────────────┐ ┌────▼─────┐               │
│  │       Transfer            │ │ TagEvent │               │
│  │───────────────────────────│ │──────────│               │
│  │ id, code                  │ │ id       │               │
│  │ type (TransferType)       │ │ tagId    │               │
│  │   WORKSHOP_TO_WAREHOUSE   │ │ type     │←── EventType  │
│  │   WAREHOUSE_TO_CUSTOMER   │ │  CREATED │               │
│  │ status (TransferStatus)   │ │  ASSIGNED│               │
│  │   PENDING                 │ │  SCANNED │               │
│  │   IN_TRANSIT              │ │  MOVED   │               │
│  │   COMPLETED               │ │  MISSING │               │
│  │   CANCELLED               │ │ data     │ (JSON)        │
│  │ sourceId → Location       │ │ timestamp│               │
│  │ destinationId → Location  │ └──────────┘               │
│  │ createdById → User        │                             │
│  │ items[] → TransferItem    │                             │
│  └───────────────────────────┘                             │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │    Order      │  │   Session     │  │  ActivityLog   │  │
│  │───────────────│  │───────────────│  │────────────────│  │
│  │ id, code      │  │ id, name      │  │ id             │  │
│  │ type (IN/OUT) │  │ startTime     │  │ action         │  │
│  │ status        │  │ endTime       │  │ entity         │  │
│  │ items[] →     │  │ scans[] →     │  │ entityId       │  │
│  │  OrderItem    │  │  Scan         │  │ details (JSON) │  │
│  │  (product,    │  │  (epc, rssi,  │  │ userId         │  │
│  │   qty,        │  │   time, tagId)│  │ timestamp      │  │
│  │   scannedQty) │  │ orderId?      │  └────────────────┘  │
│  └───────────────┘  └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.4. RFID Communication Protocol

**Hardware**: ST-H103 UHF RFID Hand Reader (Bluetooth Low Energy)

| Spec | Value |
|------|-------|
| Connection | BLE (Bluetooth Low Energy) |
| Service UUID | `0000FFE0-0000-1000-8000-00805F9B34FB` |
| Write Characteristic | `0000FFE3-...` |
| Notify Characteristic | `0000FFE4-...` |
| MTU Size | 512 bytes |
| Protocol | BB Protocol (primary) + CF Protocol (fallback) |
| Buffer | Circular 8192 bytes, keep last 2048 on overflow |

**BB Protocol Packet Format**:
```
[0xBB] [Type] [Cmd] [LenH] [LenL] [Payload...] [Checksum] [0x7E]
```

| Command | Hex Bytes | Mô tả |
|---------|-----------|--------|
| START_INVENTORY | `BB 00 27 00 03 22 FF FF 4A 7E` | Bắt đầu quét liên tục |
| STOP_INVENTORY | `BB 00 28 00 00 28 7E` | Dừng quét |
| SINGLE_INVENTORY | `BB 00 22 00 00 22 7E` | Quét 1 lần |
| SET_OUTPUT_BLE | `BB 00 F1 00 01 01 F3 7E` | Chuyển output sang BLE |
| GET_VERSION | `BB 00 03 00 01 01 05 7E` | Lấy firmware version |

**Tag Response Parsing**:
```
Payload: [RSSI 1-byte] [PC 2-bytes] [EPC n-bytes]

RSSI: raw > 127 ? raw - 256 : -raw (dBm)
PC:   Protocol Control (thường 0x0000)
EPC:  Electronic Product Code (12 bytes typical, hex string)
      Ví dụ: "E2 80 69 15 00 00 40 1E CC 01 11 3D"
```

### 3.5. API Design (REST + WebSocket)

#### REST Endpoints

| Module | Method | Endpoint | Auth | Mô tả |
|--------|--------|----------|------|--------|
| **Auth** | POST | `/api/auth/login` | Public | Login → access + refresh token |
| | POST | `/api/auth/refresh` | Public | Refresh access token |
| | POST | `/api/auth/logout` | Auth | Revoke refresh token |
| **Users** | GET/POST/PATCH/DELETE | `/api/users[/:id]` | Admin | CRUD users |
| **Categories** | GET/POST/PATCH/DELETE | `/api/categories[/:id]` | Admin write, All read | CRUD categories |
| **Products** | GET/POST/PATCH/DELETE | `/api/products[/:id]` | Admin write, All read | CRUD products (search, categoryId filter) |
| **Tags** | GET | `/api/tags` | Public | List tags (search, productId, status filter) |
| | GET | `/api/tags/:epc` | Auth | Tag by EPC |
| | GET | `/api/tags/:epc/history` | Auth | Tag event timeline |
| | POST | `/api/tags` | Auth | Create tag + CREATED event |
| | PATCH | `/api/tags/:epc` | Auth | Update tag |
| | PATCH | `/api/tags/assign` | Auth | Bulk assign tags to product |
| | POST | `/api/tags/live` | Public | Emit live scan → WebSocket |
| | DELETE | `/api/tags/:epc` | Admin | Delete tag |
| **Locations** | GET/POST/PATCH/DELETE | `/api/locations[/:id]` | Admin write, All read | CRUD locations (type filter, soft delete) |
| **Transfers** | POST | `/api/transfers` | Admin | Create transfer |
| | POST | `/api/transfers/:id/confirm` | WH_Manager | Confirm (scan verify) |
| | POST | `/api/transfers/:id/cancel` | Admin | Cancel PENDING transfer |
| | GET | `/api/transfers[/:id]` | Auth | List/detail transfers |
| **Orders** | GET/POST | `/api/orders[/:id]` | Auth | CRUD orders |
| **Sessions** | GET/POST | `/api/sessions[/:id]` | WH_Manager | CRUD sessions + order fulfillment |
| **Inventory** | POST | `/api/inventory` | Auth | CHECK_IN / CHECK_OUT operations |
| | GET | `/api/inventory/stock-summary` | Auth | Stock by product/category |
| | GET | `/api/inventory/history` | Auth | Check-in/out history |
| **Dashboard** | GET | `/api/dashboard/summary` | Auth | Overview stats |
| **Activity** | GET | `/api/activity-logs` | Auth | Audit trail (non-admin: own only) |

#### WebSocket Events (Socket.IO)

| Event | Direction | Data | Mô tả |
|-------|-----------|------|--------|
| `scanStream` | Client → Server | `{epc, rssi}[]` | Gửi raw scan data |
| `liveScan` | Server → Client | `{epc, rssi, tagId, product, isNew}` | Broadcast enriched scan |
| `scanDetected` | Server → Client | Same as liveScan | Alternative event name |
| `inventoryUpdate` | Server → Admin | `{totalTags, newTags, summary}` | Dashboard update |
| `tagsUpdated` | Server → All | - | Tag data changed |
| `sessionCreated` | Server → All | Session data | New session saved |
| `transferUpdate` | Server → All | Transfer data | Transfer status changed |
| `orderUpdate` | Server → All | Order data | Order progress changed |

**Connection**: JWT token trong `auth.token` hoặc `Authorization` header. ADMIN auto-join `admin:dashboard` room.

### 3.6. Authentication & Authorization

```
┌──────────────────────────────────────────────────────┐
│                  AUTH FLOW                             │
│                                                       │
│  Login:                                               │
│  username + password                                  │
│       │                                               │
│       ▼                                               │
│  LocalStrategy → validate → bcrypt.compare            │
│       │                                               │
│       ▼                                               │
│  AuthService.login()                                  │
│       │                                               │
│       ├─→ Access Token (JWT, short-lived)              │
│       │   Payload: {sub: userId, username, role}       │
│       │                                               │
│       └─→ Refresh Token (7 days)                      │
│           Hashed SHA256 → stored in DB                │
│           Supports revocation                         │
│                                                       │
│  Protected Routes:                                    │
│  JwtAuthGuard (global, except @Public())              │
│       │                                               │
│       ▼                                               │
│  RolesGuard → @Roles('ADMIN')                        │
│       │                                               │
│       ▼                                               │
│  CASL PoliciesGuard → fine-grained permissions        │
│                                                       │
│  ADMIN: manage ALL                                    │
│  WAREHOUSE_MANAGER:                                   │
│    ✅ Read: Category, Product, Tag                     │
│    ✅ Create/Update: Tag, Session, Scan               │
│    ❌ Cannot: manage User, Dashboard                  │
│    ❌ Cannot: delete Tag, CUD Category/Product        │
└──────────────────────────────────────────────────────┘
```

### 3.7. Transfer Workflow State Machine

```
                    WORKSHOP_TO_WAREHOUSE
                    ─────────────────────

    ┌─────────┐   Admin tạo    ┌───────────┐   WH_Mgr confirm   ┌───────────┐
    │  START  │──────────────►│  PENDING  │──────────────────►│ COMPLETED │
    └─────────┘               └─────┬─────┘                   └───────────┘
                                    │                          Tags:
                                    │ Admin cancel             - locationId = destination
                                    ▼                          - status = IN_STOCK
                              ┌───────────┐
                              │ CANCELLED │
                              └───────────┘


                    WAREHOUSE_TO_CUSTOMER
                    ─────────────────────

    ┌─────────┐   Admin tạo (1-step)   ┌───────────┐
    │  START  │───────────────────────►│ COMPLETED │
    └─────────┘                        └───────────┘
                                        Tags:
                                        - locationId = customer
                                        - status = OUT_OF_STOCK

    Validation Rules:
    ├─ WORKSHOP_TO_WAREHOUSE: source=WORKSHOP, dest=WAREHOUSE
    ├─ WAREHOUSE_TO_CUSTOMER: source=WAREHOUSE, dest=HOTEL/RESORT/SPA
    ├─ Tags must exist at source location
    ├─ Tags cannot be in another PENDING transfer
    └─ Confirm requires ALL items scanned (scannedAt != null)
```

---

## 4. Optimization Loop

> **Think → Make → Check → Feedback → Iterate**

### 4.1. Đã hoàn thành (5 Iterations)

| Iteration | Think | Make | Check | Result |
|-----------|-------|------|-------|--------|
| **Phase 1** | Cần Location model thay vì freeform string | Location entity + LocationType enum + 5 seed locations + Tag.locationId FK | Migration chạy OK, queries hoạt động | Location infrastructure solid |
| **Phase 2** | Cần Transfer workflow xưởng↔kho | Transfer + TransferItem models, TransfersModule, LocationsModule CRUD | Transfer create/confirm/cancel OK, import paths fixed | Workshop management done |
| **Phase 3** | Cần verify scan khi nhập kho | WORKSHOP_TO_WAREHOUSE logic với scan verification, tag location update on COMPLETED | Tags update đúng location và status sau confirm | Warehouse transfer done |
| **Phase 4** | Cần quản lý khách hàng (hotel/resort/spa) | HOTEL/RESORT/SPA LocationType, WAREHOUSE_TO_CUSTOMER TransferType, seed customer locations | Customer locations tạo OK, transfer validation đúng | Customer management done |
| **Phase 5** | Xuất hàng cho khách = 1-step (không cần confirm) | WAREHOUSE_TO_CUSTOMER auto-complete, tag → OUT_OF_STOCK ngay | 1-step workflow hoạt động, tags chuyển status đúng | Outbound flow done |

### 4.2. Iteration tiếp theo (Đề xuất)

#### Iteration 6: Dashboard Analytics & Reporting
- **Think**: Admin cần báo cáo tồn kho theo location, trend thất thoát
- **Make**: Charts, export Excel/PDF, scheduled reports
- **Check**: Data accuracy vs physical count
- **Metrics**: Sai số < 1% so với kiểm kê thực tế

#### Iteration 7: Alert System
- **Think**: Missing tags cần thông báo ngay, không đợi kiểm kê
- **Make**: Push notification khi tag MISSING, email alert cho overdue items
- **Check**: False positive rate, alert fatigue
- **Metrics**: Phát hiện thất thoát trong < 24h

#### Iteration 8: Laundry Tracking
- **Think**: Khách sạn cần track: gửi giặt → nhận lại → sử dụng
- **Make**: Laundry cycle model, scan trước/sau giặt, lifecycle counter
- **Check**: Pilot 1-2 khách sạn, đo adoption rate
- **Metrics**: 100% tracking accuracy, scan time < 3s/item

#### Iteration 9: SaaS Platform
- **Think**: Scale cho nhiều khách sạn/bệnh viện
- **Make**: Multi-tenant, subscription billing, self-service onboarding
- **Check**: Pilot 5-10 customers
- **Metrics**: Onboarding < 1 ngày, churn < 5%/tháng

### 4.3. KPIs theo từng giai đoạn

| Giai đoạn | KPI | Target | Cách đo |
|-----------|-----|--------|---------|
| MVP | Scan speed | < 1s/tag | Đo từ RFID scan → hiển thị trên app |
| MVP | Inventory accuracy | > 95% | So sánh system count vs physical count |
| MVP | User adoption | 100% nhân viên kho | Tracking login + session count |
| Extended | Missing detection time | < 24h | Thời gian từ mất → alert |
| Extended | Loss rate | < 2%/tháng | Tags MISSING / Total tags |
| Platform | Onboarding time | < 1 ngày | Từ signup → first scan |
| Platform | System uptime | > 99.5% | Monitoring |

---

## 5. Chiến lược phát triển theo giai đoạn

### Giai đoạn 1 — Internal Digitization (Đã hoàn thành)

**Mục tiêu**: 100% visibility tồn kho nội bộ Riotex

| Deliverable | Status | Chi tiết |
|-------------|--------|----------|
| RFID tagging toàn bộ inventory | ✅ Done | Tag model + CapTheScreen (mobile) |
| App scan cho nhân viên kho | ✅ Done | 5 screens: Kết nối, Quét, Cấp, Giao dịch, Tìm |
| Dashboard basic | ✅ Done | 11 trang web: dashboard, tags, products, inventory... |
| Transfer xưởng → kho | ✅ Done | 2-step workflow với scan verification |
| Transfer kho → khách hàng | ✅ Done | 1-step workflow (auto-complete) |
| Auth + RBAC | ✅ Done | JWT + CASL (ADMIN, WAREHOUSE_MANAGER) |
| Real-time scanning | ✅ Done | WebSocket broadcast live scan data |
| Offline mobile | ✅ Done | AsyncStorage + sync queue |

**Seed Data sẵn có**:
- 1 Admin user (admin / admin123)
- 3 categories mẫu
- 8 locations (1 ADMIN, 2 WORKSHOP, 2 WAREHOUSE, 1 HOTEL, 1 RESORT, 1 SPA)
- 3 products mẫu

### Giai đoạn 2 — Process Optimization (Tiếp theo)

**Mục tiêu**: Giảm thất thoát, tăng tốc vận hành

| Deliverable | Priority | Effort |
|-------------|----------|--------|
| Alert: missing items (push notification) | High | Medium |
| Alert: overdue items tại khách hàng | High | Medium |
| Import Excel hàng loạt (UI đã có link) | High | Low (seed-excel.ts sẵn) |
| Export báo cáo PDF/Excel (UI đã có link) | High | Medium |
| Reconciliation workflow (kiểm kê định kỳ) | Medium | High |
| Dashboard charts (trend, pie, bar) | Medium | Medium |
| Mobile UX optimization (scan friction) | Medium | Low |
| Batch transfer (multi-select tags) | Low | Medium |

### Giai đoạn 3 — External Expansion (6-12 tháng)

**Mục tiêu**: Deploy cho khách sạn/bệnh viện, tạo giá trị cho khách hàng

| Deliverable | Priority | Effort |
|-------------|----------|--------|
| Laundry tracking (scan trước/sau giặt) | High | High |
| Customer portal (khách sạn tự xem inventory) | High | High |
| Loss rate reporting (% thất thoát) | High | Medium |
| Lifecycle tracking (số lần giặt → tuổi thọ) | Medium | Medium |
| Delivery confirmation workflow | Medium | Medium |
| QR code fallback (cho locations không có RFID reader) | Low | Low |

### Giai đoạn 4 — Platform & Scale (12+ tháng)

**Mục tiêu**: SaaS platform, subscription model

| Deliverable | Priority | Effort |
|-------------|----------|--------|
| Multi-tenant architecture | Critical | Very High |
| Subscription billing | High | High |
| Self-service onboarding | High | High |
| Data analytics (demand forecasting) | Medium | High |
| Lifecycle prediction (AI/ML) | Medium | Very High |
| API marketplace (third-party integrations) | Low | High |
| White-label option | Low | Medium |

---

## 6. Phụ luc: Data Model & API Reference

### 6.1. Enum Values

```typescript
// Location Types
enum LocationType {
  ADMIN        // Trụ sở chính
  WORKSHOP     // Xưởng sản xuất
  WAREHOUSE    // Kho hàng
  HOTEL        // Khách sạn
  RESORT       // Resort
  SPA          // Spa
}

// Tag Status
enum TagStatus {
  IN_STOCK      // Đang trong kho
  OUT_OF_STOCK  // Đã xuất / hết hàng
  IN_TRANSIT    // Đang vận chuyển
  MISSING       // Mất / không tìm thấy
}

// Transfer Types
enum TransferType {
  WORKSHOP_TO_WAREHOUSE    // Xưởng → Kho (2-step)
  WAREHOUSE_TO_CUSTOMER    // Kho → Khách hàng (1-step)
}

// Transfer Status
enum TransferStatus {
  PENDING      // Chờ xác nhận
  IN_TRANSIT   // Đang vận chuyển
  COMPLETED    // Hoàn thành
  CANCELLED    // Đã hủy
}

// Order Types
enum OrderType {
  INBOUND   // Nhập kho
  OUTBOUND  // Xuất kho
}

// Event Types (Tag History)
enum EventType {
  CREATED    // Tag mới được tạo
  ASSIGNED   // Gán vào sản phẩm
  SCANNED    // Được scan trong phiên
  MOVED      // Di chuyển location
  MISSING    // Phát hiện mất
}

// User Roles
enum Role {
  ADMIN              // Toàn quyền
  WAREHOUSE_MANAGER  // Nhân viên kho
}
```

### 6.2. Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/rfid_inventory
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
PORT=3000
CORS_ORIGINS=http://localhost:3001

# Web (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 6.3. Seed Data (Default)

```
Users:
  admin / admin123 (ADMIN)

Categories:
  Ga Giường, Gối, Khăn (3 categories)

Locations:
  Trụ sở Riotex      (ADMIN)
  Xưởng A             (WORKSHOP)
  Xưởng B             (WORKSHOP)
  Kho Hà Nội          (WAREHOUSE)
  Kho HCM             (WAREHOUSE)
  Sunrise Hotel        (HOTEL)
  Ocean Resort         (RESORT)
  Zen Spa              (SPA)

Products:
  3 sample products linked to categories
```

### 6.4. Mobile App BLE Configuration

```typescript
const BLE_CONFIG = {
  DEVICE_MAC: 'E0:4E:7A:F3:78:56',           // Default ST-H103 MAC
  SERVICE_UUID: '0000FFE0-0000-1000-8000-00805F9B34FB',
  WRITE_CHAR: '0000FFE3-0000-1000-8000-00805F9B34FB',
  NOTIFY_CHAR: '0000FFE4-0000-1000-8000-00805F9B34FB',
  MTU_SIZE: 512,
  BUFFER_LIMIT: 8192,    // Max buffer bytes
  BUFFER_KEEP: 2048,     // Keep on overflow
  SCAN_TIMEOUT: 10000,   // Device scan timeout (ms)
  RFID_KEYWORDS: ['RFID', 'UHF', 'ST-H103', 'Scanner']
};
```

---

> **Tài liệu này được tạo dựa trên codebase thực tế tại commit `124bce7` (dev-tuoi branch).**
> Cập nhật lần cuối: 2026-03-26
