# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG CHI TIẾT (RENDER + VERCEL + EXPO APK)

Tài liệu này hướng dẫn từng bước (click-by-click & command) để tự mình đưa toàn bộ hệ thống lên môi trường production.

---

## GIAI ĐOẠN 1: DATABASE (SUPABASE)

**1. Khởi tạo Database:**
- Truy cập [Supabase](https://supabase.com/), tạo một Project mới.
- Khu vực: Chọn Singapore (AP-Southeast-1) để tốc độ về VN nhanh nhất.
- Password DB: Tự tạo một mật khẩu mạnh và **LƯU LẠI**.

**2. Lấy chuỗi kết nối (Database URL):**
- Trong Supabase Dashboard, chuyển tới `Project Settings` -> `Database`.
- Copy chuỗi `Transaction string` (Connection string dạng URI).
- Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[ID].supabase.co:5432/postgres`.
- Thêm `?pgbouncer=true&connection_limit=1` vào cuối chuỗi nếu bạn dùng gói Free để tránh lỗi quá tải Pool. Đặt biến này thành `DATABASE_URL`.

**3. Khởi tạo Schema (Local):**
- Mở terminal ở máy cục bộ, chạy lệnh:
  ```bash
  cd backend
  DATABASE_URL="chuỗi_kết_nối_ở_trên" npx prisma migrate deploy
  ```

---

## GIAI ĐOẠN 2: BACKEND API (RENDER)

**1. Đẩy Code lên GitHub:**
- Push toàn bộ code (repo có chứa cả web, mobile, backend) lên 1 Private Repository trên GitHub.

**2. Khởi tạo Web Service trên Render:**
- Truy cập [Render.com](https://render.com/), chọn **New+** -> **Web Service**.
- Kết nối tài khoản GitHub, chọn Repo chứa source code.

**3. Cấu hình Build & Cấu hình Start:**
- **Name**: `rfid-inventory-api`
- **Region**: Singapore (hoặc us-west tuỳ gói)
- **Root Directory**: `backend` (RẤT QUAN TRỌNG - Báo cho Render biết thư mục gốc của backend)
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  npm install && npx prisma generate && npm run build
  ```
- **Start Command**:
  ```bash
  npm run start:prod
  ```

**4. Khai báo Environment Variables (Biến môi trường) trên Render:**
| Key | Value (Ví dụ) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | Lấy từ bước Supabase ở trên |
| `JWT_SECRET` | 1 chuỗi bí mật ngẫu nhiên (ví dụ: `s0perS3cr3tKey!!!`) |
| `CORS_ORIGIN` | `https://admin.yourdomain.com` (URL Vercel sẽ config ở Phase 3 - Nhớ update sau) |

**5. Deploy & Verify:**
- Bấm **Create Web Service**. Chờ ~3 phút để Render build và start server.
- Copy lại url API: `https://rfid-inventory-api.onrender.com`.

---

## GIAI ĐOẠN 3: FRONTEND WEB (VERCEL)

**1. Khởi tạo Project Vercel:**
- Đăng nhập [Vercel](https://vercel.com/), chọn **Add New...** -> **Project**.
- Import Github Repository chứa code.

**2. Cấu hình Build:**
- **Framework Preset**: Chọn Vite (nếu dùng Vite React) hoặc Next.js.
- **Root Directory**: `web` (Edit và chọn thư mục `/web`).
- **Build Command**: Để mặc định (hoặc `npm run build`).

**3. Cấu hình Environment Variables:**
Trong mục Environment Variables ở bước khởi tạo (hoặc `Settings > Environment Variables`), thêm lệnh:
| Key | Value (Ví dụ) |
| :--- | :--- |
| `VITE_API_URL` (hoặc `NEXT_PUBLIC_API_URL`) | `https://rfid-inventory-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://rfid-inventory-api.onrender.com` |

**4. Deploy:** Bấm Deploy. Chờ 2 phút, Vercel sẽ cấp 1 domain (ví dụ: `https://rfid-admin.vercel.app`).
👉 Lúc này, nhớ quay lại mục Settings của Render Backend, update biến `CORS_ORIGIN` thành tên miền Vercel này để tránh lỗi chặn CORS, sau đó Manual Deploy lại Render.

---

## GIAI ĐOẠN 4: MOBILE APP APK (EXPO EAS)

**1. Cài đặt môi trường build (Cục bộ):**
Máy tính của bạn cần cài CLI của Expo:
```bash
npm install -g eas-cli
eas login
```

**2. Khởi tạo cấu hình EAS EAS Config (`eas.json`):**
Vào thư mục `mobile`, chạy `eas build:configure`. Mở file `eas.json` vừa sinh ra và đảm bảo có cấu hình Android dạng APK (không phải AAB) như sau:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

**3. Đổi Base URL trong App:**
Trong source code của app (thường ở `mobile/src/shared/api/http-client.ts`), đổi BASE_URL trỏ thẳng vào IP Render:
```javascript
const BASE_URL = 'https://rfid-inventory-api.onrender.com/api';
```

**4. Chạy lệnh Build APK:**
Mở terminal, cd vào thư mục `mobile`:
```bash
eas build --platform android --profile preview
```
- EAS sẽ upload code lên Cloud để build ảo. Quá trình này mất khoảng ~10-15 phút.
- Hoàn thành, terminal sẽ trả về 1 link URL chứa **mã QR và nút Download .APK file**.
- Tải file APK này bắn qua điện thoại Android/PDA RFID để cài trực tiếp.

---

## MẸO XỬ LÝ SỰ CỐ (TROUBLESHOOTING)

1. **Web gọi API bị đỏ/fail**: Nhấn F12 (Console), nếu lỗi "CORS policy", quay lại bước khai báo biến `CORS_ORIGIN` của Render. Phải đảm bảo domain của Vercel ĐÃ ĐƯỢC CHẤP NHẬN trên Render.
2. **Render tắt server sau 15p**: Gói Free Render sẽ auto Sleep. Bạn có thể dùng tool như https://cron-job.org ping link API sau mỗi 10 phút để ép API luôn chạy.
3. **App Mobile không gọi được API**: Đảm bảo URL trên App truyền là HTTPS (Render đã auto cấp HTTPS). Lỗi thường do chặn HTTP thông thường trên Android.
