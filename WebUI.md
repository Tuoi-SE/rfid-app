# RFIDSync Web UI Documentation

## 1. Tổng quan giao diện
Web UI đang theo hướng quản trị nội bộ cho hệ thống RFID, ưu tiên cảm giác sạch, rõ trạng thái và thao tác nhanh trên desktop. Tông màu chính xoay quanh RIOTEX Blue, nền slate rất nhạt và các card trắng bo góc lớn.

### Design tokens chính
- **Primary**: `#04147B`
- **Primary Hover**: `rgba(4, 20, 123, 0.9)`
- **Secondary Accent**: `#0856F4`
- **Background App**: `#F4F7FB`
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

---

## 2. Layout tổng thể

### App content
- Nền trang chính: `bg-[#F4F7FB]`.
- Khối nội dung dùng spacing rộng với mẫu `-m-4 p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8`.
- Hầu hết màn hình quản trị dùng cấu trúc: `PageHeader` -> stat cards hoặc `TableActions` -> bảng dữ liệu/dialog/action bar.

### PageHeader
- Tiêu đề nằm bên trái, action chính nằm bên phải.
- Nút CTA chính dùng nền `#04147B`, chữ trắng, `rounded-xl`, shadow nhẹ.
- Ví dụ:
  - Users: `Thêm Thành Viên`
  - Permissions: `Đồng bộ hiển thị`

---

## 3. Component patterns

### 3.1 Stat cards

#### Sessions page
- Grid hiện tại: `grid-cols-1 md:grid-cols-2`.
- Chỉ còn 2 card:
  - `Tổng thẻ đã quét`
  - `Phiên đang chạy`
- Card đều là nền trắng, border slate rất nhạt, bo góc lớn `rounded-2xl` tới `rounded-[24px]`.
- Card 1 có badge trend màu xanh lá nếu có dữ liệu tăng trưởng.
- Card 2 hiển thị avatar chữ cái đầu của người dùng đang active, fallback sang placeholder xám nếu không có dữ liệu.
- Metric `latency` vẫn còn trong type nhưng không còn render trên UI.

#### Users page
- Grid hiện tại: `grid-cols-1 md:grid-cols-3`.
- 3 card đang dùng:
  - `TỔNG THÀNH VIÊN`
  - `ĐANG HOẠT ĐỘNG`
  - `PHIÊN QUÉT RFID`
- Tất cả là card trắng cao cố định `120px`, shadow nhẹ, có hình tròn trang trí ở góc phải dưới.
- Card active có pulse dot màu xanh lá.
- Card scan trong ngày có badge `HÔM NAY`.
- Card cũ về bảo mật hệ thống không còn xuất hiện.

### 3.2 TableActions
Component `TableActions` hiện là thanh điều khiển chung cho các màn hình bảng dữ liệu.

#### Chức năng hỗ trợ
- Ô tìm kiếm với icon trái.
- Export Excel/CSV bằng nút `Xuất Excel`.
- Dropdown filter kiểu legacy.
- Mảng `filters` mới cho nhiều bộ lọc nâng cao cùng lúc.
- `statusText` hoặc `rightContent` ở phía phải.
- Đồng bộ giá trị tìm kiếm từ query param `search` qua `useSearchParams`.

#### UI rules
- Button và select: nền trắng, border slate, `rounded-[10px]`, text nhỏ đậm.
- Input search: rộng `sm:w-56`, focus ring màu primary.
- Khoảng cách tổng thể: `mt-5 mb-3`, hỗ trợ wrap khi xuống dòng.

### 3.3 Tables
- Header ưu tiên uppercase, đậm, tracking rộng.
- Row spacing thoáng, nền trắng, hover nhẹ.
- Action icon sử dụng Lucide.
- Những màn hình có thao tác hàng loạt dùng thêm `BulkActionsBar`.

### 3.4 Dialogs
- Form tạo/sửa user dùng `UserFormDialog`.
- Xác nhận xoá mềm và khôi phục dùng `ConfirmDialog`.
- Có cả confirm cho thao tác đơn lẻ và bulk action.

### 3.5 Order status tracking
Phần `Đơn hàng` hiện phù hợp để phát triển thành màn theo dõi trạng thái đơn hàng theo dạng card-based dashboard thay vì table thuần.

#### Thành phần cốt lõi
- `OrderCard` là block chính cho mỗi đơn.
- `OrderDetailsModal` là lớp chi tiết để theo dõi tiến độ và đối chiếu số lượng.
- Trạng thái hiện có trong code:
  - `PENDING`: chờ xử lý
  - `PROCESSING`: đang xử lý
  - `COMPLETED`: hoàn thành
  - `CANCELLED`: đã hủy
