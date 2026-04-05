# DEV Coding Guidelines

## 1. Mục đích

Tài liệu này quy định cách coding cho toàn bộ hệ thống `RFIDInventory`, gồm:

- `web/`: Next.js dashboard
- `mobile/`: Expo / React Native app
- `backend/`: NestJS API

Đây là **chuẩn mục tiêu** để áp dụng cho code mới và code được chỉnh sửa từ nay về sau. Một số file hiện tại có thể chưa đồng nhất; điều đó **không** được xem là precedent để copy tiếp.

Tài liệu này phục vụ 3 việc:

- onboarding dev mới
- thống nhất cách đặt code và chia trách nhiệm
- làm checklist khi review PR

## 2. Cách đọc và mức độ ưu tiên

Trong tài liệu này:

- **Bắt buộc**: phải làm
- **Nên**: ưu tiên làm, chỉ lệch khi có lý do rõ ràng
- **Không làm**: tránh tuyệt đối, trừ khi có quyết định kiến trúc riêng

Khi có xung đột, ưu tiên theo thứ tự:

1. Quy định trong tài liệu này
2. Tooling đang enforce trong repo (`TypeScript`, `ESLint`, `Prettier`)
3. Pattern cũ trong source nếu pattern đó không mâu thuẫn với 2 mục trên

## 3. Nguyên tắc chung toàn repo

### 3.1 Naming và ngôn ngữ

**Bắt buộc**

- Tên file, folder, function, type, variable dùng **tiếng Anh**.
- UI copy, message nghiệp vụ, nội dung hiển thị cho người dùng có thể dùng **tiếng Việt**.
- Dùng tên mô tả đúng domain, không đặt tên mơ hồ như `data`, `temp`, `handleStuff`.

**Nên**

- Component dùng `PascalCase`.
- Hook dùng `camelCase` với tiền tố `use`.
- DTO/entity/type/interface dùng `PascalCase`.
- File backend dùng `kebab-case`.
- File component React ưu tiên theo convention sẵn có của từng app.

**Không làm**

- Tên file kiểu nửa Anh nửa Việt hoặc viết tắt khó hiểu.
- Đặt tên file theo màn hình hiển thị tiếng Việt.

## 3.2 TypeScript-first

**Bắt buộc**

- Ưu tiên `type` / `interface` rõ ràng cho input, output, state, API response.
- Tôn trọng `strict` mode đang bật ở `web` và `mobile`, cùng các rule TypeScript ở `backend`.
- Mọi boundary quan trọng phải có type rõ: props, DTO, service input, API response, store state.

**Nên**

- Dùng type hẹp nhất có thể thay vì `string` / `any` chung chung.
- Tách type nghiệp vụ ra file riêng nếu được dùng lại nhiều nơi.

**Không làm**

- Lạm dụng `any`.
- Dùng `as any` để “đi tắt” qua lỗi type ở business path.

`any` chỉ chấp nhận được ở boundary đặc biệt như:

- dữ liệu thư viện ngoài chưa có type đủ tốt
- response legacy chưa ổn định
- đoạn chuyển tiếp ngắn hạn có ghi chú rõ lý do

## 3.3 Boundary trách nhiệm

**Bắt buộc**

- UI chỉ lo render, local interaction, và orchestration cấp màn hình.
- Business logic phải nằm ở `hook`, `service`, `store`, `mapper`, hoặc layer tương ứng.
- HTTP parsing, auth header, unauthorized handling, normalize lỗi phải nằm ở HTTP/API layer.
- `controller` ở backend chỉ nhận request, guard/policy, và gọi `service`.

**Nên**

- Mỗi file chỉ có một trách nhiệm chính.
- Nếu một file vừa fetch dữ liệu, vừa map response, vừa xử lý submit, vừa render UI lớn, phải tách.

**Không làm**

- Gọi `fetch` hoặc parse response lộn xộn trực tiếp trong React component nếu repo đã có HTTP client.
- Để `controller` thao tác Prisma trực tiếp.
- Đặt rule nghiệp vụ trong component/page/screen.

Ví dụ không nên lặp lại:

- UI tự xử lý kiểu `data?.data ?? data ?? []`
- Screen vừa làm BLE orchestration vừa render toàn bộ form phức tạp

## 3.4 Config và environment

**Bắt buộc**

- Config, base URL, key môi trường phải tập trung tại layer cấu hình.
- Không hardcode host, port, API URL trong screen, component, hoặc service nghiệp vụ.

**Nên**

- Mỗi app có một điểm vào cấu hình rõ ràng.
- Giữ dev/prod behavior ở file config hoặc env, không rải trong business code.

**Không làm**

- Hardcode `http://localhost:3000/api` trong feature code.
- Kiểm tra môi trường bằng cách copy/paste logic ở nhiều nơi.

