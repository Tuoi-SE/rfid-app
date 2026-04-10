# Figma Design Context

## Source
**File**: RIOTEX-UI
**File ID**: 9Gix0X6vqHGmiLjFykY3ea
**Token**: figd_pj4id01itgT6HdQJuHrhwlXpG6k20YYjcRaBwaeY

---

## Screens (16 top-level frames in Page 1)

| # | Screen name | Vietnamese | Notes |
|---|-------------|------------|-------|
| 1 | Phiên quét | Scan sessions | |
| 2 | điều chuyển xưởng | Workshop transfers | |
| 3 | Đơn hàng/xuất | Orders/Export | |
| 4 | Tạo phiên mới | Create new slip | |
| 5 | Tồn kho | Inventory | |
| 6 | Vị trí | Locations | |
| 7 | form thêm địa điểm | Add location form | Modal/form |
| 8 | QL Sản phẩm | Product management | |
| 9 | Quản lý danh mục | Category management | |
| 10 | Kho thẻ | Tag warehouse | |
| 11 | Dashboard | Dashboard | |
| 12 | tài khoản nội bộ | Internal accounts | |
| 13 | phân quyền hệ thống | System permissions | |
| 14 | form thêm danh mục mới | Add category form | Modal/form |
| 15 | form thêm sp mới | Add product form | Modal/form |
| 16 | Body | Layout frame | Base layout |

---

## Typography

| Font | Usage | Sizes |
|------|-------|-------|
| SF Pro | iOS system font - main body text | 9-36px |
| Inter | Secondary font - web | 9.5-24px |
| Manrope | Headings | 20-36px, weights 700/800 |
| Liberation Mono | Monospace for codes (EPCs, IDs) | 14px bold |

---

## Color Palette

### Dark Backgrounds (luminosity < 0.08)
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#000000` | Pure black |
| `background-alt` | `#000647` | Very dark navy |

### Card/Surface Backgrounds (0.08 < luminosity < 0.2)
| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `#0B1C30` | Dark navy blue |
| `surface-elevated` | `#0E162B` | Slightly lighter navy |
| `surface-overlay` | `#1C283C` | Card backgrounds |

### Light Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `light-bg` | `#E1E8F0FF` | Cool gray white |
| `light-surface` | `#F0F4F9FF` | Light surface |

### Pastel Stat Card Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `stat-blue` | `#DCE9FFFF` | |
| `stat-blue-alt` | `#DBEAFEFF` | |
| `stat-green` | `#DCFCE7FF` | |
| `stat-red` | `#FEE2E2FF` | |
| `stat-amber` | `#FEF3C7FF` | |

### Accent Colors

#### PRIMARY ACCENT (NOT blue — indigo/purple)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#4F39F6` | Main brand color |
| `primary-hover` | (derive from primary) | Darker variant |
| `primary-muted` | `rgba(79, 57, 246, 0.15)` | Backgrounds |

#### Secondary Blues
| Token | Hex |
|-------|-----|
| | `#155CFB` |
| | `#1D4ED8` |
| | `#2454FFFF` |
| | `#0049D5FF` |

#### Purple Variants
| Token | Hex |
|-------|-----|
| `purple` | `#9747FFFF` |
| `purple-light` | `#7985E8FF` |
| `purple-lighter` | `#7C86FFFF` |

#### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#00BC7CFF` | Green success |
| `success-alt` | `#22C55EFF` | Alt green |
| `warning` | `#F97316FF` | Orange warning |
| `warning-alt` | `#E17100FF` | Darker orange |
| `danger` | `#BA1A1AFF` | Red error |
| `danger-alt` | `#FA2B36FF` | Alt red |
| `danger-bright` | `#E7000AFF` | Bright red |

---

## Key Differences from Current Implementation

| Aspect | Current (DESIGN.md) | Figma (Actual) |
|--------|---------------------|----------------|
| Primary accent | `#3b82f6` (blue) | `#4F39F6` (indigo/purple) |
| Background | `#0a0a0a` (near black) | `#000000` (pure black) |
| Surface | `#1a1a2e` | `#0B1C30` (navy) |
| Surface elevated | `#252542` | `#0E162B` (navy) |
| Headings font | Inter | Manrope (700/800) |
| Body font | Inter | SF Pro (iOS) + Inter (web) |
| Monospace | JetBrains Mono | Liberation Mono |

---

## Layout Frame (Body)

The "Body" frame (#16) is the base layout structure used across all screens. This defines:
- Sidebar width and behavior
- Main content area
- Header structure
- Spacing rhythm

---

## Implementation Priority

1. **CRITICAL**: Update primary color from `#3b82f6` to `#4F39F6` across all components
2. **HIGH**: Update surface/background colors to navy palette
3. **HIGH**: Update heading typography to use Manrope
4. **MEDIUM**: Update monospace font to Liberation Mono
5. **LOW**: Update body fonts (SF Pro for mobile, Inter for web)

---

## Notes

- Figma uses a richer, more colorful palette than the current muted implementation
- Purple accent (`#9747FF`) is used heavily in the design — this should be the secondary accent
- The navy palette gives a more professional/enterprise feel than the previous dark gray
- Stat cards use pastel tints with white text on dark backgrounds