- UI card hiện đang map thêm nhãn hiển thị kiểu `ĐANG QUÉT` cho trạng thái đang chạy. Khi thiết kế mới cần thống nhất 1 source of truth giữa label hiển thị và enum backend.

#### Quy tắc hiển thị trạng thái
- Badge trạng thái đặt cùng hàng với mã phiếu và loại phiếu.
- Badge dùng chữ uppercase, `text-[10px]` tới `text-[11px]`, `font-bold`, `rounded-[8px]`.
- Mapping màu đề xuất:
  - `PENDING`: nền slate nhạt, text slate đậm
  - `PROCESSING`: nền amber hoặc indigo nhạt, text đậm để nhấn trạng thái đang chạy
  - `COMPLETED`: nền emerald nhạt, text emerald đậm
  - `CANCELLED`: nền red hoặc slate lạnh nhạt, text muted đậm
- Không chỉ hiển thị text trạng thái; nên luôn đi cùng progress bar hoặc stepper để người dùng nhìn thấy mức độ hoàn thành.

#### Luồng trạng thái chi tiết để design theo dõi
Luồng theo dõi nên bám đúng tiến trình thực tế của đơn hàng từ lúc tạo đến lúc đóng đơn. Trong phiên bản hiện tại của backend, enum chính thức vẫn là `PENDING -> PROCESSING -> COMPLETED` hoặc `PENDING -> CANCELLED`.

#### 1. `PENDING` - Chờ xử lý
- Ý nghĩa nghiệp vụ:
  - đơn vừa được tạo
  - chưa bắt đầu quét RFID
  - số lượng thực tế thường đang là `0`
- Tín hiệu UI bắt buộc:
  - badge trạng thái rõ ràng
  - progress hiển thị `0%` hoặc rất thấp
  - copy phụ nên thể hiện “đang chờ bắt đầu”
- Action phù hợp:
  - xem chi tiết
  - chỉnh sửa đơn
  - hủy đơn
  - xóa đơn nếu business cho phép
- UI behavior:
  - đây là trạng thái duy nhất hiện backend cho phép sửa hoặc hủy
  - vì vậy các nút `Chỉnh sửa` và `Hủy` nên chỉ hiển thị enabled ở trạng thái này
  - modal có thể dùng stepper với bước 1 active, các bước sau ở trạng thái waiting

#### 2. `PROCESSING` - Đang xử lý / đang quét
- Ý nghĩa nghiệp vụ:
  - đơn đã bắt đầu được xử lý ở mobile hoặc tại kho
  - đã có ít nhất một phần item được scan hoặc hệ thống đã chuyển sang bước vận hành
- Tín hiệu UI bắt buộc:
  - badge nổi bật hơn `PENDING`
  - progress bar là yếu tố chính, chiếm ưu tiên thị giác
  - cần hiển thị rõ `đã quét / yêu cầu`
  - nên có nhãn phụ như `Đang quét RFID`, `Đang đối chiếu`, hoặc `Đang xử lý`
- Action phù hợp:
  - xem chi tiết
  - theo dõi tiến độ
  - có thể có `Làm mới` hoặc auto refresh
- UI behavior:
  - không cho cảm giác “có thể sửa cấu trúc đơn” nữa
  - nếu có nút chỉnh sửa hoặc hủy thì nên disabled và có helper text giải thích
  - stepper nên chuyển bước `Bắt đầu quét` sang active
  - từng item cần có trạng thái riêng: chưa quét, đang quét, đủ số lượng, thiếu số lượng

#### 3. `COMPLETED` - Hoàn thành
- Ý nghĩa nghiệp vụ:
  - đơn đã hoàn tất xử lý
  - toàn bộ hoặc mức yêu cầu hợp lệ đã được xác nhận hoàn thành
  - progress tổng là `100%`
- Tín hiệu UI bắt buộc:
  - badge xanh hoàn thành
  - progress bar đầy 100%
  - có tín hiệu “done” rõ ràng như icon check, tone màu success, summary card hoàn tất
- Action phù hợp:
  - xem chi tiết
  - xem lịch sử hoặc kết quả đối chiếu
  - export/in biên bản nếu sau này có
- UI behavior:
  - toàn bộ action thay đổi dữ liệu nên ẩn hoặc disabled
  - stepper hiển thị đủ toàn bộ bước
  - danh sách item nên cho thấy item nào hoàn thành đúng đủ, item nào từng bị thiếu nhưng đã được xử lý xong nếu có lịch sử

#### 4. `CANCELLED` - Đã hủy
- Ý nghĩa nghiệp vụ:
  - đơn bị dừng trước khi hoàn tất
  - trong code hiện tại chỉ hủy được khi đơn còn `PENDING`
