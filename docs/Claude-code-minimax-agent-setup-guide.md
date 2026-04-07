# Hướng dẫn setup chi tiết: hệ multi-agent dùng Claude Code + MiniMax + Codex + Gemini + Figma + Stitch

## 0) Chốt vai trò cuối cùng cho hệ của bạn

**Codex chỉ làm planning, không làm execution.**

Lý do:

* Codex mạnh ở chỗ phân tích task, chia bước, nhìn rủi ro, đề xuất hướng triển khai.
* Phần execution trong repo nên để **Claude Code làm hạ tầng agent** và **MiniMax làm executor chính**.
* Cách này ổn định hơn khi sửa code thật, chi phí cũng hợp lý hơn.

### Phân vai cuối cùng

* `task-planner` → **Codex**
* `code-reviewer` → **MiniMax M2.7**
* `ux-reviewer` → **Gemini 3.1 Pro**
* `design-finder` → **Gemini 3.1 Pro**
* `master-executor` → **MiniMax M2.7**
* `test-checker` → **MiniMax M2.7-highspeed**
* `doc-writer` *(khuyên thêm)* → **MiniMax M2.7** hoặc Gemini tùy loại tài liệu

### Vai trò của Figma và Stitch

* **Figma + MCP** → dùng khi **đã có design sẵn** hoặc đã có file UI chính thức
* **Stitch** → dùng khi **chưa có design sẵn**, cần explore và sinh hướng giao diện ban đầu

### Triết lý hệ thống

* **Codex nghĩ và lên kế hoạch**
* **Gemini nghĩ về UI/UX**
* **Figma là nguồn design chuẩn khi đã có thiết kế**
* **Stitch là công cụ tạo hướng UI khi chưa có thiết kế**
* **MiniMax sửa code, verify, báo cáo**
* **Bạn là người xác nhận cuối**

---

## 1) Mục tiêu của hệ thống

Bạn đang xây một “đội AI” chứ không phải một chatbot đơn lẻ.

Mục tiêu của hệ này là:

* không dùng 1 model cho tất cả công việc
* đưa đúng việc cho đúng model/tool
* giảm chi phí cho phần đọc nhiều / sửa nhiều / test nhiều
* tăng chất lượng cho phần plan và UI
* tái sử dụng được sang nhiều project khác
* luôn có báo cáo rõ ràng trước và sau khi sửa

### Bài toán mà hệ này giải quyết

* AI sửa code lan man
* thiếu workflow trước khi sửa
* UI đẹp nhưng không ăn nhập với sản phẩm
* fix bug xong lại làm vỡ chỗ khác
* đã có design nhưng code lại lệch design
* mỗi project lại phải setup lại từ đầu

---

## 2) Kiến trúc tổng thể

## 2.1 Ba tầng chính

### Tầng 1 — Think / Plan

Dùng cho:

* hiểu task
* chia bước
* đánh giá độ ảnh hưởng
* xác định file liên quan
* lập thứ tự triển khai

**Model chính:** Codex

### Tầng 2 — Design / Review

Dùng cho:

* review code
* review UX
* đọc design có sẵn từ Figma
* đề xuất visual direction
* sinh prompt cho UI tool

**Model/tool chính:** MiniMax, Gemini, Figma, Stitch

### Tầng 3 — Execute / Verify

Dùng cho:

* sửa code
* cập nhật file
* chạy test/lint/build
* tạo execution report

**Model chính:** MiniMax qua Claude Code

---

## 2.2 Luồng chuẩn

```text
Bạn giao task
   ↓
Codex (task-planner) đọc yêu cầu và tạo task-plan.md
   ↓
MiniMax / Gemini chạy các agent review liên quan
   ↓
Nếu đã có design sẵn → đọc Figma qua MCP
Nếu chưa có design sẵn → dùng Stitch tạo hướng UI trước
   ↓
Bạn đọc report và xác nhận
   ↓
MiniMax (master-executor) sửa code theo ưu tiên
   ↓
MiniMax highspeed (test-checker) verify
   ↓
Tạo execution-report.md và trả kết quả cho bạn
```

---

## 3) Tư duy tái sử dụng cho nhiều project

Không nên làm theo 1 trong 2 cực đoan sau:

### Sai lầm 1: làm quá chung chung

Hậu quả:

* agent nói đúng lý thuyết nhưng thiếu sát repo
* review dài nhưng ít hữu ích
* UI suggestion đẹp nhưng không hợp sản phẩm
* execution dễ lạc hướng

### Sai lầm 2: đóng cứng theo một project

Hậu quả:

* sang project khác gần như phải viết lại toàn bộ
* khó biến nó thành workflow cá nhân lâu dài

### Cách đúng: chia 3 lớp ngữ cảnh

#### Lớp A — Core reusable

Phần này dùng lại gần như nguyên xi:

* vai trò agent
* format report
* quy trình phân tích → xác nhận → sửa → verify
* permission rules
* checklist chung

#### Lớp B — Domain pack

Phần này dùng lại theo loại dự án:

* ecommerce admin
* dashboard SaaS
* booking system
* backend service
* portfolio / landing page

#### Lớp C — Project pack

Phần này riêng cho từng repo:

* stack thật
* routes thật
* folder structure
* lệnh test/build/lint
* rules nghiệp vụ
* design tokens thương hiệu
* file Figma chính nếu có

**Kết luận:**

* workflow nên chung
* domain guidance nên bán-chung
* project context phải riêng

---

## 4) Cấu trúc thư mục chuẩn

Có 2 cách tổ chức. Mình khuyên dùng cách 2 nếu bạn muốn tái sử dụng lâu dài.

## 4.1 Cách 1 — đơn giản, dành cho 1 project

```text
project-root/
├─ CLAUDE.md
├─ PROJECT_CONTEXT.md
├─ DESIGN.md
├─ FIGMA_CONTEXT.md
├─ reports/
│  ├─ task-plan.md
│  ├─ code-review-report.md
│  ├─ ux-review-report.md
│  ├─ design-inspiration.md
│  ├─ test-report.md
│  └─ execution-report.md
└─ .claude/
   ├─ settings.json
   ├─ agents/
   │  ├─ task-planner.md
   │  ├─ code-reviewer.md
   │  ├─ ux-reviewer.md
   │  ├─ design-finder.md
   │  ├─ master-executor.md
   │  ├─ test-checker.md
   │  └─ doc-writer.md
   └─ hooks/
```

## 4.2 Cách 2 — chuẩn để tái sử dụng nhiều project

