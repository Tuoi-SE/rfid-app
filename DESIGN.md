# Design System Rules

## Official Source
Figma file: **RIOTEX-UI** (9Gix0X6vqHGmiLjFykY3ea)
All UI work must match Figma. When Figma and this document differ, Figma wins.

---

## Product tone
- Clean, modern, professional
- Dark-themed dashboard (Bento Grid system)
- Data-dense but scannable
- Slightly premium feel
- Enterprise-grade feel with navy palette
- Consistent across all modules
- Mobile app uses same dark theme but with larger touch targets

---

## Color palette

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#000000` | Page background (pure black) |
| `background-alt` | `#000647` | Very dark navy |
| `surface` | `#0B1C30` | Cards, panels (dark navy) |
| `surface-elevated` | `#0E162B` | Modals, dropdowns (navy) |
| `surface-overlay` | `#1C283C` | Overlay cards |
| `border` | `#1C283C` | Subtle borders |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#ffffff` | Headings, primary content |
| `text-secondary` | `#a1a1aa` | Secondary content |
| `text-muted` | `#71717a` | Disabled, hints |

### Accent (primary is INDIGO/PURPLE, not blue)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#4F39F6` | Primary buttons, links (indigo) |
| `primary-hover` | `#3B2EE6` | Hover state (darker) |
| `primary-muted` | `rgba(79, 57, 246, 0.15)` | Backgrounds |
| `secondary` | `#9747FF` | Secondary accent (purple) |
| `secondary-light` | `#7985E8` | Lighter purple |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#00BC7C` | Success states, positive numbers |
| `success-alt` | `#22C55E` | Alternative green |
| `warning` | `#F97316` | Warnings, pending states |
| `warning-alt` | `#E17100` | Darker orange |
| `danger` | `#BA1A1A` | Errors, destructive actions |
| `danger-alt` | `#FA2B36` | Alternative red |
| `danger-bright` | `#E7000A` | Bright red |
| `info` | `#155CFB` | Informational blue |

### Stats card accents (light pastels on dark)
| Token | Hex | Usage |
|-------|-----|-------|
| `stat-blue` | `#DCE9FF` | Blue stat backgrounds |
| `stat-blue-alt` | `#DBEAFF` | Alt blue |
| `stat-green` | `#DCFCE7` | Green stat backgrounds |
| `stat-amber` | `#FEF3C7` | Amber stat backgrounds |
| `stat-red` | `#FEE2E2` | Red stat backgrounds |

### Light backgrounds (for contrast areas)
| Token | Hex | Usage |
|-------|-----|-------|
| `light-bg` | `#E1E8F0` | Cool gray white |
| `light-surface` | `#F0F4F9` | Light surface |

---

## Typography

### Font families
| Font | Usage | Notes |
|------|-------|-------|
| Manrope | Headings | Weight 700/800, sizes 20-36px |
| SF Pro | iOS / mobile body | System font, sizes 9-36px |
| Inter | Web body text | Sizes 9.5-24px |
| Liberation Mono | Monospace for codes | EPCs, IDs, 14px bold |

Fallback stack: system-ui, -apple-system, sans-serif

### Font sizes
| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, captions |
| `text-sm` | 14px | Body small, table cells |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Section titles |
| `text-2xl` | 24px | Page titles |
| `text-4xl` | 36px | Stat numbers (large cards) |

### Font weights
- Headings: `bold` (700-800)
- Body: `normal` (400) to `medium` (500)
- Stat numbers: `bold` (700)

---

## Spacing system

Based on 4px grid:
- `1` = 4px (tight spacing)
- `2` = 8px (element gaps)
- `3` = 12px (input padding)
- `4` = 16px (card padding)
- `6` = 24px (section gaps)
- `8` = 32px (page margins)
- `12` = 48px (large section separation)

---

## Components

### Buttons

