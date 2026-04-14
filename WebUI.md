# RFIDSync Web UI Documentation

## 1. Mục tiêu tài liệu
Tài liệu này mô tả Web UI theo đúng cấu trúc source code hiện có trong `web/src`, ưu tiên phục vụ cho 3 mục tiêu:

- giữ thống nhất giữa UI documentation và route/component đang chạy thật
- sắp xếp nội dung theo đúng hành trình người dùng trên website
- bảo toàn tối đa phần mô tả đã có, chỉ chỉnh lại chỗ lệch với code hoặc khó tra cứu

Tài liệu nên được đọc theo thứ tự: `Auth -> App Shell -> Navigation -> từng màn hình nghiệp vụ -> component patterns`.

---

## 2. Tổng quan giao diện
Web UI đang theo hướng quản trị nội bộ cho hệ thống RFID, ưu tiên cảm giác sạch, rõ trạng thái và thao tác nhanh trên desktop. Giao diện hiện bám phong cách dashboard sáng, nền slate rất nhạt, card trắng bo góc lớn, CTA màu RIOTEX Blue.

### Design tokens chính
- **Primary**: `#04147B`
- **Primary Hover**: `rgba(4, 20, 123, 0.9)`
- **Secondary Accent**: `#0856F4`
- **Background App**: `#F4F7FB` / `bg-slate-50`
- **Surface**: `#FFFFFF`
- **Border**: `#E2E8F0` / `#F1F5F9`
- **Text Primary**: `#0F172A`
- **Text Secondary**: `#64748B`
- **Text Muted**: `#94A3B8`
- **Success**: `#10B981`
- **Warning**: `#F59E0B`

### Typography
- Font hiển thị hiện tại thiên về `font-sans`.
- Tiêu đề trang dùng weight đậm, tracking chặt.
- Label phụ, table header và stat label dùng uppercase, cỡ nhỏ `10px-12px`, tracking rộng.

### Tinh thần UI hiện tại
- Không đi theo dark dashboard; phần lớn màn hình nghiệp vụ dùng nền sáng.
- Card, bảng, modal đều ưu tiên `rounded-xl` đến `rounded-[24px]`.
- Nút chính thường là nền `#04147B`, chữ trắng, shadow nhẹ.
- Các module quản trị có xu hướng dùng `PageHeader` + `TableActions` + `table/card list`.

---

## 3. Kiến trúc layout và điều hướng

### 3.1 App Shell
Toàn bộ khu vực sau đăng nhập dùng `ProtectedRoute` + `AppShell`.

#### Cấu trúc tổng thể
- Sidebar cố định bên trái, rộng khoảng `w-60`.
- Header nằm phía trên vùng nội dung.
- Nội dung chính nằm trong `main` với padding responsive:
  - `p-4`
  - `md:p-5`
  - `lg:p-6`
- Nhiều trang con tiếp tục mở rộng nội dung bằng mẫu:
  - `-m-4 p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8`

#### Hành vi responsive
- Mobile/tablet: sidebar ẩn, mở bằng nút menu trên `Header`.
- Desktop: sidebar luôn hiện.
- Khi đổi route, sidebar mobile tự đóng.

### 3.2 Sidebar information architecture
Sidebar hiện được chia thành 3 nhóm chính:

#### QUY TRÌNH RFID
- `Phiên quét (Lô)` -> `/sessions`
- `Điều chuyển Xưởng` -> `/transfers`
- `Đơn hàng / Xuất` -> `/orders`

#### KHO & SẢN PHẨM
- `Tồn kho` -> `/inventory`
- `Vị trí / Địa điểm` -> `/locations`
- `Quản lý Danh mục` -> `/categories`
- `Quản lý Sản phẩm` -> `/products`
- `Kho Thẻ RFID` -> `/tags`

#### ĐIỀU HÀNH & HỆ THỐNG
- `Thống kê` -> `/`
- `Tài khoản nội bộ` -> `/users`
- `Phân quyền hệ thống` -> `/permissions`
- `Nhật ký hoạt động` -> `/activity-logs`