```text
ai-system/
├─ core/
│  ├─ agents/
│  ├─ templates/
│  ├─ report-templates/
│  ├─ skills/
│  └─ rules/
│
├─ domains/
│  ├─ ecommerce-admin/
│  │  ├─ DESIGN_BASE.md
│  │  ├─ UX_RULES.md
│  │  └─ TASK_GUIDE.md
│  ├─ dashboard-saas/
│  ├─ backend-service/
│  └─ booking-system/
│
└─ projects/
   └─ your-project/
      ├─ CLAUDE.md
      ├─ PROJECT_CONTEXT.md
      ├─ DESIGN.md
      ├─ FIGMA_CONTEXT.md
      ├─ reports/
      └─ .claude/
         ├─ settings.json
         ├─ agents/
         ├─ skills/
         └─ hooks/
```

### Nên chọn cách nào?

* Nếu bạn mới test hệ thống: dùng **Cách 1**
* Nếu bạn muốn biến nó thành workflow dài hạn: dùng **Cách 2**

---

## 5) Những file bắt buộc phải có

## 5.1 `CLAUDE.md`

Đây là file “luật làm việc” của agent trong repo.

Nó không mô tả business chi tiết, mà mô tả:

* workflow tổng
* thứ tự ưu tiên
* khi nào phải dừng chờ user
* phạm vi được sửa
* nguyên tắc khi ghi report

### Mẫu `CLAUDE.md`

```md
# Team Rules

## Working mode
- Luôn bắt đầu bằng planning nếu task có độ ảnh hưởng vừa hoặc lớn.
- Không sửa code ngay nếu chưa có đủ report cần thiết.
- Với task nhỏ, có thể bỏ qua planner nếu user yêu cầu rõ phạm vi.

## Required flow
1. task-planner tạo `reports/task-plan.md`
2. các reviewer liên quan tạo report
3. nếu task có UI:
   - có design sẵn thì đọc Figma
   - chưa có design thì tạo hướng UI trước
4. dừng để user xác nhận
5. master-executor mới được sửa code
6. test-checker verify cuối
7. tạo `reports/execution-report.md`

## Priority order
1. Bug nghiêm trọng
2. Security risk
3. Broken UX chính
4. Build/test failure
5. Cleanup nhỏ

## Edit policy
- Sửa tối thiểu, không refactor lan man.
- Không đổi public API nếu chưa nêu rõ.
- Không rename diện rộng nếu không thật sự cần.
- Nếu thiếu context, ghi vào report thay vì đoán.

## Reporting rules
- Mọi report phải có:
  - Summary
  - Critical
  - Warning
  - Suggestion
  - Files checked
```

---

## 5.2 `PROJECT_CONTEXT.md`

File này là trái tim của từng repo.

Nó trả lời:

* project này là gì
* ai dùng nó
* stack gì
* folder quan trọng ở đâu
* run project ra sao
* test/build/lint ra sao
* coding conventions gì
* business rules nào không được phá

### Mẫu `PROJECT_CONTEXT.md`

```md
# Project Context

## Product summary
Đây là web app quản lý cửa hàng laptop.

## Primary users
- Admin cửa hàng
- Nhân viên quản lý sản phẩm

## Main goals
- Quản lý danh sách laptop
- Tìm kiếm / lọc / cập nhật thông tin
- Kiểm tra tồn kho / trạng thái

## Tech stack
- Node.js
- Express
- MongoDB native driver
- EJS
- CSS / Bootstrap

## Important folders
- `routes/`: định nghĩa route
- `controllers/`: xử lý logic
- `models/` hoặc `mongodb.js`: kết nối dữ liệu
- `views/`: giao diện EJS
- `public/`: CSS, JS, image

## Dev commands
- Start dev: `npm run dev`
- Start app: `npm start`
- Test: `npm test`
- Lint: `npm run lint`
- Build: không có build riêng

## Coding conventions
- Không dùng Mongoose
- Ưu tiên native MongoDB driver
- Route handler phải có xử lý lỗi
- Không hardcode HTML dài trong controller

## Sensitive rules
- Không đổi format `id` sản phẩm hiện tại nếu không có lý do rõ ràng
- Không đổi tên route public nếu không ghi rõ trong report
- Không làm vỡ giao diện bảng sản phẩm hiện tại
```

---

## 5.3 `DESIGN.md`

File này để dùng cho tất cả agent UI, nhất là Gemini và design-finder.

### Nên chứa gì?

* brand tone
* màu chính / phụ
* typography
* spacing scale
* radius
* shadow
* button style
* input style
* table style
* card style
* empty state
* error state
* responsive rules

### Mẫu `DESIGN.md`

```md
# Design System Rules

## Visual tone
- Hiện đại, sạch, dễ đọc
- Ưu tiên cảm giác cao cấp vừa phải
- Không quá màu mè

## Colors
- Primary: navy đậm
- Accent: tím nhẹ
- Background: sáng, sạch
- Danger: đỏ vừa phải
- Success: xanh lá vừa phải

## Typography
- Heading rõ ràng, đậm vừa
- Body text dễ đọc
- Không dùng quá nhiều cỡ chữ

## Spacing
- Dùng khoảng trắng rộng vừa phải
- Card và section cần có nhịp spacing nhất quán

## Components
- Button chính nổi bật nhưng không chói
- Input bo góc nhẹ, focus state rõ
- Table phải dễ scan, không dày đặc
- Modal gọn, CTA rõ

## Responsive
- Desktop-first
- Tablet phải giữ được bố cục chính
- Mobile ưu tiên form và action chính

## UX rules
- Form lỗi phải hiện rõ dưới input
- CTA chính chỉ có 1 điểm nhấn mỗi màn hình
- Empty state phải gợi ý hành động tiếp theo
```

---

## 5.4 `FIGMA_CONTEXT.md` *(nên có nếu project làm UI nhiều)*

File này dành cho trường hợp **đã có design sẵn trong Figma**.

Nó nên chứa:

* link file Figma chính
* link page hoặc frame quan trọng
* thư viện component đang dùng
* quy ước đặt tên layer/component
* màn hình nào là source of truth
* màn hình nào đã cũ, không nên bám theo
* ghi chú mapping giữa design và code

### Mẫu `FIGMA_CONTEXT.md`

```md
# Figma Context

## Main file
- Product UI master file: <dán link>

## Important pages
- Dashboard
- Product list
- Product details
- Modal patterns

## Source of truth
- Page `Ready for Dev` là nguồn chuẩn để bám theo
- Không dùng các frame trong page `Exploration` để code production

## Component libraries
- Internal UI Kit v2
- Icon set chính

## Naming conventions
- Component names nên bám theo Dev Mode naming nếu có thể
- Ưu tiên bám theo variant names trong Figma

## Code mapping notes
- `PrimaryButton` trong code tương ứng với `Button / Primary`
- `ProductCard` tương ứng với `Card / Product`
```

---