- Tín hiệu UI bắt buộc:
  - badge hủy dễ nhận biết nhưng không quá chói
  - progress bar chuyển muted hoặc dừng ở mức hiện tại
  - nên có copy “đơn đã bị hủy trước khi xử lý”
- Action phù hợp:
  - xem chi tiết
  - xem lý do hủy nếu sau này backend có field reason
- UI behavior:
  - tất cả action cập nhật khác phải khóa
  - stepper dừng tại bước đang dang dở và có trạng thái terminated
  - card nên giảm emphasis so với đơn đang chạy để tránh lẫn với work-in-progress

#### Quy tắc chuyển trạng thái để tránh design sai flow
- Tạo đơn mới:
  - đơn luôn bắt đầu ở `PENDING`
- Từ `PENDING`:
  - có thể đi sang `PROCESSING`
  - có thể đi sang `CANCELLED`
  - hiện tại backend cho phép sửa nội dung đơn ở bước này
- Từ `PROCESSING`:
  - có thể đi sang `COMPLETED`
  - không nên cho phép sửa cấu trúc đơn trong UI
- Từ `COMPLETED`:
  - xem như trạng thái cuối
  - chỉ cho xem, đối chiếu và tra cứu
- Từ `CANCELLED`:
  - xem như trạng thái cuối
  - không hiển thị action vận hành tiếp

#### Trạng thái hiển thị ở 3 tầng
- Tầng 1: trạng thái đơn tổng thể
  - dùng badge và màu nền card phụ trợ
- Tầng 2: trạng thái tiến độ vận hành
  - dùng progress bar, số % và stepper
- Tầng 3: trạng thái từng item
  - `Chưa quét`
  - `Đang quét`
  - `Đã đủ`
  - `Thiếu`
- Với design chuẩn, 3 tầng này không được mâu thuẫn nhau. Ví dụ:
  - đơn `COMPLETED` thì item-level không nên còn hiển thị “đang quét”
  - đơn `PENDING` thì progress không nên vượt quá `0%` trừ khi nghiệp vụ thật đã auto scan

#### Copy text gợi ý cho từng trạng thái
- `PENDING`
  - label: `Chờ xử lý`
  - helper text: `Đơn đã được tạo và đang chờ bắt đầu quét RFID`
- `PROCESSING`
  - label: `Đang xử lý`
  - helper text: `Hệ thống đang ghi nhận dữ liệu quét và đối chiếu số lượng`
- `COMPLETED`
  - label: `Hoàn thành`
  - helper text: `Đơn đã hoàn tất và đủ điều kiện đóng phiếu`
- `CANCELLED`
  - label: `Đã hủy`
  - helper text: `Đơn đã bị dừng và không tiếp tục xử lý`

#### Trạng thái rỗng và ngoại lệ nên có trong design
- `Chưa có item`
  - dùng khi đơn tồn tại nhưng chưa có dòng sản phẩm hợp lệ
- `Thiếu số lượng`
  - dùng khi item scan chưa đủ so với yêu cầu trong lúc `PROCESSING`
- `Vượt số lượng`
  - nếu tương lai backend cho phép phát hiện quét dư, cần có visual cảnh báo riêng
- `Không thể chỉnh sửa`
  - helper state khi user bấm sửa ở đơn không còn `PENDING`
- `Không có quyền truy cập`
  - dùng cho trường hợp manager cố xem đơn không thuộc quyền của mình

#### Tiến độ xử lý đơn hàng
- Metric tiến độ lấy từ tỷ lệ `scannedQuantity / quantity` của toàn bộ item trong đơn.
- Card đơn hàng nên luôn có:
  - thanh tiến độ ngang
  - số lượng `đã quét / yêu cầu`
  - số item còn chờ
  - trạng thái tổng hợp của đơn
- Progress bar cao khoảng `10px-14px`, bo tròn full, nền track slate nhạt.
- Màu fill:
  - đơn nhập kho ưu tiên RIOTEX Blue
  - đơn xuất kho ưu tiên emerald
  - khi hoàn thành có thể chuyển toàn bộ fill sang emerald để tạo cảm giác complete

#### Cấu trúc card theo dõi đơn hàng
- Header card:
  - icon loại phiếu ở trái
  - mã phiếu `order.code`
  - badge loại phiếu `NHẬP KHO` hoặc `XUẤT KHO`
  - badge trạng thái
  - action bên phải: `Xem chi tiết`, `Chỉnh sửa`, `Xóa` theo quyền
- Meta row:
  - địa điểm/kho liên quan
  - người tạo hoặc người phụ trách
  - thời gian tạo
- Body:
  - cột trái là khối theo dõi tiến độ RFID
  - cột phải là mini table danh sách sản phẩm, ưu tiên 3 item đầu và cho phép “xem thêm”