Nhóm thứ ba đang có `adminOnly: true` trong Sidebar và thực tế bị chặn bởi `isSuperAdmin(...)`.

### 3.3 Header
`Header` hiện đóng vai trò điều hướng nhanh và tìm kiếm toàn cục.

#### Thành phần chính
- nút mở sidebar trên mobile
- ô search global
- menu hồ sơ người dùng
- static search items map sẵn tới các route quan trọng

#### Lưu ý
- Search trong Header là search điều hướng, không thay thế search riêng của từng module.
- Một số route admin-only được đánh dấu `adminOnly` ngay trong dữ liệu search.

---

## 4. Giao diện Auth

## 4.1 Màn hình Đăng nhập (`/login`)
Hệ thống đang dùng giao diện đăng nhập tối giản, hiện đại, tập trung vào khả năng nhập liệu nhanh và báo lỗi rõ.

### Đặc điểm chính
- Card đăng nhập nền trắng, bo lớn `rounded-[32px]`, shadow mịn.
- Layout toàn trang dùng nền `#F4F7FE` với radial gradient sáng ở hai góc.
- Logo đặt giữa phía trên card.
- Input không có icon bên trong cho trường email; trường mật khẩu có nút hiện/ẩn.
- Label dùng `semibold`, cỡ chữ thường, không uppercase.
- Inline validation hiển thị ngay dưới field:
  - `Vui lòng nhập email của bạn`
  - `Vui lòng nhập mật khẩu`
- Khi lỗi field, viền input chuyển sang đỏ nhạt `border-[#ff9494]`.
- Nút submit dùng tông xanh-indigo `#4c59a8`.

### Hành vi đặc biệt
- Nếu user đã có token, trang tự redirect về `/`.
- Có luồng `mustChangePassword` ngay sau đăng nhập.
- Luồng đổi mật khẩu bắt buộc được render ngay trong cùng login card, không chuyển route riêng.

## 4.2 Màn hình Quên mật khẩu (`/forgot-password`)
Màn này giữ cùng ngôn ngữ thiết kế với login nhưng scale lớn hơn.

### Đặc điểm chính
- Card lớn hơn với `rounded-[40px]`, `p-10 sm:p-14`.
- Có nút `Quay lại đăng nhập`.
- Trường email hiện vẫn dùng icon `Mail` bên trái.
- Thành công hay thất bại từ backend đều chuyển về success state để tránh lộ thông tin email tồn tại hay không.

### Success state
- Hiển thị icon `CheckCircle2`.
- CTA chính đổi thành `Mở Gmail để lấy mật khẩu`.
- Nút mở trực tiếp `https://mail.google.com/`.

## 4.3 Quy tắc thiết kế Auth
- Ưu tiên error state rõ ràng, dễ đọc.
- Background dùng radial gradient sáng, không dùng dark auth screen.
- Shadow mềm, sâu vừa phải để card nổi khỏi nền.
- Validation đang chủ yếu do frontend tự kiểm soát thay vì phụ thuộc browser native UI.

---

## 5. Màn hình Hồ sơ cá nhân (`/profile`)
Trang Hồ sơ cá nhân được tái cấu trúc để tạo ra một không gian quản trị hiện đại, kết hợp các khối bo góc lớn và micro-interactions tinh tế.

### 5.1 Header và banner
- Header trang dùng title `Hồ sơ cá nhân`, màu nhấn `#4c59a8`.
- Banner cao `h-[200px]` với gradient `from-[#031332] via-[#092055] to-[#041639]`.
- Có 2 lớp phụ trợ:
  - grid pattern `backgroundSize: 40px 40px`
  - ảnh overlay Unsplash với opacity thấp
- Avatar được kéo lên bằng `-mt-16` để giao thoa giữa banner và phần nội dung.