## 5.5 `reports/`

Nơi toàn bộ agent ghi kết quả.

### Các file cần có

* `task-plan.md`
* `code-review-report.md`
* `ux-review-report.md`
* `design-inspiration.md`
* `test-report.md`
* `execution-report.md`

### Quy tắc

* Mỗi agent chỉ ghi đúng file của mình
* Không agent nào ghi đè bừa file report của agent khác
* Nếu chưa đủ dữ liệu, ghi rõ `Open questions`

---

## 6) Thiết kế agent chuẩn

## 6.1 `task-planner` — Codex only

**Vai trò:**

* hiểu yêu cầu
* chia bước
* xác định file liên quan
* nêu rủi ro
* không sửa code

**Đầu vào:**

* user task
* `PROJECT_CONTEXT.md`
* code liên quan

**Đầu ra:**

* `reports/task-plan.md`

### File `task-planner.md`

```md
---
name: task-planner
description: Analyze the requested task, break it into steps, identify affected files, and write a plan. Never edit code.
tools: Read, Glob, Grep
---

Bạn là task planner.

Nhiệm vụ:
- Chỉ đọc và lập kế hoạch.
- Không sửa code.
- Không viết patch.
- Không đề xuất refactor lớn nếu user không yêu cầu.

Hãy tạo `reports/task-plan.md` theo format:
- Goal
- Assumptions
- Affected files
- Risks
- Execution order
- Open questions
```

---

## 6.2 `code-reviewer` — MiniMax

**Vai trò:**

* soi logic
* naming
* maintainability
* error handling
* security issues

**Chỉ đọc, không sửa.**

### File `code-reviewer.md`

```md
---
name: code-reviewer
description: Review logic, naming, maintainability, and security. Only read and write a report.
tools: Read, Glob, Grep
---

Bạn là code reviewer.

Nhiệm vụ:
- Chỉ đọc code.
- Không sửa code.
- Tìm lỗi logic, xử lý lỗi thiếu, naming kém, duplicated code, security risk.
- Ghi vào `reports/code-review-report.md`.

Format report:
- Summary
- Critical
- Warning
- Suggestion
- Files checked
```

---

## 6.3 `ux-reviewer` — Gemini

**Vai trò:**

* review usability
* hierarchy
* spacing
* accessibility
* form UX
* responsive
* đối chiếu design thật nếu có Figma

### File `ux-reviewer.md`

```md
---
name: ux-reviewer
description: Review UI and UX quality, accessibility, and responsiveness. Only write a report.
tools: Read, Glob, Grep
---

Bạn là UX reviewer.

Nhiệm vụ:
- Chỉ đọc file giao diện liên quan.
- Soi mobile, desktop hierarchy, forms, CTA, spacing, empty/error states.
- So sánh với `DESIGN.md` nếu file đó có tồn tại.
- Nếu có `FIGMA_CONTEXT.md`, coi đó là design reference chính.
- Ghi vào `reports/ux-review-report.md`.

Format report:
- Summary
- UX issues
- Accessibility issues
- Responsive issues
- Suggestions
- Files checked
```

---

## 6.4 `design-finder` — Gemini

**Vai trò:**

* phân tích ngữ cảnh màn hình
* đề xuất visual direction
* nếu chưa có design: viết prompt cho Stitch
* nếu đã có design: giúp diễn giải Figma thành chỉ dẫn triển khai
* không sửa code

### File `design-finder.md`

```md
---
name: design-finder
description: Propose visual direction and generate UI guidance. If no design exists, prepare prompt-ready guidance for Stitch. Never edit code.
tools: Read, Glob, Grep
---

Bạn là design finder.

Nhiệm vụ:
- Đọc brief, `PROJECT_CONTEXT.md`, `DESIGN.md`, và file UI liên quan.
- Nếu đã có `FIGMA_CONTEXT.md`, bám theo Figma làm nguồn chuẩn.
- Nếu chưa có design chính thức, đề xuất hướng visual và viết prompt có cấu trúc để dùng với Stitch.
- Ghi vào `reports/design-inspiration.md`.

Report cần có:
- Current UI direction
- Problems in current UI
- Proposed visual direction
- Component priorities
- Figma implementation notes hoặc Stitch prompt
- Notes for implementation
```

---

## 6.5 `master-executor` — MiniMax only

Đây là chỗ rất quan trọng: **không dùng Codex ở đây**.

**Vai trò:**

* đọc report
* sửa code theo thứ tự ưu tiên
* bám theo design đã chốt
* ghi lại thay đổi
* không tự ý mở rộng phạm vi

### File `master-executor.md`

```md
---
name: master-executor
description: Read reports, apply focused code changes, and write execution-report.md. Only this agent may edit code.
tools: Read, Glob, Grep, Edit, Write, Bash
---

Bạn là master executor.

Nhiệm vụ:
- Đọc `reports/task-plan.md` nếu có.
- Đọc toàn bộ report liên quan.
- Nếu có `FIGMA_CONTEXT.md`, coi design đó là nguồn tham chiếu chính cho task UI.
- Chỉ sửa code sau khi user đã xác nhận.
- Sửa theo thứ tự ưu tiên:
  1. Critical bug
  2. Security issue
  3. Broken UX chính
  4. Reliability / maintainability issue
  5. Cleanup nhỏ
- Không refactor lan man.
- Không tự đổi kiến trúc nếu chưa được yêu cầu.
- Sau khi sửa xong, ghi `reports/execution-report.md`.

Format execution report:
- Summary of changes
- Files changed
- Why each change was made
- What was intentionally not changed
- Open follow-ups
```

---

## 6.6 `test-checker` — MiniMax highspeed

**Vai trò:**

* verify sau khi sửa
* chạy test/lint/build nếu có
* không sửa code

### File `test-checker.md`

```md
---
name: test-checker
description: Run verification commands and report whether the recent changes are safe.
tools: Read, Glob, Grep, Bash
---

Bạn là test checker.

Nhiệm vụ:
- Không sửa code.
- Chạy test, lint, build hoặc các lệnh verify phù hợp.
- Nếu project không có test, hãy kiểm tra command khả dụng và ghi rõ giới hạn.
- Ghi vào `reports/test-report.md`.

Format:
- Commands run
- Passed
- Failed
- Warnings
- Remaining risks
```

---

## 6.7 `doc-writer` — khuyên thêm

**Vai trò:**

* viết changelog
* update README
* viết migration note
* release note

### File `doc-writer.md`

```md
---
name: doc-writer
description: Update or write supporting documentation after major changes.
tools: Read, Glob, Grep, Edit, Write
---

Bạn là doc writer.

Nhiệm vụ:
- Chỉ cập nhật tài liệu khi được yêu cầu hoặc khi master-executor đánh dấu cần update docs.
- Ưu tiên README, CHANGELOG, migration note.
```

