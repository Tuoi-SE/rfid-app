# Kế Hoạch: Thay Đổi Toàn Bộ UI Web Theo Phong Cách Apple

## 1. Tổng Quan Mục Tiêu
Áp dụng toàn diện hệ thống Design System từ `apple/DESIGN.md` vào hệ thống web (Next.js 16 + Tailwind CSS v4). Chuyển đổi từ UI quản trị (ERP) truyền thống sang trải nghiệm tối giản, không gian rộng (cinematic width), tập trung cực độ vào thiết kế chữ (typography) và cấu trúc phân mảng màu đen/trắng tinh tế.

## 2. Thách Thức Chuyển Đổi Thực Tế
- **Đặc thù Hệ thống:** Đây là ERP/Dashboard quản lý kho (RFID, Orders, Inventory) hiện đang hiển thị mật độ thông tin (tables, report) rất dày đặc.
- **Phong cách Apple:** Đòi hỏi padding lớn, không gian thở khổng lồ, không border, chữ to và chỉ có duy nhất một màu nhấn (Blue). Nếu áp dụng cực đoan sẽ giảm lượng dữ liệu trên một màn hình.

## 3. Kiến Trúc Hệ Thống (Tailwind v4)
Quy hoạch lại lõi giao diện tại `web/src/app/globals.css`:
- **Colors:** `--color-black` (`#000000`), `--color-light-gray` (`#f5f5f7`), `--color-near-black` (`#1d1d1f`).
- **Interactive:** Duy nhất `--color-apple-blue` (`#0071e3`) cho mọi Element tương tác.
- **Utilities:** Drop shadow độc nhất `rgba(0, 0, 0, 0.22) 3px 5px 30px 0px`. Bán kính góc: 5px, 8px, 11px, 12px và 980px (dành cho pill button).
- **Typography:** Config chia font `SF Pro Display` (dành cho size >=20px) và `SF Pro Text` (dành cho <20px) với các mức tracking âm chuẩn xác.

## 4. Các Giai Đoạn Triển Khai (Task Breakdown)

### Phase 1: Nền Tảng (CSS Theme & Typography)
- [ ] Cấu hình biến CSS trong `globals.css` (Colors, Spacing, Typography).
- [ ] Thiết lập alias font SF Pro (sẽ cần thay bằng `Inter` có canh chỉnh chuẩn nếu vướng license).
- [ ] Viết lại bộ Base Style (Reset) theo định dạng mặc định của UI Apple.

### Phase 2: Cấu Trúc Khung (Layout & AppShell)
- [ ] Cấu trúc lại Header: Thiết lập độ cao 48px, background `rgba(0,0,0,0.8)` kết hợp `saturate(180%) blur(20px)`.
- [ ] Gỡ bỏ Sidebar cũ: Đổi thành Tab Bar hoặc hệ menu nổi dạng Pill nổi bật.
- [ ] Thiết lập Canvas màu nền luân phiên hoặc Xám nhạt (`#f5f5f7`) mặc định thay cho màu xanh xám hiện tại.

### Phase 3: Giao Diện Chức Năng (Components)
- [ ] **Buttons & Inputs:** Làm phẳng toàn bộ, sử dụng pill-CTA có border 1px cho tác vụ View, Action Blue cho tác vụ chính. Không bo góc dư thừa.
- [ ] **Data Tables/Lists:** Xoá toàn bộ borders, sử dụng xen kẽ row màu tinh tế, phân tách chỉ bằng khoảng trắng.
- [ ] **Modal/Forms:** Giao diện thẻ nổi trên nền tối, shadow soft cinematic.
- [ ] Tái cấu trúc Dashboard Chart theo style Minimalist.

## 5. Socratic Gate (Chờ Người Dùng Xác Nhận Quyết Định)

**Vui lòng trả lời 3 câu hỏi trước khi bắt tay thực hiện code:**

1. **Trade-off về Mật Độ Dữ Liệu:** Áp dụng chuẩn Apple đòi hỏi rất nhiều khoảng trắng (whitespace) và chữ cỡ lớn. Làm vậy sẽ khiến các màn hình Danh sách (Đơn hàng, Tồn kho) chứa được rất ít dòng, phải cuộn nhiều hơn. Bạn muốn bám sát 100% chuẩn thẩm mỹ của Apple (hy sinh mật độ) hay muốn tôi tinh chỉnh lại (mix) để giữ độ đặc dữ liệu cho Dashboard?
2. **Vấn Đề Font Chữ (Typography):** Việc dùng font SF Pro chính gốc lên Web có thể vi phạm bản quyền nếu đây là dự án public, và font web của font này cũng nặng. Bạn có sẵn tệp font `.woff2` SF Pro, hay tôi nên cấu hình thiết lập Google Font `Inter` kết hợp `letter-spacing` mô phỏng sát nhất tỷ lệ của SF Pro?
3. **Nhịp Điệu Đen/Trắng:** Cẩm nang có gợi ý chia màn hình ra các cảnh (scene) xen kẽ đen và xám nhạt (`#f5f5f7`). Tuy nhiên, đối với một trang thao tác (Backoffice), việc đổi màu phông liên tục theo từng khối dễ gây phân tâm. Bạn muốn AppShell sẽ có màu nền sáng đồng nhất (nhấn Đen ở Header) hay chia Section tương phản mạnh mẽ như các trang Landing Page của Apple?