Ví dụ path cần dùng đúng vai trò hiện tại:

- `mobile/src/shared/api/config.ts`
- `web/.env.local`
- `backend/.env`

## 3.5 Import và dependency direction

**Bắt buộc**

- Thứ tự import:
  1. package ngoài
  2. alias/shared/internal module
  3. relative sibling
- Import phải phản ánh dependency direction rõ ràng: shared không import ngược feature; feature không import ngược page.

**Nên**

- `web` dùng alias `@/`.
- `backend` ưu tiên alias nội bộ như `@common`, `@auth`, `@orders`.
- Relative import chỉ nên ngắn và ở phạm vi gần.

**Không làm**

- Relative path dài nhiều cấp khi repo đã có alias phù hợp.
- Tạo vòng phụ thuộc giữa feature với shared hoặc giữa các module backend.

## 3.6 Chia file

**Bắt buộc**

- `page` / `screen` phải mỏng.
- `hook` chỉ một trách nhiệm rõ ràng.
- File API chỉ xử lý một endpoint hoặc một nhóm endpoint rất gần nhau.

**Nên**

- Tách file khi file bắt đầu ôm cả render + data fetching + mutation + dialog state + mapping.
- Tách component dùng chung thật sự ra shared layer; component chỉ dùng một feature thì để trong feature đó.

Mốc tham khảo đang phù hợp với codebase hiện tại:

- `web/src/app/**/page.tsx`: ưu tiên ngắn, chủ yếu composition
- `web/src/features/*/components/*page-client.tsx`: orchestration cấp màn hình
- `mobile/src/features/*/screens/*.tsx`: render + orchestration mỏng
- `backend/src/*/*.controller.ts`: mỏng, không chứa business rule dài

## 3.7 Comment và readability

**Bắt buộc**

- Code phải tự giải thích được trước khi cần comment.
- Comment chỉ dùng để giải thích **vì sao**, không mô tả lại **đang làm gì**.

**Không làm**

- Comment dư thừa kiểu “set biến A bằng giá trị B”.
- Giữ comment cũ sai với hành vi hiện tại.

## 4. Đặt code mới ở đâu

### 4.1 Web

Mục tiêu: `app` lo route/layout, `features` lo nghiệp vụ, `components` chỉ cho shared UI thật sự.

**Bắt buộc**

- Page route đặt trong `web/src/app`.
- Logic nghiệp vụ đặt trong `web/src/features/<feature>`.
- Shared component đặt trong `web/src/components` chỉ khi dùng lại giữa nhiều feature/page.
- HTTP client dùng `web/src/lib/http/client.ts`.
- Feature API đặt trong `web/src/features/*/api/*`.
- Server state đi qua hook dùng React Query.

**Nên**

- Dùng `orders-page-client.tsx` kiểu orchestration màn hình như ở `web/src/features/orders/components`.
- Tách `api`, `hooks`, `components`, `types` theo feature.

**Không làm**

- Đặt business UI của một feature vào `web/src/components` chỉ vì “tiện import”.
- Page trong `src/app` tự chứa toàn bộ query, table, modal, mutation.
- Dùng `'use client'` khi file không cần hook, state, effect, hoặc browser API.

Gợi ý cấu trúc:

```txt
web/src/features/orders/
  api/
  hooks/
  components/
  types/
```

### 4.2 Mobile

Mục tiêu: `features` chứa nghiệp vụ, `shared` chứa hạ tầng dùng chung.

**Bắt buộc**

- Code nghiệp vụ đặt trong `mobile/src/features/<feature>`.
- Shared API/config/error/helper đặt trong `mobile/src/shared/*`.
- BLE service, parser, adapter, state phải tách khỏi screen khi logic đã vượt mức đơn giản.
- `API_URL` chỉ cấu hình tại `mobile/src/shared/api/config.ts`.

**Nên**

- Mỗi feature tách rõ `screens`, `components`, `hooks`, `api`, `store`.
- Zustand store theo feature hoặc domain nhỏ, tránh store “ôm cả app”.

**Không làm**

- Hardcode API URL trong screen/service nghiệp vụ.
- Để screen vừa fetch data, vừa điều khiển BLE, vừa xử lý submit phức tạp trong một file dài.
- Trộn persisted state, UI state, business state không liên quan vào cùng một store nếu không có lý do rõ.

Path tham chiếu đúng boundary:

- `mobile/src/shared/api/http-client.ts`
- `mobile/src/shared/api/config.ts`
- `mobile/src/features/transactions/components/quick-submit-modal.tsx`

### 4.3 Backend

Mục tiêu: giữ chuẩn module-based của NestJS.

**Bắt buộc**