---

## 7) Workflow UI: khi nào dùng Figma, khi nào dùng Stitch

## 7.1 Trường hợp đã có design sẵn

Khi đã có thiết kế trong Figma, **Figma là nguồn đúng trước**, không để agent tự thiết kế lại từ đầu.

### Luồng nên dùng

1. Kết nối Figma MCP.
2. Ghi link và page quan trọng vào `FIGMA_CONTEXT.md`.
3. `ux-reviewer` và `design-finder` đọc Figma context.
4. `master-executor` code theo design thật.
5. `test-checker` verify responsive và hành vi.

### Mục tiêu

* giảm lệch giữa design và code
* giữ đúng spacing, component, variant, state
* tránh AI tự “sáng tác” thêm khi đã có source of truth

## 7.2 Trường hợp chưa có design sẵn

Khi chưa có Figma hoặc design còn mơ hồ:

1. Gemini viết UI brief.
2. `design-finder` tạo prompt cho Stitch.
3. Stitch sinh 2–4 hướng UI.
4. Bạn chọn 1 hướng.
5. Nếu cần, đưa hướng đã chọn vào Figma để chốt.
6. Sau đó `master-executor` mới code.

### Mục tiêu

* tăng tốc khám phá giao diện
* tránh code UI khi chưa có hướng rõ
* dùng Stitch như công cụ explore, không phải source of truth lâu dài

## 7.3 Nguyên tắc chốt

* **Có design sẵn:** ưu tiên **Figma + MCP**
* **Chưa có design:** ưu tiên **Gemini + Stitch**
* **Sau khi khám phá xong:** chốt lại trong **Figma** hoặc **DESIGN.md** rồi mới code production

---

## 8) Setup Figma + MCP cho Claude Code

## 8.1 Vì sao cần MCP

MCP giúp Claude Code kết nối với tool ngoài và lấy context thật từ đó.

Trong case UI, điều này giúp agent:

* đọc design context từ Figma
* hiểu frame, component, structure, naming
* bám theo design thay vì đoán

## 8.2 Chuẩn bị trước

Bạn cần:

* Figma desktop app
* file design thật hoặc ít nhất 1 file UI source
* Claude Code đang chạy được
* quyền dùng Dev Mode / MCP phù hợp với workspace của bạn

## 8.3 Luồng setup khái niệm

1. Bật MCP server trong Figma desktop app.
2. Kết nối Claude Code với Figma qua MCP.
3. Kiểm tra Claude Code đã thấy Figma MCP server chưa.
4. Cho agent đọc frame/file liên quan.
5. Ghi lại link hoặc context quan trọng trong `FIGMA_CONTEXT.md`.

## 8.4 Quy tắc dùng Figma MCP trong hệ của bạn

* `ux-reviewer` được đọc Figma context.
* `design-finder` được đọc Figma khi cần diễn giải design hoặc so sánh current UI.
* `master-executor` chỉ bám theo design đã được xác nhận.
* Không coi những frame exploration là nguồn chính nếu chưa chốt.

## 8.5 Khi nào nên dùng Code Connect

Nếu project UI của bạn có design system hoặc component library ổn định, nên nghĩ đến việc map component code với component Figma để tái sử dụng tốt hơn.

---

## 9) Template report chuẩn

## 9.1 `reports/task-plan.md`

```md
# Task Plan

## Goal

## Assumptions

## Affected files

## Risks

## Execution order
1.
2.
3.

## Open questions
```

## 9.2 `reports/code-review-report.md`

```md
# Code Review Report

## Summary

## Critical
- None / ...

## Warning
- ...

## Suggestion
- ...

## Files checked
- ...
```

## 9.3 `reports/ux-review-report.md`

```md
# UX Review Report

## Summary

## UX issues
- ...

## Accessibility issues
- ...

## Responsive issues
- ...

## Suggestions
- ...

## Files checked
- ...
```

## 9.4 `reports/design-inspiration.md`

```md
# Design Inspiration Report

## Current UI direction

## Current problems

## Proposed visual direction

## Component priorities

## Figma notes or Stitch prompt

## Implementation notes
```

## 9.5 `reports/test-report.md`

```md
# Test Report

## Commands run
- ...

## Passed
- ...

## Failed
- ...

## Warnings
- ...

## Remaining risks
- ...
```

## 9.6 `reports/execution-report.md`

```md
# Execution Report

## Summary of changes

## Files changed
- ...

## Why each change was made
- ...

## What was intentionally not changed
- ...

## Follow-ups
- ...
```

---

## 10) Settings và quyền hạn

## 10.1 Tư duy phân quyền

### Reviewer agents

Chỉ nên có:

* Read
* Glob
* Grep

### Executor agent

Có:

* Read
* Glob
* Grep
* Edit
* Write
* Bash

### Test agent

Có:

* Read
* Glob
* Grep
* Bash

**Mục tiêu:**

* giảm sửa bừa
* tách trách nhiệm rõ
* khi lỗi xảy ra dễ biết do agent nào

---

## 11) Tổ chức theo “template pack” để tái sử dụng

Tạo 1 bộ template riêng của bạn:

```text
ai-core/
├─ domains/
│  ├─ ecommerce-admin/
│  │  ├─ DESIGN_BASE.md
│  │  ├─ UX_RULES.md
│  │  └─ TASK_GUIDE.md
│  ├─ dashboard-saas/
│  └─ backend-service/
│
├─ report-templates/
│  ├─ code-review-template.md
│  ├─ ux-review-template.md
│  ├─ task-plan-template.md
│  ├─ execution-report-template.md
│  └─ test-report-template.md
│
└─ agent-templates/
   ├─ task-planner.md
   ├─ code-reviewer.md
   ├─ ux-reviewer.md
   ├─ design-finder.md
   ├─ master-executor.md
   ├─ test-checker.md
   └─ doc-writer.md
```

Khi sang project mới, bạn chỉ cần:

* copy agent templates
* chọn 1 domain pack gần nhất
* sửa `PROJECT_CONTEXT.md`
* sửa `DESIGN.md`
* thêm `FIGMA_CONTEXT.md` nếu project đã có design
* sửa commands trong project context

---

## 12) Cái gì nên chung, cái gì phải riêng

### Nên chung

* tên agent
* vai trò agent
* format report
* workflow xác nhận trước khi sửa
* priority order
* permission policy
* folder reports
* checklist verify

### Nên theo domain

* tone UX
* design heuristics
* loại component thường dùng
* dashboard/table/forms/checkout/booking flow

### Phải riêng theo project

