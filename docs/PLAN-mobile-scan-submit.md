# PLAN: Mobile Free Scan & Submit Order

## 1. Context
WAREHOUSE_MANAGER chuyển sang luồng "quét trước, tạo phiếu sau" trên Mobile thay vì tạo phiếu PENDING trên Web rồi mới quét. Web chỉ cấm WAREHOUSE_MANAGER tạo phiếu.

## 2. Các thay đổi

### 2.1 Web Dashboard (Frontend)
- **Tập tin**: `web/src/features/orders/components/orders-page-client.tsx`
- **Thay đổi**: Sửa logic `canCreate`. Hiện tại là `isManager || isSuperAdmin(user?.role)`. Sẽ đổi thành `isSuperAdmin(user?.role)` hoặc `user?.role === 'ADMIN'`. Chặn hoàn toàn quyền tạo Phiếu Giao Dịch Kho với WAREHOUSE_MANAGER.

### 2.2 Backend (API)
- **Tập tin**: `backend/src/orders/orders.controller.ts` & `orders.service.ts`
- **Thay đổi**: 
  - Tạo API mới `POST /orders/mobile-quick-submit`: Tạo phiếu (INBOUND/OUTBOUND) và tự động nhận diện EPCs truyền lên để hoàn tất phiếu ngay lập tức (giống chức năng Auto-Receive nhưng gộp cả bước Create).
  - Validation: Kế thừa validation hiện tại (tag có tồn tại không, location đúng không). Đảm bảo MANAGER có quyền tạo tự do ở kho của mình.

### 2.3 Mobile App
- **Thay đổi**: 
  - Thêm một nút/màn hình "Quét Tự Do" (Free Scan).
  - Khi quét xong, qua màn hình Submit: Chọn `Loại phiếu` (Nhập/Xuất), `Nguồn/Đích` (Warehouse/Workshop/...).
  - Call API `mobile-quick-submit` với mảng `epc` đã quét.
  - Success -> Hiện popup -> Về màn hình chính.

## 3. Quyết định đã chốt
1. **API Batch Submit**: Có cho phép submit thiếu tag so với hệ thống không? -> **Chốt: Quét bao nhiêu nhận bấy nhiêu.**
2. **Quyền hạn Web**: Có cấm luôn MANAGER sửa (Edit) và hủy (Cancel) phiếu trên Web không? -> **Chốt: Không. MANAGER vẫn được Edit, Cancel bình thường, chỉ vô hiệu hóa chức năng Tạo mới trên Web.**
3. **Location**: Khi Manager tạo phiếu trên mobile -> **Chốt: Được quyền tự chọn kho khi xuất, TRỪ phiếu Nhập bắt buộc Đích (Destination) phải là kho do Manager đó quản lý.**

## 4. Phase thực hiện
- Phase 1: Update Web ẩn nút + Thêm API backend.
- Phase 2: Build màn hình Mobile & Test tích hợp.