- Card dùng nền trắng, `rounded-[24px]`, border slate rất nhạt, hover shadow mềm để tạo cảm giác dashboard cao cấp nhưng vẫn sạch.

#### Modal chi tiết đơn hàng
- Modal mở từ đáy trên mobile và giữa màn hình trên desktop là hướng phù hợp với code hiện tại.
- Header modal nên hiển thị:
  - mã đơn hàng
  - badge loại phiếu
  - badge trạng thái
- Info section cần có:
  - ngày tạo
  - tiến độ tổng theo %
  - có thể mở rộng thêm timeline cập nhật trạng thái nếu backend bổ sung event log
- Danh sách item trong modal nên nhấn mạnh đối chiếu:
  - số lượng yêu cầu
  - số lượng thực tế đã quét
  - trạng thái hoàn tất từng dòng nếu đã đủ số lượng
- Nên bổ sung một `status timeline` trong modal theo thứ tự:
  - `Tạo phiếu`
  - `Chờ xử lý`
  - `Đang quét / xử lý`
  - `Hoàn tất` hoặc `Đã hủy`
- Timeline cần thể hiện rõ:
  - bước đã xong
  - bước hiện tại
  - bước chưa tới
  - bước bị dừng do hủy

#### Gợi ý design mở rộng cho team UI
- Bổ sung `Order Status Summary` ở đầu trang với 4 stat card:
  - `Chờ xử lý`
  - `Đang xử lý`
  - `Hoàn thành hôm nay`
  - `Đơn có sai lệch`
- Bổ sung filter nhanh ngay trên danh sách:
  - loại phiếu `all / inbound / outbound`
  - trạng thái `all / pending / processing / completed / cancelled`
  - thời gian tạo
  - địa điểm kho
- Có thể thêm `status timeline` dạng stepper ngang trong modal:
  - `Tạo phiếu`
  - `Bắt đầu quét`
  - `Đối chiếu đủ hàng`
  - `Hoàn tất`
- Nếu muốn làm màn monitor riêng cho điều hành kho, có thể tách thêm view `Kanban theo trạng thái` để theo dõi đơn đang chạy theo thời gian thực.

#### Chức năng trạng thái vận chuyển kho nhập/xuất kho
Phần này nên được viết lại theo đúng nghiệp vụ kho thay vì ngữ cảnh giao hàng cuối. Mục tiêu là theo dõi hàng đang ở bước nào giữa `kho xuất` và `kho nhận`, đồng thời biết hàng đã tới khu vực nào để điều hành xử lý nhanh.

#### Mục tiêu nghiệp vụ
- Cho phép nhìn nhanh hàng đã `rời kho xuất`, `đang trên đường`, hay `đã tới kho nhận`.
- Hỗ trợ theo dõi đơn `xuất kho` và `nhập kho` trong cùng một mô hình hiển thị.
- Giảm việc kiểm tra thủ công giữa các kho, nhất là khi có trung chuyển hoặc bàn giao nhiều chặng.
- Giúp điều phối biết chính xác đơn đang đứng ở khu vực nào để xử lý nhân sự và slot nhận hàng.

#### Khái niệm cần thống nhất
- `orderType`:
  - `OUTBOUND`: phiếu xuất kho
  - `INBOUND`: phiếu nhập kho
- `orderStatus`: trạng thái xử lý đơn trong hệ thống.
- `transportStatus`: trạng thái luồng di chuyển vật lý của hàng giữa các kho.
- `currentZone`: khu vực hiện tại của hàng.
- `sourceWarehouse`: kho xuất.
- `destinationWarehouse`: kho nhận.
- `handover`: mốc bàn giao giữa kho và vận chuyển hoặc giữa các điểm trung chuyển.

#### Dữ liệu nên có trong UI
- `transportStatus`: trạng thái vận chuyển hiện tại.
- `currentZone`: khu vực hiện tại đang ghi nhận.
- `sourceWarehouse`: kho xuất.
- `destinationWarehouse`: kho nhận.
- `previousZone`: khu vực trước đó.
- `nextZone`: khu vực tiếp theo.
- `updatedAt`: thời điểm cập nhật gần nhất.
- `estimatedArrival`: thời gian dự kiến tới kho nhận hoặc điểm tiếp theo.
- `transportEvents`: lịch sử các mốc vận chuyển.
- `handoverBy`: người bàn giao gần nhất.
- `receivedBy`: người nhận tại kho đích nếu đã có.
- `transportNote`: ghi chú vận chuyển.

