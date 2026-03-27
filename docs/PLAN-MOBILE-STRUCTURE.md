# Kế hoạch tái cấu trúc mobile: Expo + React Navigation + module theo nghiệp vụ

## Tóm tắt
Refactor `mobile/` theo hướng tăng dần, giữ nguyên flow và UI hiện tại, nhưng tổ chức lại code để:
- file ngắn hơn
- BLE/RFID logic không nằm trong màn hình
- navigation tách khỏi business logic
- API, offline storage, parser, scan session có ranh giới rõ
- dễ thêm tính năng mới mà không phá các màn hiện tại

Mặc định đã chốt:
- Giữ `Expo + React Navigation`
- Không chuyển sang Expo Router ở giai đoạn này
- Naming code chuẩn hóa sang tiếng Anh
- Giữ text hiển thị cho người dùng bằng tiếng Việt
- Refactor theo hướng incremental, không rewrite toàn bộ

Cấu trúc đích:

```txt
mobile/src/
  app/
    bootstrap/
      app-root.tsx
    navigation/
      root-navigator.tsx
      auth-stack.tsx
      app-tabs.tsx
    providers/

  features/
    auth/
      api/
      hooks/
      screens/
      store/
      types.ts

    reader/
      ble/
        adapters/
        services/
        hooks/
        store/
        types.ts
      connect/
        screens/
        components/

    inventory/
      scan/
        screens/
        components/
        hooks/
      assign/
        screens/
        components/
        hooks/
      find/
        screens/
        components/
        hooks/
      store/
      types.ts
      mappers.ts

    transactions/
      api/
      screens/
      components/
      hooks/
      types.ts
      mappers.ts

  shared/
    api/
      http-client.ts
      auth-headers.ts
      config.ts
      errors.ts
    storage/
    ui/
    hooks/
    utils/
    constants/
    types/
```

## Vì sao chọn cấu trúc này
Mình chọn cấu trúc `app + features + shared` vì nó phù hợp nhất với mobile app này, hơn hẳn kiểu `screens/services/store` phẳng hiện tại.

### Lý do chính
1. App này không phải app CRUD thuần
- Nó có BLE, RFID parser, session scan, sync server, offline data, auth
- Nếu tiếp tục để `screens + services + store` phẳng, logic của một nghiệp vụ sẽ bị rải ra nhiều nơi và rất khó maintain

2. Giữ React Navigation là hợp lý hơn Expo Router lúc này
- App hiện tại là app tab-based, flow khá tuyến tính
- Vấn đề của codebase không nằm ở routing, mà nằm ở việc business logic bị nhét vào screen
- Đổi sang Expo Router bây giờ sẽ tăng scope refactor nhưng không giải quyết đúng điểm đau lớn nhất

3. Tách theo feature giúp chia việc và giữ file ngắn
- `auth`, `reader`, `inventory`, `transactions` là 4 khối nghiệp vụ rõ ràng
- mỗi feature có screen, hook, API, store riêng
- không còn một màn hình ôm cả UI + fetch + BLE + Alert + state + data transform

4. `shared/` chỉ giữ thứ dùng chung thật sự
- HTTP client
- config
- storage
- UI primitives
- utils
- constants
- tránh tình trạng mọi thứ đều thành “shared” và lại rối

### Tại sao không chọn các cấu trúc khác
- Không chọn `screens/services/store` tiếp tục: quá phẳng, sẽ vỡ khi app thêm nhiều flow RFID hơn
- Không chọn full FSD nặng: quá nhiều ceremony so với quy mô hiện tại
- Không chọn Expo Router ngay: đổi navigation framework không phải ưu tiên đúng lúc này

## Thay đổi kiến trúc bắt buộc
### 1. Tách `App.tsx` thành lớp bootstrap và navigation
Hiện tại `App.tsx` đang ôm:
- Buffer setup
- auth branching
- inventory bootstrap
- tab navigation
- logout UI

Cấu trúc mới:
- `app/bootstrap/app-root.tsx`: bootstrap app
- `app/navigation/root-navigator.tsx`: quyết định auth flow hay app flow
- `app/navigation/auth-stack.tsx`: login flow
- `app/navigation/app-tabs.tsx`: tab chính sau đăng nhập

Yêu cầu:
- `App.tsx` chỉ còn gọi `AppRoot`
- không để business logic trong file root

### 2. Tách `auth` thành feature riêng
Từ:
- `LoginScreen.tsx`
- `authStore.ts`

