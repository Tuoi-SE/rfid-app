# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
RFIDInventory/
├── backend/                    # NestJS API server
│   ├── prisma/                 # Database schema and migrations
│   │   ├── schema.prisma       # Database models
│   │   ├── migrations/         # Prisma migrations
│   │   └── seed.ts             # Database seeder
│   ├── src/                    # Source code
│   │   ├── main.ts             # Entry point
│   │   ├── app.module.ts       # Root module
│   │   ├── auth/               # Authentication module
│   │   ├── users/              # User management
│   │   ├── tags/               # RFID tag management
│   │   ├── products/           # Product catalog
│   │   ├── categories/        # Product categories
│   │   ├── sessions/           # Scan sessions
│   │   ├── inventory/          # Check-in/check-out operations
│   │   ├── orders/            # Inbound/outbound orders
│   │   ├── dashboard/          # Dashboard statistics
│   │   ├── activity-log/       # System activity logging
│   │   ├── events/             # WebSocket gateway
│   │   ├── casl/               # Authorization
│   │   ├── health/             # Health check endpoint
│   │   ├── prisma/             # Prisma service
│   │   └── common/             # Shared filters, decorators
│   ├── test/                   # Test files
│   ├── dist/                   # Compiled output
│   └── node_modules/
├── web/                        # Next.js web dashboard
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── login/          # Login page
│   │   │   ├── tags/           # Tag management pages
│   │   │   ├── products/       # Product pages
│   │   │   ├── categories/     # Category pages
│   │   │   ├── inventory/      # Inventory pages
│   │   │   ├── sessions/       # Session pages
│   │   │   ├── orders/         # Order pages
│   │   │   ├── users/          # User management pages
│   │   │   └── activity-logs/  # Activity log pages
│   │   ├── components/         # React components
│   │   ├── providers/          # Context providers
│   │   └── lib/                # Utilities (API client)
│   ├── public/                # Static assets
│   └── node_modules/
├── mobile/                     # React Native mobile app
│   ├── src/
│   │   ├── screens/           # Screen components
│   │   ├── services/          # BLE, Sync services
│   │   ├── store/             # Zustand stores
│   │   └── constants/         # App constants
│   └── node_modules/
└── template/                  # Project template (if any)
```

## Directory Purposes

**Backend Module Directories:**
Each module follows the same pattern:

- `backend/src/{module}/` - Module directory
  - `{module}.module.ts` - NestJS module definition
  - `{module}.controller.ts` - HTTP route handlers
  - `{module}.service.ts` - Business logic
  - `dto/` - Data Transfer Objects for validation

**Key Modules:**

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `auth/` | JWT login/logout, refresh tokens | `auth.service.ts`, `auth.controller.ts`, `strategies/` |
| `users/` | User CRUD, admin management | `users.service.ts`, `users.controller.ts` |
| `tags/` | RFID tag management, assignment | `tags.service.ts`, `tags.controller.ts`, `dto/` |
| `products/` | Product catalog management | `products.service.ts`, `products.controller.ts`, `dto/` |
| `categories/` | Product categories | `categories.service.ts`, `categories.controller.ts` |
| `inventory/` | Check-in/check-out operations | `inventory.service.ts`, `inventory.controller.ts` |
| `sessions/` | Scan session tracking | `sessions.service.ts`, `sessions.controller.ts` |
| `orders/` | Inbound/outbound orders | `orders.service.ts`, `orders.controller.ts` |
| `events/` | WebSocket gateway | `events.gateway.ts` |
| `activity-log/` | HTTP request logging | `activity-log.service.ts`, `activity-log.interceptor.ts` |
| `dashboard/` | Summary statistics | `dashboard.service.ts`, `dashboard.controller.ts` |
| `casl/` | Role-based permissions | `casl.module.ts` |

## Key File Locations

**Entry Points:**
- `backend/src/main.ts` - NestJS application bootstrap
- `web/src/app/layout.tsx` - Next.js root layout
- `mobile/App.tsx` - React Native app entry

**Configuration:**
- `backend/prisma/schema.prisma` - Database schema
- `backend/package.json` - Backend dependencies and scripts
- `web/package.json` - Web dependencies and scripts
- `mobile/package.json` - Mobile dependencies and scripts

**API Client (Web):**
- `web/src/lib/api.ts` - Centralized API client with auth handling

**State Management (Mobile):**
- `mobile/src/store/authStore.ts` - Auth state
- `mobile/src/store/inventoryStore.ts` - Inventory state with offline persistence
- `mobile/src/store/bleStore.ts` - BLE connection state

**Services (Mobile):**
- `mobile/src/services/BLEService.ts` - Bluetooth Low Energy communication
- `mobile/src/services/SyncService.ts` - Backend synchronization
- `mobile/src/services/RFIDParser.ts` - EPC data parsing

**Database Service:**
- `backend/src/prisma/prisma.service.ts` - Prisma client singleton

**WebSocket Gateway:**
- `backend/src/events/events.gateway.ts` - Socket.IO gateway

## Naming Conventions

**Files:**
- NestJS modules: `{name}.module.ts` (e.g., `tags.module.ts`)
- NestJS controllers: `{name}.controller.ts` (e.g., `tags.controller.ts`)
- NestJS services: `{name}.service.ts` (e.g., `tags.service.ts`)
- DTOs: `{action}-{name}.dto.ts` (e.g., `create-tag.dto.ts`, `query-tags.dto.ts`)
- Next.js pages: `page.tsx` (App Router)
- React Native screens: `{Name}Screen.tsx` (e.g., `QuetTheScreen.tsx`)
- React components: `{PascalName}.tsx` (e.g., `Sidebar.tsx`, `AppShell.tsx`)
- Zustand stores: `{name}Store.ts` (e.g., `authStore.ts`)

**Directories:**
- Modules: `lowercase-with-hyphens` (e.g., `activity-log`)
- Screens: `camelCase` (e.g., `screens/QuetTheScreen.tsx`)
- Components: `PascalCase` or `camelCase` depending on preference

**TypeScript:**
- Interfaces: `PascalCase` (e.g., `AuthContextType`)
- Types: `PascalCase` (e.g., `ScanPayload`)
- Enums: `PascalCase` with UPPER_SNAKE values (e.g., `Role.ADMIN`)

**Database (Prisma):**
- Models: `PascalCase` singular (e.g., `Tag`, `Product`)
- Fields: `camelCase` (e.g., `createdAt`, `productId`)
- Enum values: `UPPER_SNAKE` (e.g., `IN_STOCK`, `OUT_OF_STOCK`)

## Where to Add New Code

**New Backend Feature:**
1. Create module directory: `backend/src/{feature}/`
2. Add files: `{feature}.module.ts`, `{feature}.controller.ts`, `{feature}.service.ts`
3. Create DTOs in `dto/` subdirectory
4. Register module in `backend/src/app.module.ts`
5. Add routes in controller with appropriate guards

**New Backend API Endpoint:**
1. Add method to existing service in `backend/src/{module}/{module}.service.ts`
2. Add route handler to controller in `backend/src/{module}/{module}.controller.ts`
3. Create or extend DTO in `backend/src/{module}/dto/` if needed

**New Web Page:**
1. Create directory in `web/src/app/{page}/`
2. Add `page.tsx` file with React component
3. Add any needed client components alongside

**New Web Component:**
1. Add to `web/src/components/`
2. Use `'use client'` directive if uses hooks or browser APIs
3. Import and use in page files

**New Mobile Screen:**
1. Add to `mobile/src/screens/{Name}Screen.tsx`
2. Register in `mobile/App.tsx` tab navigator
3. Add navigation routes if using stack navigator

**New Mobile Store:**
1. Create `mobile/src/store/{name}Store.ts`
2. Use Zustand with `persist` middleware for offline data
3. Import in screens that need state

**New Mobile Service:**
1. Create `mobile/src/services/{Name}Service.ts`
2. Implement as class or functional service
3. Use from appropriate screens or stores

## Special Directories

**`backend/prisma/migrations/`:**
- Purpose: Database schema migrations
- Generated: Yes (by Prisma CLI)
- Committed: Yes (part of version control)

**`backend/dist/`:**
- Purpose: Compiled JavaScript output
- Generated: Yes (by `tsc`)
- Committed: No (typically in `.gitignore`)

**`web/.next/`:**
- Purpose: Next.js build cache and output
- Generated: Yes (by Next.js build)
- Committed: No (typically in `.gitignore`)

**`mobile/src/store/`:**
- Purpose: Zustand state stores with offline persistence
- Uses `persist` middleware for localStorage backup
- Contains: `authStore.ts`, `inventoryStore.ts`, `bleStore.ts`

**`backend/src/common/`:**
- Purpose: Shared utilities used across modules
- Contains: `filters/http-exception.filter.ts`
- Pattern: Not a module, just shared code

---

*Structure analysis: 2026-03-26*