* tên model dữ liệu
* routes thật
* business rules
* test commands
* build commands
* folder structure
* coding conventions đặc thù
* design tokens riêng của brand
* link Figma và source of truth

---

## 13) Khuyến nghị thực tế cho setup của bạn

### Bản V1 — dễ setup, hiệu quả cao

* `task-planner` → Codex
* `code-reviewer` → MiniMax M2.7
* `ux-reviewer` → Gemini 3.1 Pro
* `design-finder` → Gemini 3.1 Pro
* `master-executor` → MiniMax M2.7
* `test-checker` → MiniMax M2.7-highspeed
* Figma nếu đã có design
* Stitch nếu chưa có design

**Ưu điểm:** dễ triển khai, ít phức tạp, hiệu quả rõ.

### Bản V2 — chuẩn hóa tái sử dụng

* tách `ai-core`
* tạo `domains/*`
* tạo bộ template report
* mỗi project có `PROJECT_CONTEXT.md` riêng
* mỗi project UI có thể có `FIGMA_CONTEXT.md`

### Bản V3 — nâng cấp sau

* thêm hooks
* thêm auto-generated changelog/docs
* thêm worktree isolation cho task lớn
* thêm Code Connect nếu design system đủ trưởng thành

---

## 14) Checklist setup từng bước

### Bước 1

Cài Claude Code và xác nhận chạy được.

### Bước 2

Cấu hình MiniMax cho Claude Code nếu bạn đang để MiniMax làm provider worker.

### Bước 3

Nếu project đã có design trong Figma, chuẩn bị `FIGMA_CONTEXT.md` và setup Figma MCP.

### Bước 4

Tạo `.claude/agents/`.

### Bước 5

Tạo `CLAUDE.md`, `PROJECT_CONTEXT.md`, `DESIGN.md`, và nếu cần thì `FIGMA_CONTEXT.md`.

### Bước 6

Tạo thư mục `reports/`.

### Bước 7

Thêm 6 hoặc 7 subagent chuẩn.

### Bước 8

Khóa permission:

* reviewer chỉ đọc
* executor mới được edit/write/bash mạnh
* test-checker chỉ verify

### Bước 9

Tạo domain pack đầu tiên của bạn, ví dụ `ecommerce-admin`.

### Bước 10

Chạy thử trên 1 task nhỏ:

* sửa 1 bug UI
* review 1 trang
* thêm 1 modal nhỏ

### Bước 11

Rút kinh nghiệm, tinh chỉnh prompt agent.

### Bước 12

Thiết lập quy tắc UI cuối cùng:

* có Figma chính thức thì bám Figma
* chưa có Figma thì dùng Stitch để explore
* sau khi chốt hướng thì ghi lại vào `DESIGN.md` hoặc Figma rồi mới code

---

## 15) Câu trả lời trực tiếp cho câu hỏi của bạn

### “Hệ thống này có tái sử dụng cho project khác được không?”

**Có, rất nên.**

### “Nên làm chung chung ngữ cảnh hay tách riêng?”

**Không nên chỉ chung chung.**

Cách đúng là:

* **workflow chung**
* **domain context bán-chung**
* **project context riêng**

Nếu làm chung chung hoàn toàn:

* agent nói hay nhưng mơ hồ
* sửa sai domain
* UI đẹp nhưng không hợp sản phẩm
* report ít giá trị thực chiến

Nếu đóng cứng hoàn toàn theo 1 project:

* chuyển sang repo khác là làm lại từ đầu

**Cách cân bằng tốt nhất:** core reusable + domain pack + project pack.

---

## 16) Cấu trúc cuối cùng mình khuyên bạn chốt

```text
ai-system/
├─ core/
│  ├─ agents/
│  ├─ reports/
│  ├─ templates/
│  └─ rules/
├─ domains/
│  ├─ ecommerce-admin/
│  ├─ dashboard-saas/
│  └─ backend-service/
└─ projects/
   └─ your-project/
      ├─ CLAUDE.md
      ├─ PROJECT_CONTEXT.md
      ├─ DESIGN.md
      ├─ FIGMA_CONTEXT.md
      ├─ reports/
      └─ .claude/
```

Đây là form vừa tái sử dụng tốt, vừa đủ cụ thể để agent làm việc đúng.

---

## 17) Hướng đi tiếp theo

Khi áp dụng thật, ưu tiên làm theo thứ tự:

1. dựng bộ core tối thiểu
2. tạo project pack cho repo hiện tại
3. nếu có design thì nối Figma MCP trước
4. test workflow với 1 task nhỏ
5. mới thêm Stitch vào nhánh chưa có design
6. sau đó mới nghĩ đến tự động hóa sâu hơn

---

## 18) Bộ file copy-paste để setup ngay

Phần này là bản thực dụng: bạn có thể lấy nguyên nội dung từng file để đưa vào repo.

## 18.1 `.claude/settings.json`

Mục tiêu của file này:

* giữ cấu hình chung của Claude Code trong repo
* chọn model mặc định cho session executor
* giữ chỗ cho MCP / hooks / policy sau này

### Bản khởi tạo tối thiểu

```json
{
  "model": "MiniMax-M2.7"
}
```

### Bản thực dụng hơn

```json
{
  "model": "MiniMax-M2.7",
  "env": {
    "PROJECT_CONTEXT_FILE": "PROJECT_CONTEXT.md",
    "DESIGN_RULES_FILE": "DESIGN.md",
    "FIGMA_CONTEXT_FILE": "FIGMA_CONTEXT.md",
    "REPORTS_DIR": "reports"
  }
}
```

> Ghi nhớ: executor mặc định nên là MiniMax. Codex không đặt làm model mặc định của repo.

---

## 18.2 `CLAUDE.md`

```md
# Claude Team Rules

## Purpose
This repository uses a multi-agent workflow.
The goal is to separate planning, review, design interpretation, execution, and verification.

## Mandatory workflow
1. `task-planner` creates `reports/task-plan.md` for medium or large tasks.
2. Review agents create their reports.
3. For UI tasks:
   - if official design exists, use `FIGMA_CONTEXT.md` and Figma as the source of truth
   - if no official design exists, produce UI direction first before coding
4. Stop and summarize the plan for the user.
5. Only `master-executor` may edit production code.
6. `test-checker` verifies changes.
7. Write `reports/execution-report.md`.

## Roles
- Codex is used for planning only.
- MiniMax is used for code review, execution, and verification.
- Gemini is used for UX critique and design reasoning.
- Figma is the official design source when available.
- Stitch is only for UI exploration when there is no official design.

## Priority order
1. Critical bug
2. Security issue
3. Broken UX on main flow
4. Reliability / maintainability problem
5. Minor cleanup

## Editing rules
- Make the smallest safe change.
- Do not refactor broadly unless explicitly requested.
- Do not rename public routes or public APIs unless clearly justified.
- Do not change business rules silently.
- If context is missing, write it into a report instead of guessing.

## Reporting rules
Every report should be easy to scan and include:
- Summary
- Critical or major issues
- Warnings
- Suggestions
- Files checked or changed

## UI rules
- If Figma design exists, do not redesign the screen from scratch.
- If no official design exists, create direction first, confirm it, then implement.
- Use `DESIGN.md` as the UI/UX baseline.

## Execution safety
- `master-executor` must not expand scope on its own.
- If a requested change likely affects multiple areas, mention the risk in the report first.
- After edits, always run verification appropriate to the repo.
```