Thành:
- `features/auth/screens/login-screen.tsx`
- `features/auth/api/login.ts`
- `features/auth/store/auth.store.ts`
- `features/auth/hooks/use-login.ts`
- `features/auth/types.ts`

Yêu cầu:
- không hardcode `API_URL` trong screen
- screen login không gọi `fetch` trực tiếp
- auth token chỉ đọc/ghi qua auth store + HTTP layer
- nếu sau này chuyển cookie/session hoặc refresh token, không cần sửa từng màn

### 3. Tách `reader` thành feature lõi riêng
BLE/RFID reader là một domain riêng, không phải utility.

Từ:
- `BLEService.ts`
- `constants/ble.ts`
- một phần logic trong `KetNoiScreen`, `QuetTheScreen`, `TimTheScreen`

Thành:
- `features/reader/ble/adapters/`
- `features/reader/ble/services/ble-reader.service.ts`
- `features/reader/ble/services/rfid-packet-parser.ts`
- `features/reader/ble/hooks/use-reader-connection.ts`
- `features/reader/ble/hooks/use-reader-scan.ts`
- `features/reader/ble/store/reader.store.ts`
- `features/reader/connect/screens/connect-reader-screen.tsx`

Tách rõ 4 lớp:
1. `adapter`
- giao tiếp với thư viện BLE/native

2. `service`
- kết nối, subscribe, start/stop inventory

3. `parser`
- parse raw bytes thành tag EPC/RSSI

4. `store`
- trạng thái reader, connected device, scan state

Yêu cầu:
- màn hình không tự gọi quá nhiều API của BLE service
- parser không nằm lẫn trong service giao tiếp
- store reader không chứa logic UI

### 4. Gom toàn bộ scan logic vào `inventory`
Hiện `inventoryStore` đang ôm:
- tag cache
- server names
- local persistence
- session state
- rename logic

Cấu trúc mới:
- `features/inventory/store/scan-session.store.ts`
- `features/inventory/store/tag-cache.store.ts`
- `features/inventory/types.ts`
- `features/inventory/mappers.ts`

Tách theo use case:
- `scan`: kiểm kê live
- `assign`: cấp thẻ vào sản phẩm
- `find`: dò tìm tag
- shared inventory state: tag cache, server names, scan session

Yêu cầu:
- màn `QuetThe`, `CapThe`, `TimThe` không tự truy cập thẳng mọi thứ trong store
- hook làm cầu nối giữa screen và store/service
- state rename, session start, save local, sync server phải tách khỏi render tree

### 5. Tách `transactions` thành feature riêng
`GiaoDichScreen` hiện đang ôm:
- fetch orders
- chọn order
- reconcile scanned tags
- submit session
- start/stop scan

Cấu trúc mới:
- `features/transactions/api/get-orders.ts`
- `features/transactions/api/submit-transaction-session.ts`
- `features/transactions/hooks/use-orders.ts`
- `features/transactions/hooks/use-transaction-picking.ts`
- `features/transactions/screens/transactions-screen.tsx`
- `features/transactions/components/order-list.tsx`
- `features/transactions/components/order-picking-panel.tsx`
- `features/transactions/types.ts`
- `features/transactions/mappers.ts`

Mục tiêu:
- list phiếu và picking mode là 2 block tách riêng
- logic đối chiếu đơn hàng nằm trong hook/helper, không nằm giữa JSX
- scan session cho giao dịch dùng lại hạ tầng inventory/reader, không tự quản riêng

### 6. Tạo HTTP layer chung
`SyncService.ts` hiện đang ôm quá nhiều domain:
- tags
- live scan
- sessions
- products
- assign tags
- orders
- auth header
- unauthorized handling

Cấu trúc mới:
- `shared/api/http-client.ts`
- `shared/api/auth-headers.ts`
- `shared/api/config.ts`
- `shared/api/errors.ts`

API theo feature:
- `features/auth/api/*`
- `features/inventory/api/*`
- `features/transactions/api/*`
- `features/assign/api/*` nếu cần tách riêng
- `features/products` không cần tồn tại độc lập nếu mobile chỉ đọc list để gán thẻ; khi đó để API đọc product nằm trong `inventory/assign/api/`

Yêu cầu:
- không còn `API_URL = 'http://localhost:3000/api'` hardcode trong screen/service
- unauthorized handling nằm ở HTTP layer
- feature screen không parse response backend thủ công

