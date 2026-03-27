# Kế hoạch tái cấu trúc frontend: Next.js App Router + module theo từng nghiệp vụ

## Tóm tắt
Mục tiêu là tổ chức lại `web/src` để code dễ đọc, dễ chia việc, dễ mở rộng và giữ cho mỗi file không bị quá dài. Hướng refactor được chốt là làm dần từng phần, giữ nguyên URL và hành vi hiện tại, không làm lại toàn bộ giao diện.

Mặc định đã chốt:
- Làm theo hướng tăng dần, không đập đi xây lại
- Giữ cơ chế đăng nhập phía client như hiện tại
- Không đổi đường dẫn public
- Không đổi mạnh giao diện
- `app/` chỉ lo route và layout
- logic nghiệp vụ chuyển vào `features/`
- component dùng chung để ở `components/ui`
- hạ tầng frontend để ở `lib/`

Cấu trúc đích:

```txt
web/src/
  app/
    (auth)/
      login/page.tsx
      layout.tsx
    (dashboard)/
      layout.tsx
      page.tsx
      categories/page.tsx
      products/page.tsx
      tags/page.tsx
      users/page.tsx
      inventory/page.tsx
      orders/page.tsx
      sessions/page.tsx
      activity-logs/page.tsx

  features/
    auth/
      api/
      components/
      hooks/
      types.ts
    categories/
      api/
      components/
      hooks/
      types.ts
      mappers.ts
    products/
      api/
      components/
      hooks/
      types.ts
      mappers.ts
    tags/
      api/
      components/
      hooks/
      types.ts
      mappers.ts
    users/
      api/
      components/
      hooks/
      types.ts
      mappers.ts
    inventory/
    orders/
    sessions/
    activity-logs/

  components/
    ui/
    layout/

  lib/
    http/
      client.ts
      errors.ts
      auth-storage.ts
    utils/
    constants/

  providers/
    auth-provider.tsx
    query-provider.tsx

  types/
    api.ts
    common.ts
```