#### Cấu trúc dữ liệu đề xuất
```ts
type WarehouseTransportStatus =
  | 'WAITING_PICKUP'
  | 'LEFT_SOURCE_WAREHOUSE'
  | 'IN_TRANSIT'
  | 'ARRIVED_DESTINATION_AREA'
  | 'RECEIVED_AT_DESTINATION'
  | 'STOCKED_IN'
  | 'EXCEPTION'

interface WarehouseTransportEvent {
  id: string
  status: WarehouseTransportStatus
  zoneName: string
  description: string
  eventTime: string
  confirmedBy?: string
}

interface WarehouseTransportTracking {
  transportStatus: WarehouseTransportStatus
  sourceWarehouse: string
  destinationWarehouse: string
  currentZone?: string
  previousZone?: string
  nextZone?: string
  updatedAt?: string
  estimatedArrival?: string
  handoverBy?: string
  receivedBy?: string
  transportNote?: string
  transportEvents: WarehouseTransportEvent[]
}
```

#### Enum trạng thái vận chuyển kho đề xuất
- `WAITING_PICKUP`: chờ lấy hàng từ kho xuất
- `LEFT_SOURCE_WAREHOUSE`: đã rời kho xuất
- `IN_TRANSIT`: đang vận chuyển giữa các kho
- `ARRIVED_DESTINATION_AREA`: đã tới khu vực kho nhận
- `RECEIVED_AT_DESTINATION`: kho nhận đã tiếp nhận hàng
- `STOCKED_IN`: đã nhập kho hoàn tất
- `EXCEPTION`: có sự cố vận chuyển

#### Mapping label hiển thị
- `WAITING_PICKUP`: `Chờ lấy hàng`
- `LEFT_SOURCE_WAREHOUSE`: `Đã rời kho xuất`
- `IN_TRANSIT`: `Đang vận chuyển`
- `ARRIVED_DESTINATION_AREA`: `Đã tới khu vực kho nhận`
- `RECEIVED_AT_DESTINATION`: `Đã nhận tại kho đích`
- `STOCKED_IN`: `Đã nhập kho`
- `EXCEPTION`: `Sự cố vận chuyển`

#### Luồng chuẩn cho phiếu xuất kho
- `PENDING`
  - hàng còn trong kho xuất
  - transport nên là `WAITING_PICKUP`
- `PROCESSING`
  - đã quét, đóng hàng hoặc bàn giao
  - transport có thể là `LEFT_SOURCE_WAREHOUSE` hoặc `IN_TRANSIT`
- `COMPLETED`
  - nghiệp vụ xuất kho hoàn tất ở kho nguồn
  - nhưng transport có thể vẫn đang `IN_TRANSIT`
- Khi tới kho đích:
  - transport chuyển `ARRIVED_DESTINATION_AREA`
  - sau khi kho nhận xác nhận thì lên `RECEIVED_AT_DESTINATION`
  - khi nhập kho đích xong thì lên `STOCKED_IN`

#### Luồng chuẩn cho phiếu nhập kho
- Nếu phiếu nhập được tạo để chờ hàng từ kho khác về:
  - ban đầu có thể hiển thị `WAITING_PICKUP` hoặc `IN_TRANSIT` tùy nguồn dữ liệu upstream
- Khi hàng chưa tới kho nhận:
  - UI chính nên nhấn vào `currentZone` và `ETA`
- Khi hàng tới khu vực kho nhận:
  - transport chuyển `ARRIVED_DESTINATION_AREA`
- Khi bảo vệ hoặc nhân viên kho xác nhận nhận hàng:
  - transport chuyển `RECEIVED_AT_DESTINATION`
- Khi hoàn tất putaway hoặc xác nhận nhập kho:
  - transport chuyển `STOCKED_IN`

#### Ý nghĩa nghiệp vụ từng trạng thái

#### 1. `WAITING_PICKUP` - Chờ lấy hàng
- Hàng đã có lệnh di chuyển nhưng vẫn còn ở kho xuất.
- UI nên hiển thị:
  - `Hiện tại: Kho xuất`
  - helper text `Đang chờ lấy hàng khỏi kho`
- Action phù hợp:
  - xem chi tiết
  - xác nhận chuẩn bị hàng

#### 2. `LEFT_SOURCE_WAREHOUSE` - Đã rời kho xuất
- Hàng đã hoàn tất bàn giao ra khỏi kho nguồn.
- Đây là mốc quan trọng vì từ thời điểm này hàng không còn nằm trong tồn kho vật lý tại kho xuất.
- UI nên hiển thị:
  - badge màu blue nhạt
  - text `Đã rời kho xuất và đang tới khu vực tiếp theo`