---

## 18.3 `PROJECT_CONTEXT.md`

> Phần dưới đây là template. Khi dùng thật, bạn thay nội dung bằng repo của bạn.

```md
# Project Context

## Product summary
Describe the product in 2-4 lines.
Example: This is a web application used to manage laptop products, prices, inventory, and search flows for store staff and admins.

## Primary users
- Admin
- Staff
- End user (if applicable)

## Main goals
- Goal 1
- Goal 2
- Goal 3

## Tech stack
- Node.js
- Express
- MongoDB native driver
- EJS
- CSS / Bootstrap

## Important folders
- `routes/`: route definitions
- `controllers/`: request handling
- `views/`: UI templates
- `public/`: CSS, JS, assets
- `mongodb.js` or `db/`: database connection and helpers

## Main commands
- Dev: `npm run dev`
- Start: `npm start`
- Test: `npm test`
- Lint: `npm run lint`
- Build: `npm run build`

## Coding conventions
- Prefer small, safe edits.
- Keep controllers readable.
- Handle errors explicitly.
- Avoid hidden business logic in views.
- Prefer existing patterns already used in the repo.

## Sensitive rules
- Do not break current route contracts.
- Do not change database id format without explicit approval.
- Do not replace the database driver if the project intentionally uses native MongoDB.
- Do not introduce heavy dependencies unless clearly necessary.

## Current pain points
- Add the real current issues here.
- Example: Search logic is inconsistent between backend and UI.
- Example: Layout spacing differs between pages.

## What good looks like
- Stable CRUD flow
- Predictable UI
- No broken responsive layout on key screens
- Clean execution reports after changes
```

---

## 18.4 `DESIGN.md`

```md
# Design System Rules

## Product tone
- Clean
- Modern
- Practical
- Slightly premium
- Easy to scan

## Layout principles
- Strong hierarchy
- Consistent spacing
- Main action should be obvious
- Avoid cluttered tables and overcrowded forms

## Color direction
- Primary: deep navy
- Accent: soft purple
- Neutral background: clean light surface
- Success, warning, danger should be clear but not oversaturated

## Typography
- Headings: clear and structured
- Body text: highly readable
- Avoid too many font sizes on the same screen

## Spacing
- Use consistent vertical rhythm
- Give tables and cards breathing room
- Forms should not feel dense

## Components
### Buttons
- One clear primary CTA per screen
- Secondary actions should be visually lighter

### Inputs
- Border and focus state must be obvious
- Inline validation should appear near the field

### Tables
- Easy to scan
- Enough row padding
- Important values should stand out

### Cards
- Soft separation from background
- Clear title and action grouping

### Modals
- Compact
- Clear title
- Primary and secondary actions visually distinct

## States
### Empty state
- Explain what is missing
- Suggest a next action

### Error state
- Explain what went wrong in simple language
- Show recovery action if possible

### Loading state
- Avoid layout jumping
- Prefer skeleton or stable placeholder layout

## Responsive rules
- Desktop-first, but mobile must still support key actions
- Forms and tables must degrade gracefully on smaller screens
- Important CTA should remain visible on mobile

## UX rules
- Keep forms short and predictable
- Avoid multiple competing CTAs
- Search and filters should be easy to find
- Error messages must be actionable
```

---

## 18.5 `FIGMA_CONTEXT.md`

```md
# Figma Context

## Main file
- Add the main Figma file link here

## Source of truth
- Specify which page, section, or frame is the implementation source of truth
- Example: `Ready for Dev`

## Non-source pages
- Example: `Exploration`, `Draft`, `Archive`
- These should not be used as implementation references unless explicitly stated

## Important screens
- Dashboard
- Product list
- Product details
- Create / edit modal
- Search / filter patterns

## Component library
- Add the UI kit or design system used by the file

## Naming rules
- Prefer matching component names between Figma and code when possible
- Use variant naming as implementation clues

## Mapping notes
- `Button / Primary` -> `PrimaryButton`
- `Card / Product` -> `ProductCard`
- `Modal / Default` -> `BaseModal`

## Notes for agents
- Figma is the visual source of truth for official UI tasks
- Do not invent new layout patterns unless user asks for redesign
```

---

## 18.6 `.claude/agents/task-planner.md`

> Agent này dành cho Codex về mặt logic. Nó không được sửa code.

```md
---
name: task-planner
description: Analyze the requested task, identify affected files, break the work into steps, and write a clear execution plan. Never edit code.
tools: Read, Glob, Grep
---

Bạn là task planner.

Mục tiêu:
- hiểu task
- tách nhỏ công việc
- chỉ ra file có khả năng bị ảnh hưởng
- nêu rủi ro
- đề xuất thứ tự thực hiện

Quy tắc bắt buộc:
- Chỉ đọc.
- Không sửa code.
- Không viết patch.
- Không tự đề xuất refactor lớn nếu user không yêu cầu.
- Không mở rộng phạm vi beyond task chính.

Bạn phải tạo `reports/task-plan.md` với format sau:

# Task Plan

## Goal
- mô tả mục tiêu ngắn gọn

## Assumptions
- giả định đang dùng

## Affected files
- file hoặc khu vực code cần xem

## Risks
- rủi ro kỹ thuật hoặc rủi ro UX

## Execution order
1. bước 1
2. bước 2
3. bước 3

## Open questions
- điều gì còn thiếu context
```

---

## 18.7 `.claude/agents/code-reviewer.md`

```md
---
name: code-reviewer
description: Review logic, maintainability, naming, and security. Only read code and write a report.
tools: Read, Glob, Grep
---

Bạn là code reviewer.

Mục tiêu:
- tìm lỗi logic
- tìm error handling thiếu
- tìm naming khó hiểu
- tìm duplicated logic
- tìm security risk hoặc reliability issue

Quy tắc bắt buộc:
- Chỉ đọc.
- Không sửa code.
- Không đề xuất thay đổi lan man không liên quan task.

Hãy tạo `reports/code-review-report.md` theo format:

# Code Review Report

## Summary

## Critical
- lỗi hoặc rủi ro nghiêm trọng

## Warning
- vấn đề vừa phải

## Suggestion
- đề xuất cải thiện nhỏ

## Files checked
- danh sách file đã xem
```