#### Primary button
- Background: `primary` (#4F39F6)
- Text: white, `medium` weight
- Padding: `10px 20px`
- Border radius: `8px`
- Hover: `primary-hover` (#3B2EE6)
- Disabled: 50% opacity

#### Secondary button
- Background: transparent
- Border: `1px solid` `border`
- Text: `text-secondary`
- Hover: background `surface-elevated`

#### Destructive button
- Background: `danger` (#BA1A1A)
- Text: white
- Always requires confirmation dialog

#### Icon button
- Square, `40px x 40px`
- Icon centered, `20px` size
- Ghost style (transparent) with hover background

### Inputs

#### Text input
- Background: `surface`
- Border: `1px solid` `border`
- Padding: `10px 12px`
- Border radius: `6px`
- Focus: border `primary`, ring `primary-muted`
- Error: border `danger`

#### Select
- Same styling as text input
- Chevron icon right-aligned
- Dropdown: `surface-elevated` background

#### Search input
- Leading search icon
- Same as text input

### Tables

#### Structure
- Header: `text-xs`, uppercase, `text-muted`, `medium` weight
- Rows: `text-sm`, `text-primary`
- Alternating rows: subtle `surface` vs `background`
- Row height: `48px` minimum
- Cell padding: `12px 16px`

#### States
- Hover row: background `surface-elevated`
- Selected row: left border `primary`
- Empty: centered message with icon

#### Pagination
- Bottom of table
- Page numbers with current highlighted
- Previous/next arrows

### Cards (Bento Grid)

#### Stat card
- Background: `surface`
- Border: `1px solid` `border`
- Padding: `20px`
- Icon: `40px` container with light pastel background
- Number: `text-4xl`, `bold`
- Label: `text-sm`, `text-muted`

#### Content card
- Background: `surface`
- Border: `1px solid` `border`
- Border radius: `12px`
- Padding: `20px`
- Title: `text-lg`, `bold`

### Modals

- Overlay: `rgba(0, 0, 0, 0.8)`
- Content: `surface-elevated` background
- Border radius: `16px`
- Max width: `480px` (small), `640px` (medium)
- Header with title and close button
- Footer with action buttons (primary right)

### Sidebar

- Width: `240px` (expanded), `64px` (collapsed)
- Background: `background`
- Items: `48px` height, icon + label
- Active: background `primary-muted`, left border `primary`
- Hover: background `surface`
- Icons: `20px`, Lucide icon set

### Mobile-specific

- Bottom tab navigation (not sidebar)
- Larger touch targets: minimum `44px`
- Safe area insets respected
- Pull-to-refresh on lists
- Skeleton loaders for initial load
- Font: SF Pro for all text

---

## States

### Empty state
- Centered in container
- Large icon (48px) in `text-muted`
- Title: `text-lg`, `bold`
- Description: `text-sm`, `text-secondary`
- CTA button if applicable

### Error state
- Red icon (`danger`)
- Clear error message
- Retry button if applicable
- Do not expose internal error details to user

### Loading state
- Skeleton loaders matching content shape
- Avoid spinners except for button loading
- Skeleton: `surface-elevated` with shimmer animation

---

## Responsive strategy

### Breakpoints
| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

### Desktop-first for web dashboard
- Sidebar collapses to icons at `lg`
- Bento Grid: 4 columns at `xl`, 2 columns at `md`
- Tables: horizontal scroll below `lg`

### Mobile
- Stack layout (not grid)
- Bottom tab navigation
- Full-width cards
- Key actions fixed at bottom
- Font: SF Pro system font

---

## Layout principles

### Page structure
1. Header with page title + actions
2. Toolbar: filters, search, bulk actions
3. Content area (table or cards)
4. Pagination (if table)

### Bento Grid pattern
- Cards in CSS grid with `gap: 16px`
- Stat cards: equal width columns
- Main content: wide column, side cards: narrow

---

## UX rules

- One clear primary CTA per screen
- Forms: short, predictable, inline validation
- Search and filters in toolbar, not hidden
- Error messages: actionable, user-friendly
- Toast notifications for success/error feedback
- Real-time updates: non-disruptive (do not scroll user)
- Tag EPCs displayed in monospace font (Liberation Mono)
- Confirmation for destructive actions
- Loading states for all async operations

---

## Accessibility baseline

- All interactive elements keyboard accessible
- Focus indicators visible
- Color contrast ratio: 4.5:1 minimum for text
- ARIA labels on icon-only buttons
- Form inputs with associated labels
- Error messages linked to inputs via `aria-describedby`

---

## Screen inventory (from Figma)

| # | Screen | Vietnamese | Type |
|---|--------|------------|------|
| 1 | Phiên quét | Scan sessions | Page |
| 2 | điều chuyển xưởng | Workshop transfers | Page |
| 3 | Đơn hàng/xuất | Orders/Export | Page |
| 4 | Tạo phiên mới | Create new slip | Page |
| 5 | Tồn kho | Inventory | Page |
| 6 | Vị trí | Locations | Page |
| 7 | form thêm địa điểm | Add location form | Modal |
| 8 | QL Sản phẩm | Product management | Page |
| 9 | Quản lý danh mục | Category management | Page |
| 10 | Kho thẻ | Tag warehouse | Page |
| 11 | Dashboard | Dashboard | Page |
| 12 | tài khoản nội bộ | Internal accounts | Page |
| 13 | phân quyền hệ thống | System permissions | Page |
| 14 | form thêm danh mục mới | Add category form | Modal |
| 15 | form thêm sp mới | Add product form | Modal |
| 16 | Body | Layout frame | Layout |