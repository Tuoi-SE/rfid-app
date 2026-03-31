# Kế Hoạch Tổ Chức Quy Trình Chuỗi Cung Ứng RFID (Từ Gán -> Xưởng -> Kho)

## 1. Phân Tích Quy Trình Business Của Bạn
Dựa vào mô tả của bạn, vòng đời chuẩn của một lô thẻ (Tags) sẽ đi qua **3 chốt chặn (Checkpoints)** với **2 Vai trò (Roles)**:

- **Chốt 1 (Khởi tạo - Admin):** Quét 1000 thẻ thô (Blank Tags) -> Tạo thành 1 Phiên (Session) -> Gán 1000 thẻ thành "Áo Thun A". *(Đã hoàn thiện UI)*.
- **Chốt 2 (Giao việc - Admin):** Admin ấn nút "Giao tới xưởng" -> Lô thẻ được luân chuyển trạng thái trên hệ thống chờ xưởng nhận.
- **Chốt 3 (Nhận hàng - Warehouse Manager):** Quản lý xưởng bấm "Duyệt" -> 1000 Áo Thun A chính thức cộng vào tồn kho của Xưởng *(Đã giao)*.
- **Chốt 4 (Phân phối - Warehouse Manager):** Xưởng sản xuất xong/hoặc phân bổ -> Quản lý xưởng bấm duyệt chuyển 600 áo về Kho Tổng, 400 áo giữ tại Kho Xưởng -> Trừ/Cộng tồn kho tương ứng.

---

## 2. Phân Tích Hiện Trạng UI Web (Góc Nhìn Khắc Phục)

**Trả lời câu hỏi của bạn:** *"Giao diện ở web đã phù hợp với người dùng chưa? Role Admin cần hiện những gì để quy trình suôn sẻ?"*

Hiện tại, **UI CHƯA phù hợp 100% với quy trình chuỗi cung ứng này**. Nó đang mang tính chất "Quản lý dữ liệu thô" thay vì "Điều phối quy trình". Để Admin làm mượt, họ không cần nhìn vào danh sách Thẻ hay Tồn kho lẻ tẻ, mà họ cần một màn hình **ĐIỀU PHỐI (Control Tower)** trực quan theo Dòng Chảy (Pipeline).

### 🚨 Những thứ Admin CẦN HIỆN nhưng ĐANG THIẾU:
1. **Trạng thái (Status) của Lô hàng (Session):** Hiện tại Session chỉ hiện "Giờ kết thúc", nhưng đúng ra nó phải mang trạng thái: `MỚI QUÉT` -> `ĐÃ GÁN SP` -> `ĐANG GIAO XƯỞNG` -> `XƯỞNG ĐÃ NHẬN`.
2. **Nút "Tạo Phiếu Điều Chuyển (Giao Xưởng)":** Sau khi nút "Gán SP" hiện xanh và đã gán xong, một nút mới (Ví dụ: Icon xe tải 🚚) phải sáng lên để Admin bấm 1 click là tạo lệnh giao cho xưởng cụ thể.
3. **Dashboard dạng Pipeline (Kanban):** Admin cần thấy ngay hôm nay: Có bao nhiêu lô chưa gán? Có bao nhiêu lô đang đi trên đường xuống xưởng? Bao nhiêu lô xưởng đã nhận xong?

---

## 3. Kiến Trúc Sửa Đổi Đề Xuất (UI/UX Pro Max)

### Dành cho Admin (Giám Đốc):
Tại màn hình **Phiên Quét (Sessions)** hiện tại:
- **Thêm Cột Thuộc Tính:** `Quy trình (Workflow Status)`. Format dưới dạng UI Badge (ví dụ: `Đang chờ gán hàng`, `Sẵn sàng giao xưởng`, `Đang vận chuyển`, v.v.).
- **Nâng cấp Cột Action:**
  - Nút Gán Hàng (Đã có).
  - Thêm Nút: **"Chuyển Xưởng (Transfer)"** (Chỉ hiện khi phiên đã gán SP hoàn tất). Bấm vào sẽ mở 1 Modal chọn: *"Giao cho xưởng nào? (Xưởng A, Xưởng B)"*.

### Dành cho Warehouse Manager (Quản lý Xưởng):
- **Phân Mảnh Menu:** Quản lý xưởng đăng nhập vào sẽ thấy mục **"Lệnh Nhập/Xuất (Orders/Transfers)"** hoặc chuông thông báo.
- **Màn hình Xét Duyệt (Approval):** Thấy lệnh Giám đốc gửi xuống -> Bấm nút **"Đã nhận"** -> Hệ thống tự động update vị trí (`location`) của 1000 thẻ thành "Xưởng A".
- **Màn hình Phân Bổ (Distribution):** Quản lý xưởng cầm máy PDA quét lại số hàng cần chuyển đi Kho Tổng tạo thành 1 Session Xuất Kho, hoặc dùng Web chọn số lượng -> Tạo lệnh chuyển tiếp về Kho Tổng.

---

## 4. Cổng Socratic (Cần Bạn Xác Nhận - Socratic Gate)

> [!WARNING]
> Mời bạn duyệt qua, phản hồi lại 3 câu hỏi sau để chốt logic trước khi tôi bắt đầu viết Code:

1. **Về Khái Niệm Lệnh Giao:** Khi Admin bấm nút "Giao tới xưởng", hệ thống chỉ cần Đổi trạng thái hiển thị của Phiên đó, **HAY** hệ thống phải tạo ra hẳn một `Đơn Hàng (Order)` thuộc loại `INTERNAL_TRANSFER` (Luân chuyển nội bộ) để lưu trữ giấy tờ rõ ràng?
2. **Về Khái Niệm Xưởng:** Xưởng sản xuất (Workshop) và Kho Tổng (Main Warehouse) có được tính chung là 2 Kho (Locations/Warehouses) nội bộ bình thường trong phần mềm không? Việc này ảnh hưởng đến công thức trừ/cộng tồn kho.
3. **Về Thao Tác Của Quản Lý (Warehouse Manager):** Quản lý bấm xác nhận giao vào kho tổng bằng chuột trên giao diện Web, hay họ bắt buộc phải dùng súng RFID trên Mobile quét qua các thùng quần áo để chứng minh là hàng đã thực sự về tới kho?