---

## 18.8 `.claude/agents/ux-reviewer.md`

```md
---
name: ux-reviewer
description: Review UX, accessibility, hierarchy, and responsiveness. Only read UI-related files and write a report.
tools: Read, Glob, Grep
---

Bạn là UX reviewer.

Mục tiêu:
- đánh giá hierarchy
- đánh giá form UX
- đánh giá CTA clarity
- đánh giá responsive
- đánh giá accessibility cơ bản

Ngữ cảnh cần ưu tiên:
- `DESIGN.md`
- `FIGMA_CONTEXT.md` nếu file đó tồn tại
- source code UI liên quan

Quy tắc bắt buộc:
- Chỉ đọc.
- Không sửa code.
- Nếu có Figma source of truth, không đề xuất đi chệch hoàn toàn design đó.

Hãy tạo `reports/ux-review-report.md` theo format:

# UX Review Report

## Summary

## UX issues
- ...

## Accessibility issues
- ...

## Responsive issues
- ...

## Suggestions
- ...

## Files checked
- ...
```

---

## 18.9 `.claude/agents/design-finder.md`

```md
---
name: design-finder
description: Create design guidance for implementation. If no official design exists, prepare structured prompts and UI direction for Stitch. Never edit code.
tools: Read, Glob, Grep
---

Bạn là design finder.

Mục tiêu:
- hiểu màn hình hoặc luồng cần làm
- nếu đã có design: diễn giải design thành chỉ dẫn triển khai
- nếu chưa có design: tạo hướng visual và prompt structured cho Stitch
- hỗ trợ giữ tính nhất quán với `DESIGN.md`

Quy tắc bắt buộc:
- Chỉ đọc.
- Không sửa code.
- Không biến task nhỏ thành redesign toàn bộ nếu user không yêu cầu.

Nếu có `FIGMA_CONTEXT.md`:
- coi Figma là nguồn chuẩn
- tóm tắt component, spacing, layout, trạng thái cần triển khai

Nếu chưa có Figma:
- ghi rõ visual direction
- tạo prompt Stitch có cấu trúc

Hãy tạo `reports/design-inspiration.md` theo format:

# Design Inspiration Report

## Current UI direction

## Current problems

## Proposed visual direction

## Component priorities

## Figma implementation notes or Stitch prompt

## Notes for implementation
```

---

## 18.10 `.claude/agents/master-executor.md`

> Đây là agent duy nhất được sửa code.

```md
---
name: master-executor
description: Apply focused code changes based on approved reports and write an execution report. Only this agent may edit code.
tools: Read, Glob, Grep, Edit, Write, Bash
---

Bạn là master executor.

Mục tiêu:
- đọc plan và các report
- sửa code đúng trọng tâm
- bám design đã được chốt
- ghi lại thay đổi một cách rõ ràng

Nguồn ưu tiên:
1. task của user
2. `reports/task-plan.md`
3. các review report liên quan
4. `FIGMA_CONTEXT.md` nếu task có UI và Figma đã tồn tại
5. `DESIGN.md`
6. patterns đang có sẵn trong repo

Quy tắc bắt buộc:
- Chỉ sửa code sau khi user đã xác nhận.
- Không mở rộng phạm vi sửa ngoài task chính nếu chưa nêu rõ trong report.
- Không refactor diện rộng nếu không thật sự cần.
- Với UI task đã có Figma, bám theo design source of truth.
- Với UI task chưa có design, chỉ bám theo direction đã được duyệt.

Thứ tự ưu tiên khi sửa:
1. Critical bug
2. Security issue
3. Broken UX chính
4. Reliability / maintainability issue
5. Cleanup nhỏ

Sau khi sửa xong, tạo `reports/execution-report.md` theo format:

# Execution Report

## Summary of changes

## Files changed
- ...

## Why each change was made
- ...

## What was intentionally not changed
- ...

## Follow-ups
- ...
```

---

## 18.11 `.claude/agents/test-checker.md`

```md
---
name: test-checker
description: Run verification commands after code changes and write a verification report. Never edit code.
tools: Read, Glob, Grep, Bash
---

Bạn là test checker.

Mục tiêu:
- verify thay đổi vừa thực hiện
- chạy test / lint / build nếu có
- ghi rõ mức độ an toàn còn lại

Quy tắc bắt buộc:
- Không sửa code.
- Nếu command không tồn tại, ghi rõ là command unavailable.
- Nếu repo không có test, ghi rõ giới hạn verify.

Hãy tạo `reports/test-report.md` theo format:

# Test Report

## Commands run
- ...

## Passed
- ...

## Failed
- ...

## Warnings
- ...

## Remaining risks
- ...
```

---

## 18.12 `.claude/agents/doc-writer.md`

```md
---
name: doc-writer
description: Update README, migration notes, changelog, or implementation notes when documentation needs to be refreshed.
tools: Read, Glob, Grep, Edit, Write
---

Bạn là doc writer.

Mục tiêu:
- cập nhật tài liệu sau khi có thay đổi quan trọng
- giữ README hoặc note đồng bộ với code

Quy tắc:
- Chỉ cập nhật docs khi user yêu cầu hoặc khi execution report chỉ ra cần update docs.
- Ưu tiên tài liệu ngắn, rõ, thực tế.
```

---

## 18.13 Các file report mẫu

### `reports/task-plan.md`

```md
# Task Plan

## Goal

## Assumptions

## Affected files

## Risks

## Execution order
1.
2.
3.

## Open questions
```

### `reports/code-review-report.md`

```md
# Code Review Report

## Summary

## Critical
- None

## Warning
- None

## Suggestion
- None

## Files checked
- None
```

### `reports/ux-review-report.md`

```md
# UX Review Report

## Summary

## UX issues
- None

## Accessibility issues
- None

## Responsive issues
- None

## Suggestions
- None

## Files checked
- None
```

### `reports/design-inspiration.md`

```md
# Design Inspiration Report

## Current UI direction

## Current problems

## Proposed visual direction

## Component priorities

## Figma implementation notes or Stitch prompt

## Notes for implementation
```

### `reports/test-report.md`

```md
# Test Report

## Commands run
- None yet

## Passed
- None yet

## Failed
- None

## Warnings
- None

## Remaining risks
- None
```

### `reports/execution-report.md`

```md
# Execution Report

## Summary of changes

## Files changed
- None yet

## Why each change was made

## What was intentionally not changed

## Follow-ups
```

---

## 19) Runbook thực chiến theo từng tình huống

## 19.1 Khi sửa bug backend hoặc logic