### 5.2 Avatar tương tác
- Avatar tròn `132px`, viền trắng `6px`, có shadow.
- Trạng thái mặc định: icon `User` trắng trên nền xanh `#30A62A`.
- Khi hover: overlay đen mờ + icon `Camera`.
- Dùng `input type="file"` ẩn, click qua overlay.
- Có preview tạm thời bằng `URL.createObjectURL`.

### 5.3 Form thông tin
- Các field read-only ưu tiên nền slate nhạt, viền mảnh, bo `rounded-[12px]`.
- Label phần thông tin dùng uppercase, font bold, cỡ `13px`.
- Phone và role đang được thể hiện là field cố định, có helper text giải thích.

### 5.4 Email và bảo mật
- Khu vực riêng gồm 2 block:
  - đổi email
  - đổi mật khẩu
- Mỗi block có icon tròn riêng và nút `Thay đổi`.
- Modal mở dạng centered modal với overlay blur.

### 5.5 Lưu ý đồng bộ với code
- Trang hiện vẫn có một số hành vi mock/demo như `alert(...)` khi submit.
- Có modal đổi email, đổi mật khẩu, chỉnh sửa hồ sơ, nhưng chưa hoàn tất luồng API thực.
- Vì vậy tài liệu design nên xem đây là màn đã lên UI tốt, còn logic backend vẫn đang hoàn thiện.

---

## 6. Các màn hình chính theo điều hướng website

## 6.1 Dashboard (`/`)
- Chỉ xuất hiện trong nhóm điều hành hệ thống.
- Dùng `PageHeader` với title `Dashboard Tổng quan`.
- Bố cục:
  - `DashboardStatCards`
  - khu chart/metrics bên trái
  - recent activities + warehouse widget bên phải
- Tone tổng thể sáng, dùng card trắng, không còn dark premium dashboard.

## 6.2 Users (`/users`)
- Chỉ `SUPER_ADMIN` mới truy cập được UI này theo điều kiện `isSuperAdmin(...)`.
- Nếu không đủ quyền, hiển thị permission state với icon `ShieldAlert`.

### Header và stat cards
- Dùng `PageHeader` với CTA `Thêm Thành Viên`.
- Grid hiện tại: `grid-cols-1 md:grid-cols-3`.
- 3 card đang dùng:
  - `TỔNG THÀNH VIÊN`
  - `ĐANG HOẠT ĐỘNG`
  - `PHIÊN QUÉT RFID`
- Tất cả là card trắng cao cố định `120px`, shadow nhẹ, có hình tròn trang trí ở góc phải dưới.
- Card active có pulse dot màu xanh lá.
- Card scan trong ngày có badge `HÔM NAY`.

### Bảng và bộ lọc
- Bảng hỗ trợ:
  - tìm kiếm
  - lọc trạng thái: `active`, `all`, `deleted`
  - lọc vai trò: `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF`
  - xuất Excel
  - sắp xếp
  - chọn nhiều dòng
  - vô hiệu hoá mềm / khôi phục
- Bulk actions thay đổi theo filter:
  - ngoài trạng thái `deleted`: cho phép vô hiệu hoá hàng loạt
  - ở `deleted` hoặc `all`: cho phép khôi phục hàng loạt

### Ghi chú quyền
- Source code hiển thị message `Chỉ Quản trị viên (ADMIN)...` nhưng logic thực tế là `SUPER_ADMIN` mới vào được.
- Khi viết tài liệu nghiệp vụ hoặc design copy, nên bám logic code thực tế hơn là text hiện thời.

## 6.3 Permissions (`/permissions`)
- Trang này đã chuyển sang ma trận quyền, không còn stat cards kiểu cũ.
- Dữ liệu hiện là tập `PERMISSION_ROWS` hard-coded ở frontend.

### Khả năng hiện có
- search theo module, feature, route, note, action
- lọc scope quyền:
  - `all`
  - `admin_only`
  - `manager_access`
  - `staff_access`
  - `staff_write`
- sort theo cột
- phân trang client-side với `PAGE_SIZE = 8`
- export CSV `permission-matrix.csv`
- CTA `Đồng bộ hiển thị` thực tế là reset search/filter/sort/page