### 7. Chuẩn hóa naming sang tiếng Anh
Quy tắc:
- tên file, folder, symbol dùng tiếng Anh
- text UI giữ tiếng Việt
- không dùng tên file kiểu `KetNoiScreen.tsx`, `QuetTheScreen.tsx` nữa

Mapping chuẩn:
- `KetNoiScreen` -> `connect-reader-screen.tsx`
- `QuetTheScreen` -> `inventory-scan-screen.tsx`
- `CapTheScreen` -> `assign-tags-screen.tsx`
- `TimTheScreen` -> `find-tag-screen.tsx`
- `GiaoDichScreen` -> `transactions-screen.tsx`

Điều này giúp:
- codebase dễ onboard người mới
- dễ tìm file
- dễ thống nhất giữa mobile, web, backend

## Quy tắc chia file để không file nào quá dài
Quy ước bắt buộc:

- `app/bootstrap/*.tsx`, `navigation/*.tsx`: mục tiêu `30-100` dòng
- `features/*/screens/*.tsx`: mục tiêu `60-150` dòng, trần `200`
- `features/*/hooks/*.ts`: `20-100` dòng, một trách nhiệm rõ ràng
- `features/*/components/*.tsx`: `40-150` dòng
- `shared/api/*.ts`: `20-80` dòng
- parser/service BLE phức tạp có thể dài hơn, nhưng phải tách thành nhiều lớp rõ trách nhiệm

Bắt buộc phải tách nếu:
- một screen vừa fetch dữ liệu, vừa xử lý BLE, vừa render nhiều block lớn
- một file có cả modal, list, submit logic, reconcile logic, alert logic
- một service chứa nhiều domain API khác nhau
- một store ôm cả persisted cache lẫn UI state lẫn business state

## Thứ tự thực hiện
### Giai đoạn 1: nền tảng
1. tạo `app/bootstrap`
2. tạo `app/navigation`
3. tạo `shared/api`, `shared/storage`, `shared/constants`
4. chuyển root app sang `AppRoot`
5. đưa config API ra `shared/api/config.ts`

### Giai đoạn 2: auth
1. tách login screen sang `features/auth`
2. tách login API
3. giữ auth store nhưng đưa vào feature
4. chuẩn hóa bootstrap token và logout flow

### Giai đoạn 3: reader
1. tách BLE adapter/service/parser/store
2. refactor màn kết nối reader
3. tạo hook cho connect/disconnect/start/stop scan
4. dọn reader state khỏi UI

### Giai đoạn 4: inventory
1. tách inventory scan
2. tách assign tags
3. tách find tag
4. chia `inventoryStore` thành state hợp lý
5. đưa local persistence vào storage/helper nếu cần

### Giai đoạn 5: transactions
1. tách fetch orders
2. tách reconcile logic
3. tách submit session
4. chia màn chọn đơn và màn xử lý đơn thành component riêng

### Giai đoạn 6: shared UI và cleanup
1. tạo `shared/ui` cho component dùng chung
2. gom style chung nếu có pattern lặp
3. xóa cấu trúc cũ `screens/services/store` sau khi migrate xong

## Kế hoạch kiểm thử
### Kiểm tra bắt buộc sau refactor
- app vẫn boot được bằng Expo
- login vẫn hoạt động
- logout vẫn hoạt động
- tab navigation vẫn đúng flow cũ
- kết nối BLE vẫn quét và kết nối được reader
- quét inventory vẫn nhận tag, cập nhật RSSI, lưu offline
- assign tag vẫn chọn sản phẩm và gán được thẻ
- find tag vẫn dò được EPC theo tín hiệu
- transactions vẫn tải order và nộp session đúng
- unauthorized vẫn logout đúng

### Acceptance criteria
- không còn file `screen` nào ôm cả UI + BLE + sync + state orchestration lớn
- không còn hardcoded API URL trong màn hình
- `SyncService` kiểu “1 file làm mọi việc” bị loại bỏ
- `App.tsx` không còn chứa auth branch + tabs + bootstrap logic cùng lúc
- code naming được chuẩn hóa sang tiếng Anh
- mỗi feature có ranh giới rõ: screen, hook, api, store, types

## Giả định và mặc định
- Giữ React Navigation, không chuyển Expo Router trong phase này
- Giữ flow người dùng hiện tại, không đổi lớn UI
- Offline capability vẫn là năng lực quan trọng
- BLE/RFID reader là domain lõi, không coi là utility
- Mobile sẽ tiếp tục phát triển các luồng scan/giao dịch, nên cấu trúc phải ưu tiên theo nghiệp vụ chứ không theo loại file
