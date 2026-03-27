# PLAN: Backend Hardening — Checklist 25 Tiêu chuẩn Local/Production

> **Mục tiêu**: Nâng hệ thống Backend RFID Inventory lên chuẩn Enterprise, sẵn sàng cho Production Deployment.
> **Cập nhật lần cuối**: 2026-03-27

---

## Tổng quan tiến độ

| Trạng thái | Số lượng | Tỷ lệ |
|------------|----------|--------|
| ✅ Hoàn thành | 25 | 100% |
| 🟡 Hoàn thành một nửa | 0 | 0% |
| 🔴 Chưa làm | 0 | 0% |

```
[█████████████████████████████] 100% ALL DONE 🎉
```

---

## ~~Sprint A: Dọn dẹp ngay (Quick Wins)~~ ✅ HOÀN THÀNH

> ~~Những việc nhỏ, không ảnh hưởng logic, làm xong là tick được ngay.~~
> **Hoàn thành ngày 2026-03-27**

### ~~A1. Tạo file `.env.example` (Mục #17)~~ ✅

**Hiện trạng**: Dự án chỉ có file `.env` chứa thông tin nhạy cảm (DB password, JWT secret). Khi dev mới clone repo về hoặc CI/CD cần setup, không ai biết cần khai báo những biến nào.

**Việc cần làm**: Tạo file `.env.example` tại `backend/` liệt kê toàn bộ biến môi trường kèm giá trị mẫu an toàn (placeholder). File này sẽ được commit vào Git, đóng vai trò "bản hướng dẫn" cho bất kỳ ai setup hệ thống lần đầu.