#### 3. `IN_TRANSIT` - Đang vận chuyển
- Hàng đang nằm trên tuyến giữa kho xuất và kho nhận hoặc giữa các điểm trung chuyển.
- Đây là trạng thái active chính của phần theo dõi vận chuyển.
- UI nên hiển thị:
  - current zone theo dạng `Đang đi từ Kho A tới Kho B`
  - ETA nếu có
  - cảnh báo chậm tuyến nếu trễ

#### 4. `ARRIVED_DESTINATION_AREA` - Đã tới khu vực kho nhận
- Hàng đã tới cổng kho, khu chờ nhận, hoặc vùng phụ cận kho đích.
- Trạng thái này chưa đồng nghĩa là đã nhập kho.
- UI nên hiển thị:
  - text `Đã tới khu vực kho nhận`
  - helper text `Chờ xác nhận tiếp nhận tại kho`

#### 5. `RECEIVED_AT_DESTINATION` - Đã nhận tại kho đích
- Kho nhận đã xác nhận hàng đã được tiếp nhận thực tế.
- Đây là bước giao nhận hoàn tất, nhưng putaway hoặc nhập hệ thống có thể chưa xong.
- UI nên hiển thị:
  - người nhận
  - thời gian nhận
  - chênh lệch số lượng nếu có

#### 6. `STOCKED_IN` - Đã nhập kho
- Hàng đã hoàn tất nhập vào kho đích.
- Đây là trạng thái cuối của luồng vận chuyển kho.
- UI nên hiển thị:
  - badge success
  - text `Đã nhập kho hoàn tất`

#### 7. `EXCEPTION` - Sự cố vận chuyển
- Dùng cho các trường hợp:
  - sai khu vực
  - chậm cập nhật
  - thiếu kiện
  - không nhận đủ số lượng
  - dừng xe hoặc chờ xác minh
- UI nên hiển thị:
  - badge danger
  - một dòng cảnh báo ngắn ngay trên card

#### Quy tắc hiển thị khu vực hiện tại
- Luôn ưu tiên format theo ngữ cảnh kho:
  - `Hiện tại: Kho Tổng HCM`
  - `Hiện tại: Trên đường tới Kho Bình Dương`
  - `Hiện tại: Khu tiếp nhận Kho Đà Nẵng`
- Nếu có `nextZone`, hiển thị thêm:
  - `Điểm tiếp theo: Kho Bình Dương`
- Nếu đã tới kho nhận nhưng chưa nhập kho:
  - dùng copy `Đã tới kho nhận, chờ xác nhận tiếp nhận`

#### Copy text gợi ý theo trạng thái
- `WAITING_PICKUP`
  - `Đang chờ lấy hàng tại kho xuất`
- `LEFT_SOURCE_WAREHOUSE`
  - `Hàng đã rời kho xuất`
- `IN_TRANSIT`
  - `Hàng đang được vận chuyển tới kho nhận`
- `ARRIVED_DESTINATION_AREA`
  - `Hàng đã tới khu vực kho nhận`
- `RECEIVED_AT_DESTINATION`
  - `Kho nhận đã tiếp nhận hàng`
- `STOCKED_IN`
  - `Hàng đã được nhập kho hoàn tất`
- `EXCEPTION`
  - `Quá trình vận chuyển đang có vấn đề cần kiểm tra`

#### UI trên card đơn hàng
- Thêm block `Vận chuyển kho` dưới phần tiến độ RFID.
- Nội dung nên có:
  - badge trạng thái vận chuyển
  - `Từ kho`: source warehouse
  - `Đến kho`: destination warehouse
  - `Hiện tại`: current zone
  - `Cập nhật`: updatedAt
- Với phiếu xuất kho:
  - nhấn mạnh mốc `Đã rời kho xuất`
- Với phiếu nhập kho:
  - nhấn mạnh mốc `Đã nhận tại kho đích` và `Đã nhập kho`

#### Stepper vận chuyển đề xuất
- Bước 1: `Chờ lấy hàng`
- Bước 2: `Rời kho xuất`
- Bước 3: `Đang vận chuyển`
- Bước 4: `Tới kho nhận`
- Bước 5: `Nhận hàng`
- Bước 6: `Nhập kho`

#### UI trong modal chi tiết
- Trong `OrderDetailsModal`, nên có section `Hành trình kho`.
- Section này nên hiển thị:
  - trạng thái hiện tại
  - kho xuất
  - kho nhận
  - khu vực hiện tại
  - ETA dự kiến
  - người bàn giao
  - người nhận
  - timeline vận chuyển
- Timeline gợi ý:
  - `08:10` - `Kho Tổng HCM` - `Đã chuẩn bị bàn giao`
  - `08:45` - `Kho Tổng HCM` - `Đã rời kho xuất`
  - `11:30` - `Trên tuyến HCM - Bình Dương` - `Đang vận chuyển`
  - `13:05` - `Khu tiếp nhận Kho Bình Dương` - `Đã tới kho nhận`
  - `13:25` - `Kho Bình Dương` - `Đã nhận hàng`
  - `14:00` - `Kho Bình Dương` - `Đã nhập kho hoàn tất`