### UI rules
- Table header dùng uppercase, tracking rộng.
- Các action badge (`READ`, `CREATE`, `UPDATE`, `MANAGE`) dùng color chip riêng.
- Empty state hiển thị khi không còn rule nào khớp bộ lọc.

## 6.4 Sessions (`/sessions`)
- Màn hiện tại trong source code đang nghiêng về bảng lịch sử phiên quét.
- Header đang là `Lịch sử Phiên quét`, chưa dùng stat cards trong file `sessions-page-client.tsx` hiện tại.
- Bảng hiển thị:
  - tên phiên
  - thời gian bắt đầu
  - thời gian kết thúc
  - tổng thẻ
  - hành động xem chi tiết

### Ghi chú đồng bộ
- Trong tài liệu cũ có mô tả `2 stat cards` cho Sessions. Điều này có thể phản ánh một hướng UI khác hoặc file cũ.
- Với source hiện tại, tài liệu nên ưu tiên mô tả đúng màn bảng đang chạy thật.

## 6.5 Transfers (`/transfers`)
- Dùng `PageHeader` + `TransferStatCards` + `TableActions` + `TransferTable`.
- CTA `Thêm phiếu mới` chỉ hiện cho `WAREHOUSE_MANAGER`.

### Bộ lọc hiện có
- search mã lệnh, trạng thái, nơi đi/đến, người tạo
- filter trạng thái:
  - `PENDING`
  - `COMPLETED`
  - `CANCELLED`
- filter loại hình:
  - `ADMIN_TO_WORKSHOP`
  - `WORKSHOP_TO_ADMIN`
  - `WORKSHOP_TO_WORKSHOP`

### Định hướng UI
- Đây là màn phù hợp với kiểu “table-driven operations dashboard”.
- Không nên biến thành card dashboard nếu chưa có yêu cầu mới vì source hiện đã tối ưu cho list + filter + detail modal.

## 6.6 Orders (`/orders`)
- Trang hiện dùng `PageHeader` với CTA `Tạo Phiếu Mới` khi user có quyền.
- Title đang là `Phiếu Giao Dịch Kho`, description là quản lý lệnh nhập/xuất cho app mobile.
- Phần danh sách hiện đi theo layout card dọc, không phải data table.

### Cấu trúc card đơn hàng
- Header card:
  - icon loại phiếu ở trái
  - mã phiếu `order.code`
  - badge loại phiếu `NHẬP KHO` hoặc `XUẤT KHO`
  - badge trạng thái
  - action bên phải: `Chi tiết`, `Chỉnh sửa`, `Xóa` theo quyền
- Meta row:
  - địa điểm/kho liên quan
  - người tạo
  - thời gian tạo
- Body:
  - cột trái là khối theo dõi tiến độ RFID
  - cột phải là mini table danh sách sản phẩm, ưu tiên 3 item đầu

### Tiến độ xử lý đơn hàng
- Metric tiến độ lấy từ tỷ lệ `scannedQuantity / quantity` của toàn bộ item trong đơn.
- Card nên luôn có:
  - progress bar ngang
  - số lượng `đã quét / yêu cầu`
  - số item còn chờ
  - trạng thái tổng hợp của đơn

### Modal chi tiết đơn hàng
- Modal mở từ đáy trên mobile và giữa màn hình trên desktop.
- Header modal hiển thị:
  - mã đơn hàng
  - badge loại phiếu
  - badge trạng thái
- Có tab:
  - `Thông tin chung`
  - `Vận chuyển`
  - `Lịch sử quét`
- Tab `Thông tin chung` đang có stepper tiến độ theo từng bước.

### Quy tắc hiển thị trạng thái
- Badge trạng thái đặt cùng hàng với mã phiếu và loại phiếu.
- Badge dùng chữ uppercase, `text-[10px]` tới `text-[11px]`, `font-bold`, `rounded-[8px]`.
- Mapping màu nên giữ:
  - `PENDING`: nền slate nhạt
  - `PROCESSING` hoặc `IN_PROGRESS`: nền amber/indigo nhạt
  - `COMPLETED`: nền emerald nhạt
  - `CANCELLED`: nền red nhạt