### Nên chạy luồng nào?

1. `task-planner`
2. `code-reviewer`
3. bạn đọc plan + report
4. `master-executor`
5. `test-checker`

### Mẫu prompt điều phối

```text
Hãy dùng task-planner để lập kế hoạch sửa bug này, sau đó dùng code-reviewer để tìm các vấn đề logic liên quan. Ghi report vào thư mục reports và dừng lại để tôi xác nhận trước khi sửa code.
```

Sau khi bạn xác nhận:

```text
Tôi xác nhận. Hãy để master-executor thực hiện thay đổi theo plan đã chốt, rồi chạy test-checker và cập nhật execution-report.md.
```

---

## 19.2 Khi sửa bug UI nhưng đã có design sẵn trong Figma

### Luồng đúng

1. `task-planner`
2. `ux-reviewer`
3. `design-finder` đọc Figma context
4. bạn xác nhận
5. `master-executor`
6. `test-checker`

### Mẫu prompt điều phối

```text
Task này là UI bug và đã có design sẵn trong Figma. Hãy dùng task-planner để chia việc, dùng ux-reviewer để review vấn đề hiện tại, và dùng design-finder để diễn giải implementation notes từ Figma context. Ghi các report rồi dừng lại để tôi xác nhận trước khi sửa code.
```

---

## 19.3 Khi làm màn hình mới nhưng chưa có design sẵn

### Luồng đúng

1. `task-planner`
2. `ux-reviewer` hoặc `design-finder` đọc context sản phẩm
3. `design-finder` tạo prompt cho Stitch
4. bạn chọn hướng UI
5. cập nhật `DESIGN.md` hoặc tạo Figma
6. `master-executor` mới code
7. `test-checker`

### Mẫu prompt điều phối

```text
Task này là làm màn hình mới và chưa có design chính thức. Hãy dùng task-planner để tạo kế hoạch, rồi dùng design-finder để tạo hướng visual và prompt structured cho Stitch. Chưa sửa code. Dừng lại sau khi đã có report để tôi chọn hướng UI.
```

---

## 19.4 Khi muốn review tổng thể một màn hình hiện có

### Luồng đúng

1. `ux-reviewer`
2. `code-reviewer` nếu nghi cả logic và UI
3. `design-finder` nếu cần hướng cải thiện
4. bạn chốt phạm vi
5. `master-executor` nếu muốn thực thi

### Prompt mẫu

```text
Hãy review màn hình này theo cả UX và technical quality. Dùng ux-reviewer để soi hierarchy, form UX, responsive, accessibility. Dùng code-reviewer nếu có dấu hiệu logic UI bị rối. Chỉ tạo report, chưa sửa code.
```

---

## 19.5 Khi đã có Figma và muốn code bám thật sát

### Luồng đúng

1. cập nhật `FIGMA_CONTEXT.md`
2. `design-finder` tóm tắt implementation notes
3. `ux-reviewer` chỉ ra điểm lệch giữa code hiện tại và design
4. bạn xác nhận
5. `master-executor` sửa
6. `test-checker`

### Prompt mẫu

```text
Chúng ta đã có Figma source of truth. Hãy dùng design-finder để trích implementation notes từ Figma context, dùng ux-reviewer để so sánh code hiện tại với design chuẩn, và dừng lại trước khi thực hiện chỉnh sửa.
```

---

## 20) Cách dùng hệ này cho project khác

Khi chuyển sang repo mới, quy trình tối giản là:

1. copy `.claude/agents/`
2. copy `CLAUDE.md`
3. copy `DESIGN.md` base hoặc domain base phù hợp
4. tạo `PROJECT_CONTEXT.md` mới cho repo đó
5. nếu có Figma thì tạo `FIGMA_CONTEXT.md`
6. tạo `reports/`
7. test bằng 1 task nhỏ trước

### Những gì chỉ cần sửa khi sang repo khác

* mô tả sản phẩm trong `PROJECT_CONTEXT.md`
* commands test/build/lint
* rules nhạy cảm của project
* design tone
* figma link và source of truth

### Những gì giữ nguyên được

* vai trò agent
* workflow analyze → confirm → execute → verify
* format report
* permission philosophy
* logic dùng Figma / Stitch

---

## 21) Bộ checklist cuối để xác nhận hệ đã sẵn sàng

Phần này dùng như checklist chốt cuối trước khi bạn đem hệ thống vào dùng thật.

### Về cấu trúc

*  Có file `.claude/settings.json`
*  Có thư mục `.claude/agents/`
*  Có `CLAUDE.md`
*  Có `PROJECT_CONTEXT.md`
*  Có `DESIGN.md`
*  Có thư mục `reports/`
*  Có `FIGMA_CONTEXT.md` nếu project dùng Figma
*  Các file report mẫu đã được tạo sẵn
*  Cấu trúc thư mục repo đủ rõ để agent đọc và không nhầm chỗ

### Về vai trò

* `task-planner` chỉ làm planning, không sửa code
* `code-reviewer` chỉ review code và ghi report
* `ux-reviewer` chỉ review UX/UI và ghi report
* `design-finder` chỉ diễn giải design hoặc tạo hướng UI, không sửa code
* `master-executor` là agent duy nhất được sửa code
* `test-checker` chỉ verify, không sửa code
* Codex chỉ được dùng cho planning
* MiniMax được dùng cho execution và verification
* Gemini được dùng cho UX/design reasoning
* Figma là source of truth khi đã có design chính thức
* Stitch chỉ dùng khi chưa có design chính thức

### Về workflow

* Task vừa hoặc lớn luôn đi qua bước planning trước
* Task có UI thì luôn xác định rõ: đã có Figma hay chưa
* Nếu đã có Figma thì agent bám theo Figma, không tự redesign
* Nếu chưa có Figma thì phải chốt hướng UI trước khi code
* Luôn có bước dừng để bạn xác nhận trước khi `master-executor` sửa code
* Sau khi sửa xong luôn có `execution-report.md`
* Sau khi sửa xong luôn có bước verify bằng `test-checker`
* Nếu verify fail thì phải ghi rõ lỗi và mức độ rủi ro còn lại
* Agent không được tự mở rộng phạm vi sửa ngoài task chính
* Các thay đổi lớn phải được ghi rõ lý do trong report

### Về tái sử dụng

* Core workflow có thể giữ nguyên khi sang repo mới
* Domain pack có thể thay theo loại dự án
* `PROJECT_CONTEXT.md` được viết riêng cho từng repo
* `DESIGN.md` được điều chỉnh theo sản phẩm thật
* `FIGMA_CONTEXT.md` được cập nhật đúng file và page đang dùng
* Commands test/build/lint đã được chỉnh đúng cho repo hiện tại