#### Bộ lọc nên có
- lọc theo `orderType`: `inbound / outbound`
- lọc theo `transportStatus`
- lọc theo `sourceWarehouse`
- lọc theo `destinationWarehouse`
- lọc theo `currentZone`
- lọc nhanh:
  - `đang trên đường`
  - `đã tới kho nhận`
  - `chưa nhập kho`
  - `có sự cố`

#### Quy tắc đồng bộ với trạng thái đơn hàng
- `orderStatus` và `transportStatus` phải được hiểu là 2 lớp khác nhau.
- Ví dụ hợp lý:
  - `OUTBOUND + PENDING + WAITING_PICKUP`
  - `OUTBOUND + PROCESSING + LEFT_SOURCE_WAREHOUSE`
  - `OUTBOUND + COMPLETED + IN_TRANSIT`
  - `INBOUND + PROCESSING + ARRIVED_DESTINATION_AREA`
  - `INBOUND + COMPLETED + STOCKED_IN`
- Ví dụ cần cảnh báo:
  - `INBOUND + COMPLETED + WAITING_PICKUP`
  - `OUTBOUND + PENDING + STOCKED_IN`
  - `CANCELLED + IN_TRANSIT`

#### Trạng thái ngoại lệ nên có
- `Sai kho nhận`: hàng đi sai kho đích.
- `Chậm cập nhật`: quá lâu không có event mới.
- `Thiếu số lượng khi nhận`: kho nhận xác nhận thiếu kiện hoặc thiếu item.
- `Hư hỏng niêm phong`: kiện hàng có dấu hiệu bất thường.
- `Chờ kiểm đếm`: hàng đã tới kho nhưng chưa thể nhận chính thức.

#### Màu hiển thị gợi ý
- `WAITING_PICKUP`: slate nhạt
- `LEFT_SOURCE_WAREHOUSE`: blue nhạt
- `IN_TRANSIT`: indigo nhạt
- `ARRIVED_DESTINATION_AREA`: cyan nhạt
- `RECEIVED_AT_DESTINATION`: amber nhạt
- `STOCKED_IN`: emerald nhạt
- `EXCEPTION`: red nhạt

#### Gợi ý API response cho backend
```json
{
  "transportStatus": "IN_TRANSIT",
  "sourceWarehouse": "Kho Tong HCM",
  "destinationWarehouse": "Kho Binh Duong",
  "currentZone": "Tren duong den Kho Binh Duong",
  "previousZone": "Kho Tong HCM",
  "nextZone": "Khu tiep nhan Kho Binh Duong",
  "updatedAt": "2026-04-06T11:20:00Z",
  "estimatedArrival": "2026-04-06T13:00:00Z",
  "handoverBy": "warehouse_admin",
  "receivedBy": null,
  "transportNote": "Xe trung chuyen 02",
  "transportEvents": [
    {
      "id": "evt_001",
      "status": "WAITING_PICKUP",
      "zoneName": "Kho Tong HCM",
      "description": "Da san sang ban giao",
      "eventTime": "2026-04-06T08:10:00Z",
      "confirmedBy": "warehouse_admin"
    },
    {
      "id": "evt_002",
      "status": "LEFT_SOURCE_WAREHOUSE",
      "zoneName": "Kho Tong HCM",
      "description": "Hang da roi kho xuat",
      "eventTime": "2026-04-06T08:45:00Z",
      "confirmedBy": "warehouse_admin"
    },
    {
      "id": "evt_003",
      "status": "IN_TRANSIT",
      "zoneName": "Tuyen HCM - Binh Duong",
      "description": "Dang van chuyen toi kho nhan",
      "eventTime": "2026-04-06T11:20:00Z",
      "confirmedBy": "system"
    }
  ]
}
```

---

## 4. Màn hình chính

### Users (`/users`)
- Chỉ `SUPER_ADMIN` mới truy cập được UI này theo điều kiện `isSuperAdmin(...)`.
- Nếu không đủ quyền, hiển thị empty permission state với icon `ShieldAlert`.
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

### Permissions (`/permissions`)
- Trang này đã chuyển sang ma trận quyền, không còn stat cards.
- Dữ liệu đang là tập `PERMISSION_ROWS` hard-coded ở frontend.
- Có các khả năng:
  - search theo module, feature, route, note, action
  - lọc scope quyền: `all`, `admin_only`, `manager_access`, `staff_access`, `staff_write`
  - sort theo cột
  - phân trang client-side với `PAGE_SIZE = 8`
  - export CSV file `permission-matrix.csv`