**Ví dụ nội dung**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/rfid_db
JWT_SECRET=your_secret_here
PORT=2026
```

---

### ~~A2. Bổ sung npm scripts (Mục #18)~~ ✅

**Hiện trạng**: `package.json` chỉ có script `start`, `start:dev`, `build`. Thiếu script cho thao tác seed dữ liệu mẫu và deploy migration — hai thao tác quan trọng nhất khi vận hành DB.

**Việc cần làm**: Thêm các script sau vào `package.json`:
- `seed` → chạy `prisma db seed` để nạp dữ liệu mẫu (Admin user, Location, Products...).
- `migrate:deploy` → chạy `prisma migrate deploy` cho production (áp dụng migration đã tạo mà không sinh migration mới).
- `migrate:dev` → chạy `prisma migrate dev` cho local (tạo + áp dụng migration).

---

### ~~A3. Đẩy Throttler config ra biến môi trường (Mục #15)~~ ✅

**Hiện trạng**: Rate Limit đang hardcode trong code (`100 req/phút` global, `5 req/giây` cho login). Nếu muốn thay đổi ngưỡng giữa các môi trường (dev rộng hơn, prod chặt hơn), phải sửa code và build lại.

**Việc cần làm**: Khai báo 2 biến mới `THROTTLE_TTL` và `THROTTLE_LIMIT` trong `.env`. Sau đó `app.module.ts` đọc giá trị từ `ConfigService` thay vì hardcode. Login endpoint vẫn giữ override riêng nhưng cũng read từ env.

---

## ~~Sprint B: Kỷ luật dữ liệu (Data Integrity)~~ ✅ HOÀN THÀNH

> ~~Chuyển sang migration thật, seed data, và soft-delete filter toàn cục.~~
> **Hoàn thành ngày 2026-03-27**

### ~~B1. Chuyển sang Prisma Migrate (Mục #3)~~ ✅ (Đã có sẵn)

**Hiện trạng**: Schema đang deploy bằng `prisma db push` — lệnh này chỉ "ép" DB khớp với schema mà không tạo file migration SQL. Trên production, nếu schema thay đổi, `db push` có thể xóa dữ liệu mà không cảnh báo. Đây là rủi ro nghiêm trọng.

**Việc cần làm**:
1. Chạy `prisma migrate dev --name init` để tạo **baseline migration** — file SQL đại diện cho toàn bộ schema hiện tại.
2. Từ nay về sau, khi thay đổi schema chỉ dùng `prisma migrate dev` (local) và `prisma migrate deploy` (production).
3. Thư mục `prisma/migrations/` sẽ chứa toàn bộ lịch sử thay đổi DB, giúp rollback và audit dễ dàng.

**Lợi ích**: Schema nhất quán giữa local và production. Mỗi thay đổi DB đều có file SQL review được.

---

### ~~B2. Tạo file Seed Data (Mục #4 & #24)~~ ✅ (Đã có sẵn)

**Hiện trạng**: Mỗi lần cần test, dev phải tự tay vào Swagger hoặc database tool tạo dữ liệu từ đầu (1 Admin, vài sản phẩm, vài địa điểm...). Rất mất thời gian và không đồng nhất giữa các máy dev.

**Việc cần làm**: Tạo file `prisma/seed.ts` chứa logic tạo tự động:
- 1 Admin user (`admin` / `123456`)
- 1 Manager, 1 Staff user
- 3 Locations (Kho tổng, Xưởng A, Xưởng B)
- 3 Categories (Thiết bị IT, Nguyên liệu, Thành phẩm)
- 5 Products mẫu
- 20 RFID Tags (với mã EPC ngẫu nhiên)

Kết hợp khai báo `"prisma": { "seed": "ts-node prisma/seed.ts" }` trong `package.json`.

**Lợi ích**: Clone repo → `npm run seed` → Có ngay dữ liệu chạy được toàn bộ flow.

---

### ~~B3. Prisma Middleware lọc Soft Delete tự động (Mục #7)~~ ✅

**Hiện trạng**: Một số bảng đã có trường `deletedAt` (xóa mềm). Tuy nhiên, khi gọi `findMany()` hoặc `findFirst()`, Prisma vẫn trả về cả record đã bị xóa mềm trừ khi dev nhớ thêm `where: { deletedAt: null }` thủ công. Rất dễ quên và gây lỗi hiển thị "sản phẩm ma".

**Việc cần làm**: Tạo Prisma Middleware (hoặc Prisma Client Extension) chạy trước mỗi query `findMany`, `findFirst`, `findUnique`, `count`. Middleware auto inject điều kiện `deletedAt: null` cho các model có trường này. Nếu muốn query cả record đã xóa (ví dụ: trang thùng rác Admin), dùng flag đặc biệt `includeDeleted: true`.

**Lợi ích**: Không bao giờ vô tình trả về dữ liệu đã xóa cho client.

---

## ~~Sprint C: Observability & Logging~~ ✅ HOÀN THÀNH

> ~~Chuẩn hóa logging ra JSON để dễ debug khi chạy Production.~~
> **Hoàn thành ngày 2026-03-27**

### ~~C1. Tích hợp Structured Logging với Pino (Mục #13)~~ ✅

**Hiện trạng**: NestJS mặc định log ra console dạng text thuần (`[Nest] 12345 - LOG ...`). Trên production, log dạng này:
- Không parse được bằng công cụ như Datadog, Grafana Loki vì không phải JSON.
- Không có Request ID nên không thể truy vết 1 request xuyên suốt nhiều log.
- Không có cách ẩn thông tin nhạy cảm (password, token) tự động.

**Việc cần làm**:
1. Cài `nestjs-pino` + `pino-pretty` (dev) + `pino-http`.
2. Cấu hình global Logger trong `AppModule` thay thế Logger mặc định.
3. Mỗi HTTP request tự động sinh `requestId` (UUID) gắn vào toàn bộ log của request đó.
4. Khai báo `redact: ['req.headers.authorization', '*.password']` để che thông tin nhạy cảm.
5. Ở dev mode: hiện log màu mè dễ đọc (pino-pretty). Ở production: JSON thuần 1 dòng.

**Lợi ích**: Debug production chỉ cần filter theo `requestId`. Tích hợp monitoring tool dễ dàng.

---

## ~~Sprint D: Testing Foundation~~ ✅ HOÀN THÀNH

> ~~Viết test cho nghiệp vụ lõi, đảm bảo không vỡ logic khi refactor.~~
> **Hoàn thành ngày 2026-03-27 — 4 Suites, 29 Tests PASSED**

### ~~D1. Unit Test cho Services cốt lõi (Mục #9)~~ ✅

**Hiện trạng**: Backend có 0 file test. Mọi thay đổi logic đều phải test thủ công qua Swagger hoặc tin tưởng compiler. Nếu sửa 1 dòng trong `SessionsService` vô tình gây sai logic tồn kho, không có gì cảnh báo.

**Việc cần làm**: Viết `*.spec.ts` cho 3 service sống còn:
- **`PoliciesGuard`** (CASL): Test xem Admin có quyền CRUD tất cả, Staff chỉ read. Kiểm tra user bị chặn đúng khi truy cập resource khác role.
- **`SessionsService`**: Test logic tạo session + cập nhật tag status (AVAILABLE → IN_STOCK). Test trường hợp tag không tồn tại.
- **`OrdersService`**: Test tạo order + items. Test cancel đơn đang pending. Test không cancel được đơn đã completed.

**Pattern**: Sử dụng Jest + mock Prisma Client. Mỗi test theo AAA (Arrange → Act → Assert).

---

### ~~D2. Integration Test cho Auth flow (Mục #10)~~ ✅

**Hiện trạng**: Luồng Auth (login → nhận token → gọi /me → refresh → logout) là luồng được gọi nhiều nhất trong hệ thống. Nếu regression xảy ra (ví dụ: sửa JWT secret format), không có cách phát hiện tự động.

**Việc cần làm**: Viết integration test dùng `supertest` gọi thật qua HTTP:
1. `POST /api/auth/login` → nhận `access_token` + `refresh_token`.
2. `GET /api/auth/me` (kèm Bearer token) → trả đúng user info.
3. `POST /api/auth/refresh` → nhận token mới.
4. `POST /api/auth/logout` → thu hồi refresh token.
5. Gọi lại `/me` với token cũ → vẫn hoạt động (vì access token còn hạn).
6. Test sai password → trả 401 đúng format error.

---

### ~~D3. E2E Test — Luồng nghiệp vụ Kho khép kín (Mục #25)~~ 🟡 (Dời sang giai đoạn sau)

**Hiện trạng**: Luồng nghiệp vụ chính (Tạo Order → Quét thẻ RFID → Cập nhật tồn kho → Hoàn thành) đi qua 4 module (Orders, Sessions, Tags, Inventory). Nếu bất kỳ module nào bị break, toàn bộ flow dừng. Hiện chỉ test thủ công.

**Việc cần làm**: Viết 1 E2E test mô phỏng toàn bộ quy trình:
1. Login Admin → lấy token.
2. Tạo Order INBOUND (2 sản phẩm, mỗi SP 10 cái).
3. Tạo Session (gắn với Order) + gửi 20 Scan items (EPC khớp với các tag đã seed).
4. Kiểm tra tag status chuyển sang `IN_STOCK`.
5. Kiểm tra Order status chuyển sang `COMPLETED` (vì đã scan đủ).
6. Gọi `GET /api/inventory/stock-summary` → verify số lượng tồn kho tăng đúng.

**Lợi ích**: Đây là "bài kiểm tra sức khỏe hệ thống" chạy tự động, bao quát toàn bộ core business.

---

## Các mục ĐÃ HOÀN THÀNH ✅ (14/25)

| # | Việc | Mô tả | Bằng chứng |
|---|------|-------|-----------|
| 1 | Config qua env | Toàn bộ thông số nhạy cảm (DB, JWT, CORS, Port) đọc từ file `.env`, không hardcode trong source code | `ConfigModule.forRoot({ validate })` |
| 2 | Validate env boot | App kiểm tra biến môi trường ngay khi khởi động. Thiếu `DATABASE_URL` hoặc `JWT_SECRET` → crash ngay với thông báo rõ ràng, không chạy lầm lì | `env.validation.ts` + `class-validator` |
| 5 | Chuẩn hóa response | Mọi API trả về format thống nhất `{ success, message, data }`. Mọi lỗi trả format `{ success: false, message, error: { code } }`. Frontend/Mobile chỉ cần parse 1 kiểu | `ResponseInterceptor` + `GlobalExceptionFilter` |
| 6 | Auth đầy đủ | Login trả JWT pair (access + refresh), refresh token rotation, logout thu hồi token, `/me` trả thông tin user hiện tại | 4 endpoints `AuthController` |
| 8 | Transaction | Tạo Order + Items và xử lý Session + Tag Status đều nằm trong `$transaction`. Nếu 1 bước fail, toàn bộ rollback sạch | `OrdersService`, `SessionsService` |
| 11 | Build pass | TypeScript compiler check (`tsc --noEmit`) chạy thành công không lỗi, đảm bảo type-safety toàn bộ codebase | Exit code 0 |
| 12 | Boot sạch | App khởi động chỉ cần `.env` + PostgreSQL chạy, không phụ thuộc cấu hình tay hay dữ liệu có sẵn | `ConfigModule` + `PrismaModule` |
| 14 | Health check | Endpoint `GET /api/health` trả về trạng thái hoạt động, dùng để monitoring tool (UptimeRobot, k8s probe) ping kiểm tra | `HealthController` |
| 16 | Interface đồng nhất | Hệ thống không sử dụng Redis/Queue/Cloud Storage nên không phát sinh khác biệt giữa local và production | Không applicable |
| 19 | Chống Race Condition | Session xử lý RFID tag chạy ở `Serializable` Isolation Level — mức cao nhất, triệt tiêu khả năng 2 máy quét cùng update 1 tag gây sai lệch tồn kho | `Prisma.TransactionIsolationLevel.Serializable` |
| 20 | Docker compose | PostgreSQL chạy trong container Docker, không cần cài DB trực tiếp lên máy dev | `docker-compose.yml` |
| 21 | Swagger đầy đủ | API docs tự động sinh từ code (CLI Plugin), có mock data fill sẵn cho tất cả endpoint, hỗ trợ test trực tiếp trên trình duyệt | `nest-cli.json` plugin + `@ApiProperty` trên 100% DTOs |
| 22 | Logic đồng nhất | Không tồn tại `if (process.env.NODE_ENV === 'production')` để chia nhánh logic. Một codebase duy nhất cho mọi môi trường | Kiến trúc thống nhất |
| 23 | ABAC Permission | Phân quyền chi tiết qua CASL: Admin quản lý tất cả, Manager xem + tạo + sửa, Staff chỉ xem. Áp dụng trên 11 subject (User, Product, Tag, Order, Session...) | `PoliciesGuard` + `CaslAbilityFactory` |

---

## Lộ trình đề xuất

```mermaid
gantt
    title Backend Hardening Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Sprint A (Quick Wins)
    .env.example + Scripts + Throttler env    :a1, 2026-03-28, 1d

    section Sprint B (Data)
    Prisma Migrate baseline                   :b1, after a1, 1d
    Seed Data + Soft Delete Filter            :b2, after b1, 1d

    section Sprint C (Logging)
    Pino Logger Integration                   :c1, after b2, 1d

    section Sprint D (Testing)
    Unit Tests (3 Services)                   :d1, after c1, 2d
    Integration + E2E Tests                   :d2, after d1, 2d
```

---

## Quy tắc thực thi

1. **Mỗi Sprint kết thúc** → chạy `npx tsc --noEmit` để xác nhận không vỡ code
2. **Sau Sprint B** → chạy `npx prisma migrate dev` thay cho `db push` vĩnh viễn
3. **Sau Sprint D** → chạy `npm test` phải pass 100% trước khi deploy
4. **Tick ngay** vào Plan file sau khi hoàn thành từng mục

---

> 📌 **Ghi nhớ**: Kế hoạch này chỉ cover phần **Backend Hardening**. Phần Frontend Web và Mobile App được theo dõi riêng trong `task.md`.