- Mỗi domain giữ pattern `module` / `controller` / `service` / `dto` / `entities` khi phù hợp.
- Validation request đặt ở DTO.
- Business rule đặt ở service.
- Prisma access đặt ở service.
- Flow nhiều bước có rủi ro partial update phải cân nhắc transaction.

**Nên**

- Dùng custom exception hoặc exception chuẩn hóa cho lỗi nghiệp vụ.
- Dùng alias nội bộ thay cho relative path dài.
- Giữ controller declarative: route, guard, decorator, service call.

**Không làm**

- Đặt logic kiểm tra nghiệp vụ dài trong controller.
- Query DB trực tiếp ở decorator, guard, hoặc controller nếu đáng ra thuộc service/module.
- Trả response shape tùy hứng giữa các endpoint cùng loại.

Path tham chiếu:

- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/dto/*`

## 5. Tooling hiện có phải được tôn trọng

### 5.1 Web

- Stack: `Next.js`, `React`, `TypeScript`, `ESLint`
- Command hiện có:
  - `npm run lint`
  - `npm run build`

Quy định:

- PR chạm vào `web/` phải tối thiểu qua `lint`.
- Với thay đổi ảnh hưởng routing, data flow, hoặc production build behavior, nên chạy thêm `build`.
- Hiện chưa có test framework/script test chuẩn trong `web/package.json`, nên không được ghi checklist test như thể repo đã có sẵn.

### 5.2 Backend

- Stack: `NestJS`, `TypeScript`, `ESLint`, `Prettier`, `Jest`, `Prisma`
- Command hiện có:
  - `npm run lint`
  - `npm run format`
  - `npm run test`
  - `npm run build`

Quy định:

- PR chạm vào `backend/` phải chạy kiểm tra phù hợp với scope.
- Không rely vào format tay nếu repo đã có `Prettier`.
- Nếu đổi business rule hoặc DTO/service/controller, ưu tiên chạy `test` và `build`.
- Tôn trọng config format đang có ở `backend/.prettierrc` thay vì tự chọn style riêng.

### 5.3 Mobile

- Stack: `Expo`, `React Native`, `TypeScript`, `Zustand`
- Command hiện có:
  - `npm run start`
  - `npm run android`
  - `npm run ios`
  - `npm run web`

Lưu ý:

- Hiện **chưa có script lint/test chuẩn** trong `mobile/package.json`.
- Vì vậy PR chạm vào `mobile/` phải ít nhất có smoke test phù hợp trên môi trường chạy thực tế.
- Nếu thêm script kiểm tra mới trong tương lai, tài liệu này sẽ được cập nhật để biến nó thành yêu cầu bắt buộc.

## 6. Rule review nhanh trước khi mở PR

Trước khi mở PR, dev tự kiểm tra:

1. Code mới đã đặt đúng layer chưa?
   - `web`: `app` vs `features` vs `components`
   - `mobile`: `features` vs `shared`
   - `backend`: `controller` vs `service` vs `dto`

2. Có hardcode config, host, token key, API URL, hoặc env-sensitive value trong feature code không?

3. Có chỗ nào UI/controller đang ôm business logic đáng ra phải tách ra không?

4. Có dùng `any`, `as any`, parse response thủ công, hoặc cast để né type không?

5. Import đã theo đúng thứ tự và tránh relative path quá dài chưa?

6. File có đang ôm quá nhiều trách nhiệm không?

7. Đã chạy kiểm tra phù hợp với app bị ảnh hưởng chưa?
   - `web`: `npm run lint`, khi cần thì `npm run build`
   - `backend`: `npm run lint`, `npm run test`, `npm run build`
   - `mobile`: hiện chưa có script chuẩn, phải có smoke test phù hợp

8. Có kéo theo refactor ngoài scope của ticket/PR không?

9. UI text và code naming đã đúng quy ước ngôn ngữ chưa?

## 7. Kết luận ngắn cho dev mới

Nếu chưa chắc nên đặt code ở đâu, hãy tự trả lời 3 câu sau:

1. Đây là routing/layout, UI, state orchestration, hay business logic?
2. Đoạn này có dùng lại ngoài feature hiện tại không?
3. Nếu file này lớn hơn nữa, ai sẽ là người khó hiểu nó nhất khi quay lại sau 2 tháng?

Nguyên tắc mặc định:

- thêm code mới vào đúng feature/domain trước
- chỉ đưa sang shared khi đã có nhu cầu dùng lại thật
- giữ UI/controller mỏng
- giữ business rule ở layer chuyên trách
- giữ config ở một chỗ duy nhất

Khi phân vân giữa “làm nhanh trong file hiện tại” và “tách đúng boundary”, ưu tiên phương án thứ hai.