- CTA `Đồng bộ hiển thị` thực tế là reset toàn bộ search/filter/sort/page về mặc định.
- Empty state hiển thị khi không còn rule nào khớp bộ lọc.

### Sessions (`/sessions`)
- Stat section hiện được rút gọn để tập trung vào 2 chỉ số chính.
- Visual direction là card trắng tinh gọn, không còn dark premium card như mô tả tài liệu cũ.

### Orders (`/orders`)
- Trang hiện dùng `PageHeader` với CTA `Tạo Phiếu Mới` nếu user có quyền.
- Title đang là `Phiếu Giao Dịch Kho`, description là quản lý lệnh nhập/xuất cho app mobile.
- Phần danh sách đang đi theo layout card dọc, không phải data table.
- Mỗi card đang hiển thị:
  - mã phiếu
  - loại phiếu
  - trạng thái
  - kho/địa điểm liên quan
  - người tạo
  - ngày tạo
  - tiến độ quét RFID
  - preview tối đa 3 sản phẩm
- Empty state hiện có copy “Chưa có giao dịch kho” và CTA tạo phiếu nếu đủ quyền.
- Đây là màn phù hợp nhất để phát triển tính năng `giao diện theo dõi trạng thái đơn hàng` vì đã có đủ:
  - status
  - progress
  - item-level quantity compare
  - modal chi tiết
- Khi làm bản design mới, nên coi trang này là `Order Tracking Dashboard` thay vì chỉ là trang CRUD đơn hàng.

---

## 5. Navigation và phân quyền
- Nhóm nghiệp vụ chính vẫn gồm:
  - Phiên quét (`/sessions`)
  - Điều chuyển (`/transfers`)
  - Đơn hàng (`/orders`)
  - Tồn kho (`/inventory`)
  - Địa điểm (`/locations`)
  - Danh mục (`/categories`)
  - Sản phẩm (`/products`)
  - Kho thẻ RFID (`/tags`)
  - Nhật ký hoạt động (`/activity-logs`)
- Khu vực quản trị hệ thống hiện có:
  - Dashboard (`/`)
  - Quản lý thành viên (`/users`)
  - Quản lý phân quyền (`/permissions`)
- Theo UI hiện tại, trang `Users` đang khóa bằng `isSuperAdmin`. Tài liệu hoặc message hiển thị nói "ADMIN" cần được hiểu theo logic code thực tế là Super Admin only.

---

---

## 7. Giao diện Auth mới
Hệ thống đã cập nhật bộ giao diện Đăng nhập và Quên mật khẩu theo hướng tối giản, hiện đại và tập trung vào trải nghiệm người dùng với các thông báo lỗi tức thời.

### 7.1 Màn hình Đăng nhập (`/login`)
- **Tối ưu hiển thị**: Card đăng nhập được phóng to với padding rộng (`p-10 sm:p-14`) và bo góc siêu lớn (`rounded-[40px]`).
- **Input & Label**:
  - Loại bỏ icon bên trong ô nhập liệu để tạo cảm giác sạch sẽ.
  - Label dùng font `semibold`, cỡ chữ thường (không uppercase).
  - Khi để trống, viền input chuyển sang màu đỏ nhạt (`border-[#ff9494]`).
- **Inline Validation**: Thông báo lỗi hiện ngay dưới từng trường nhập liệu (Ví dụ: "Vui lòng nhập email") thay vì hiện alert chung phía trên.
- **Nút bấm**: Nút Đăng nhập chuyển sang tông Blue-Indigo (`#4c59a8`), bo góc mềm mại (`rounded-[22px]`).

### 7.2 Màn hình Quên mật khẩu (`/forgot-password`)
- **Đồng bộ thiết kế**: Thừa hưởng toàn bộ phong cách kích thước lớn và bo góc của màn hình đăng nhập.
- **Tính năng mới**: Khi gửi thành công, nút hành động chính sẽ đổi thành **"Mở Gmail để lấy mật khẩu"**, dẫn trực tiếp người dùng tới hòm thư Gmail để thực hiện các bước tiếp theo.

### 7.3 Quy tắc thiết kế Auth (Cập nhật)
- **Error State**: Ưu tiên hiển thị lỗi inline bằng text đỏ (`#ff0000`) ngay dưới vị trí xảy ra lỗi.
- **Hệ thống Shadow**: Dùng shadow cực mịn và sâu để nổi bật card trên nền radial gradient sáng.
- **Validation**: Tắt tính năng kiểm tra mặc định của trình duyệt (`noValidate`) để sử dụng bộ bắt lỗi tùy chỉnh to rõ của hệ thống.