### Lưu ý rất quan trọng về enum
- Tài liệu cũ đang mô tả trạng thái theo backend: `PENDING -> PROCESSING -> COMPLETED` hoặc `PENDING -> CANCELLED`.
- Trong `order-card.tsx`, mapping hiện đang dùng key `IN_PROGRESS`.
- Trong `order-details-modal.tsx`, UI lại kiểm tra `PROCESSING`.
- Khi tiếp tục design hoặc refactor, cần thống nhất 1 source of truth giữa backend enum và frontend label để tránh lệch flow.

### Vì sao đây là màn phù hợp cho order tracking dashboard
Trang Orders hiện đã có đủ:
- status tổng
- progress
- item-level quantity compare
- modal chi tiết

Khi phát triển sâu hơn, nên xem đây là `Order Tracking Dashboard` thay vì chỉ là trang CRUD đơn hàng.

## 6.7 Inventory (`/inventory`)
- Dùng `PageHeader` với title `Tồn kho Hệ thống`.
- Màn hình theo cấu trúc phân tích dữ liệu:
  - `InventoryStatCards`
  - `InventoryLocationTable`
  - `InventoryCategoryAnalysis`
  - `TableActions`
  - `InventoryTable`

### Đặc điểm
- Đây là màn analytics nhiều tầng hơn là CRUD thuần.
- Có filter theo danh mục và search theo SKU/sản phẩm/danh mục.
- Có export Excel theo tập dữ liệu đang nhìn thấy.

## 6.8 Tags (`/tags`)
- Là một trong những màn nghiệp vụ dày tính thao tác nhất.
- Dùng:
  - `PageHeader`
  - `TagsStatCards`
  - `TableActions`
  - `TagsTable`
  - `BulkActionsBar`
  - modal sửa, timeline, bulk edit, confirm dialog

### Trạng thái tag đang hiện diện trên UI
- `IN_WORKSHOP`
- `IN_WAREHOUSE`
- `IN_TRANSIT`
- `COMPLETED`
- `MISSING`
- `UNASSIGNED`

### Đặc điểm hiển thị
- Status badge uppercase, tracking rộng.
- Có batch selection.
- Có timeline EPC.
- Quyền sửa/xóa phụ thuộc `hasAdminAccess(...)`.

## 6.9 Activity Logs (`/activity-logs`)
- Dùng `PageHeader` với 2 action:
  - `Xuất CSV`
  - `Làm mới`
- Sau header là:
  - `ActivityLogsToolbar`
  - `ActivityLogsTable`
  - `SecurityAlertWidget`
- Có floating action button tạo alert rule giả lập.

### Vai trò màn này
- Đây là màn audit/monitoring, không nên mô tả như CRUD table thông thường.
- Copy và visual nên nghiêng về “giám sát hoạt động hệ thống”.

## 6.10 Các module còn lại
Các route sau vẫn đang là một phần chính của website và nên được giữ trong sơ đồ tài liệu, dù chưa cần mô tả quá sâu ở phiên bản này:

- `locations`
- `categories`
- `products`
- `tags/import`
- `tags/live`
- `reset-password`
- `change-password`

---

## 7. Component patterns dùng chung

## 7.1 PageHeader
- Tiêu đề nằm bên trái, action chính nằm bên phải.
- Hỗ trợ `description`, `actions`, `breadcrumbs`.
- Kiểu chữ hiện tại:
  - title: `text-2xl font-bold text-slate-900 tracking-tight`
  - description: `text-xs text-slate-500`

## 7.2 TableActions
`TableActions` hiện là thanh điều khiển chung cho các màn hình bảng dữ liệu.