## Thay đổi triển khai chính
### 1. Tách `app/` đúng chuẩn Next.js
- `app/` chỉ giữ `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, metadata.
- Tạo 2 nhóm route:
  - `(auth)` cho màn đăng nhập
  - `(dashboard)` cho toàn bộ khu vực sau đăng nhập
- `app/layout.tsx` chỉ giữ font, CSS global và providers.
- `app/(auth)/layout.tsx` chỉ render layout của trang đăng nhập.
- `app/(dashboard)/layout.tsx` render shell đã đăng nhập: sidebar, vùng nội dung, auth gate.

Kết quả mong muốn:
- không còn kiểm tra `pathname === '/login'` ở shell tổng
- không còn một layout client ôm mọi trường hợp
- route và layout tách rõ trách nhiệm

### 2. Chia code theo từng nghiệp vụ
Mỗi domain sẽ thành một module riêng trong `features/`, ví dụ `products`, `categories`, `tags`, `users`.

Bên trong mỗi feature:
- `api/`: các hàm gọi API của domain đó
- `hooks/`: query hook, mutation hook, helper state
- `components/`: table, form, dialog, filter, page client
- `types.ts`: type dùng trong frontend
- `mappers.ts`: chuẩn hóa dữ liệu trả về từ backend

Quy tắc bắt buộc:
- `page.tsx` không gọi API trực tiếp
- `page.tsx` không chứa cả query, mutation, form state, modal state, table markup trong cùng file
- component chỉ dùng cho một feature thì để trong feature đó
- component dùng chung thật sự mới được đưa sang `components/ui`

### 3. Tách `lib/api.ts` thành lớp HTTP chung và API theo feature
Thay thế file API tổng hiện tại bằng:
- `lib/http/client.ts`: wrapper `fetch`, header, token, parse lỗi, xử lý 401
- `lib/http/errors.ts`: chuẩn hóa lỗi
- `lib/http/auth-storage.ts`: đọc/ghi access token, refresh token
- `features/*/api/*.ts`: API của từng nghiệp vụ

Ví dụ:
- `features/products/api/get-products.ts`
- `features/products/api/create-product.ts`
- `features/auth/api/login.ts`

Quy ước:
- `client.ts` chỉ lo giao tiếp HTTP
- feature API chỉ lo endpoint của nghiệp vụ đó
- UI không tự xử lý response lộn xộn kiểu `data?.data ?? data ?? []`
- normalize response ở một nơi cố định

### 4. Dọn lại auth nhưng chưa đổi sang cookie
Giữ localStorage trong phase này, nhưng gom mọi thứ về đúng ranh giới:

- `AuthProvider` chỉ lo:
  - bootstrap token
  - user hiện tại
  - login
  - logout
  - trạng thái loading
- `auth-storage.ts` là nơi duy nhất đọc/ghi token
- login page chỉ lo form và submit
- layout dashboard hoặc `AuthGate` lo chặn route cần đăng nhập
- sidebar và layout chỉ đọc auth state qua provider

Không làm trong giai đoạn này:
- chuyển sang cookie/session
- middleware auth
- server auth

Nhưng phải chuẩn bị cho phase sau:
- không đọc `localStorage` rải rác
- không trộn auth logic vào page

### 5. Đặt quy tắc tách file để file luôn ngắn
Quy ước cố định:

- `app/**/page.tsx`: mục tiêu `20-60` dòng, trần `100`
- `features/*/components/*page-client.tsx`: mục tiêu `80-150` dòng, trần `200`
- component `table`, `dialog`, `filters`: mục tiêu `60-180` dòng
- hook: `20-80` dòng, một trách nhiệm rõ ràng
- mỗi file API: `20-80` dòng, chỉ một endpoint hoặc một nhóm rất gần nhau

Bắt buộc phải tách nếu:
- một file có cả `filters + table + modal + mutation handlers`
- một file vừa fetch dữ liệu vừa chứa nhiều khối UI lớn
- một page vượt ngưỡng dòng đã chốt

## Mẫu tổ chức chuẩn cho một feature
Ví dụ `products`:

```txt
features/products/
  api/
    get-products.ts
    create-product.ts
    update-product.ts
    delete-product.ts
  components/
    products-page-client.tsx
    products-table.tsx
    product-filters.tsx
    product-form-dialog.tsx
    delete-product-dialog.tsx
  hooks/
    use-products-list.ts
    use-product-mutations.ts
  types.ts
  mappers.ts
```

Vai trò:
- `products-page-client.tsx`: orchestration cấp màn hình
- `use-products-list.ts`: query, params, query key
- `use-product-mutations.ts`: create, update, delete, invalidate cache
- `products-table.tsx`: chỉ render bảng
- `product-filters.tsx`: chỉ filter
- `product-form-dialog.tsx`: form create/edit
- `delete-product-dialog.tsx`: xác nhận xóa
- `mappers.ts`: chuyển response backend thành shape frontend dễ dùng

## Thứ tự thực hiện bắt buộc
Thực hiện theo thứ tự này:

1. Nền tảng chung
- tạo route groups
- tách layout
- chuẩn hóa `providers`
- tạo `lib/http`
- tạo `types/api.ts`, `types/common.ts`

2. Auth
- login page
- auth provider
- auth storage

3. Categories
- dùng làm mẫu cho CRUD đơn giản

4. Products
- dùng làm mẫu cho CRUD + filter + phân trang

5. Users
- thêm pattern kiểm tra quyền ở UI

6. Tags
- refactor sau cùng trong nhóm CRUD vì phức tạp nhất

7. Các phần còn lại
- inventory
- orders
- sessions
- activity-logs

Không bắt đầu từ `tags`.

## Kế hoạch kiểm thử
Sau mỗi feature được tách ra, phải kiểm tra:

- route cũ vẫn chạy đúng
- danh sách tải đúng
- tạo mới hoạt động
- cập nhật hoạt động
- xóa hoạt động
- loading state hoạt động
- error state hoạt động
- invalidate query làm mới dữ liệu đúng
- search, filter, pagination vẫn giữ đúng hành vi cũ

Tiêu chí hoàn thành:
- không còn page nào ôm toàn bộ logic màn hình
- `lib/api.ts` bị loại bỏ hoàn toàn
- toàn bộ gọi API đi qua `lib/http/client.ts` + feature API files
- không còn chỗ đọc token trực tiếp ngoài auth/http helper
- file được tách đúng ngưỡng độ dài đã chốt

## Giả định và mặc định
- Giữ nguyên URL hiện tại
- Giữ nguyên trải nghiệm hiện tại trừ khi cần chỉnh nhỏ để tách code
- Chưa chuyển sang server component hoặc cookie auth
- Không dùng kiến trúc quá nặng; ưu tiên cấu trúc rõ, thực dụng, dễ code
- `categories` là mẫu chuẩn đầu tiên
- `products` là mẫu chuẩn thứ hai
- `tags` chỉ làm sau khi hai mẫu đầu đã ổn