### Chức năng hỗ trợ
- ô tìm kiếm với icon trái
- export Excel/CSV bằng nút `Xuất Excel`
- dropdown filter kiểu legacy
- mảng `filters` cho nhiều bộ lọc nâng cao cùng lúc
- `statusText` hoặc `rightContent` ở phía phải
- đồng bộ giá trị tìm kiếm từ query param `search` qua `useSearchParams`

### UI rules
- Button và select: nền trắng, border slate, `rounded-[10px]`, text nhỏ đậm.
- Input search: rộng `sm:w-56`, focus ring màu primary.
- Khoảng cách tổng thể: `mt-5 mb-3`, hỗ trợ wrap khi xuống dòng.

## 7.3 Tables
- Header ưu tiên uppercase, đậm, tracking rộng.
- Row spacing thoáng, nền trắng, hover nhẹ.
- Action icon sử dụng Lucide.
- Những màn hình có thao tác hàng loạt dùng thêm `BulkActionsBar`.

## 7.4 Dialogs và modals
- Form tạo/sửa user dùng `UserFormDialog`.
- Xác nhận xoá mềm và khôi phục dùng `ConfirmDialog`.
- Orders/Transfers có detail modal riêng, thiên về rich content hơn form dialog.
- Nhiều modal hiện dùng overlay blur và bo góc lớn, đặc biệt với màn nghiệp vụ chính.

## 7.5 Stat cards
Pattern stat card hiện có trong các module như Dashboard, Users, Transfers, Inventory, Tags.

### Quy tắc chung
- nền trắng
- border slate rất nhạt
- bo góc lớn `rounded-2xl` tới `rounded-[24px]`
- shadow nhẹ
- label uppercase cỡ nhỏ
- số liệu lớn, thường dùng màu primary hoặc semantic color

---

## 8. Quy tắc phân quyền đang phản ánh trong UI
Theo `role-helpers.ts`, hệ thống đang hiểu role như sau:

- `SUPER_ADMIN`: quyền tối cao, xem mọi giao diện kể cả Dashboard, Users, Permissions, Activity Logs
- `ADMIN`: quyền CRUD business modules, nhưng không mặc định vào được nhóm điều hành hệ thống
- `WAREHOUSE_MANAGER`: quản lý kho
- `STAFF`: nhân viên, thiên về thao tác hạn chế hơn

### Hệ quả lên web UI
- Các trang điều hành hệ thống trong Sidebar đang là Super Admin only.
- Các module business như tags, products, transfers, orders có thể mở quyền theo `hasAdminAccess(...)` hoặc logic riêng từng màn.
- Tài liệu/copy hiển thị cần phân biệt rõ:
  - “Admin business”
  - “Super Admin hệ thống”

---

## 9. Ghi chú để dùng tài liệu này đúng cách
- Nếu cần design mới, hãy bám `Sidebar` và route thật trước rồi mới mở rộng concept.
- Nếu cần viết spec cho Orders, nên xem `order-card.tsx` và `order-details-modal.tsx` là nguồn UI hiện hành.
- Nếu cần viết spec cho bảng/filter/export, lấy `TableActions` làm pattern chuẩn.
- Nếu cần cập nhật phân quyền, kiểm tra lại cả `Sidebar`, `role-helpers.ts` và guard trong từng page thay vì chỉ nhìn copy trên giao diện.

### Những chỗ cần đặc biệt cẩn thận
- Sessions trong tài liệu cũ và source hiện tại chưa hoàn toàn cùng một hướng trình bày.
- Orders đang có dấu hiệu lệch enum trạng thái giữa `IN_PROGRESS` và `PROCESSING`.
- Profile đã đẹp về UI nhưng còn phần logic mock.

Tóm lại, source web hiện có đã khá rõ một hệ thống dashboard sáng, chia 3 lớp chính: `Auth`, `Business RFID operations`, `System administration`. Mọi cập nhật tiếp theo cho `WebUI.md` nên tiếp tục bám đúng cấu trúc này để tránh tài liệu đẹp nhưng lệch với website thực tế.
