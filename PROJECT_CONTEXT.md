# Project Context

## Product summary
RFID Inventory Management System — a full-stack application for tracking inventory using RFID tags.
Includes a backend API, a web admin dashboard, and a mobile scanner app for iPhone.

Target domain: Warehouse and workshop inventory tracking with BLE RFID handheld scanners.

## Primary users
- SUPER_ADMIN: full system control, user management, session deletion, order creation
- ADMIN: manage inventory, products, locations, categories, tags
- WAREHOUSE_MANAGER: location-based access control (LBAC) for transfers
- STAFF: perform RFID scans, view inventory, handle transfers

## Main goals
- Scan RFID tags via BLE-connected handheld readers on mobile
- Track inventory across multiple locations with transfer support
- Manage products, categories, tags, and locations
- Provide real-time dashboard with activity logs
- Role-based access control (RBAC) with CASL

---

## Tech stack

### Backend (`backend/`)
- NestJS 11 + TypeScript
- Prisma 7 ORM with PostgreSQL (Supabase)
- JWT authentication (passport-jwt)
- CASL authorization for RBAC
- Socket.IO for real-time events
- Redis caching (ioredis)
- Pino logger
- Swagger API docs at `/api/docs`

### Web Dashboard (`web/`)
- Next.js 16 + TypeScript
- React 19 + TailwindCSS v4
- TanStack React Query + React Table
- Lucide icons
- Socket.IO client for real-time updates
- Bento Grid design system (dark theme)

### Mobile Scanner (`mobile/`)
- Expo 55 + React Native 0.83
- React Navigation (bottom tabs)
- react-native-ble-plx for BLE/RFID
- Zustand state management
- AsyncStorage for local data persistence

---

## Directory structure

### Backend (`backend/src/`)
```
auth/           — JWT auth, refresh tokens, login/register
users/          — user CRUD, soft-delete, role management
products/       — product management
categories/     — category management
locations/      — location/warehouse management
tags/           — RFID tag management, EPC tracking
inventory/      — inventory tracking, stock levels
sessions/       — inventory sessions (scanning sessions)
transfers/      — transfer operations between locations
orders/         — order management (mobile quick-submit)
activity-logs/  — audit logging
```

### Web (`web/src/`)
```
app/(dashboard)/           — Next.js app router pages
  inventory/
  products/
  categories/
  locations/
  tags/
  sessions/
  transfers/
  orders/
  users/
  activity-logs/
  permissions/
features/                  — feature modules by domain
  [feature]/
    api/                   — React Query hooks
    components/            — feature-specific components
    types/                 — TypeScript types
components/                — shared UI (ui/, forms/, tables/, modals/)
lib/                       — utilities, API client
hooks/                     — shared hooks
```

### Mobile (`mobile/src/`)
```
features/
  auth/          — login, session management
  inventory/     — inventory viewing
  reader/        — BLE RFID scanner
  transactions/  — scan sessions
  transfers/     — transfer operations
app/             — navigation and screens
shared/          — utilities, constants
```

---

## Commands

### Backend
```bash
cd backend
npm run start:dev       # Development server
npm run build           # Production build
npm test                # Run tests
npm run lint            # Lint code
npx prisma migrate dev  # Run migrations
npm run seed            # Seed database
```

### Web
```bash
cd web
npm run dev             # Dev server (port 3001)
npm run build           # Production build
npm run lint            # Lint code
```

### Mobile
```bash
cd mobile
npm start               # Expo dev server
npm run ios             # iOS simulator
eas build               # EAS build for production
```

---

## Auth flow

### Token structure
- **Access Token**: JWT, expires in 15 minutes (configurable via `JWT_ACCESS_EXPIRATION`)
- **Refresh Token**: JWT, expires in 7 days (configurable via `JWT_REFRESH_EXPIRATION`)
- Refresh tokens are stored in DB with SHA-256 hash comparison
- Per-device session limiting: same `userId` + `deviceType` on login revokes previous tokens

### Dynamic authorization
- Every protected request re-validates user role from database
- CASL gates enforce permissions based on current role

### No OAuth/SSO
- Pure local username/password authentication
- Passwords hashed with bcrypt

### Swagger documentation
- Available at `http://localhost:3000/api/docs` (or `/api/docs` in production)
- Bearer JWT authentication

---

## API conventions

### Naming patterns
- Plural nouns for resources: `/api/users`, `/api/orders`, `/api/tags`
- No version prefix in URLs
- Sub-resource actions: `POST /api/orders/mobile-quick-submit`, `GET /api/tags/:epc/history`

### Request/response
- RESTful JSON APIs
- Swagger auto-generated from decorators
- Error responses use NestJS HTTP exceptions

### Notable endpoints
- `POST /api/auth/refresh` — refresh access token
- `POST /api/auth/logout` — revoke refresh token
- `POST /api/orders/mobile-quick-submit` — mobile scan-to-submit
- `GET /api/tags/:epc/history` — tag tracking history

---

## Real-time (Socket.IO)

### Server → Client events
- `tagsUpdated` — tag inventory changes
- `liveScan` — real-time scan from mobile (scan:live room)
- `scanDetected` — new tag detected
- `inventoryUpdate` — inventory level change
- `sessionCreated` — new scanning session
- `orderUpdate` — order status change
- `transferUpdate` — transfer status change

### Client → Server events
- `scanStream` — continuous scan data
- `batchScan` — batch scan submission

### Rooms
- `scan:live` — all authenticated users (real-time scan feed)
- `admin:dashboard` — ADMIN only (dashboard metrics)

### Mobile
- Mobile app uses REST only, no Socket.IO connection

---

## Business rules

### Role permissions matrix

| Action                          | SUPER_ADMIN | ADMIN | WAREHOUSE_MANAGER | STAFF |
|--------------------------------|-------------|-------|-------------------|-------|
| User management                | Full        | Read  | None              | None  |
| Session deletion               | Yes         | No    | No                | No    |
| Order creation                 | Yes         | No    | No                | No    |
| Reassign already-assigned tags | Yes         | No    | No                | No    |
| Transfer (own location)         | All         | All   | LBAC only         | View  |
| Inventory CRUD                 | Full        | Full  | Read              | Read  |
| Tag history                    | Full        | Full  | Own location      | Own   |

### Transfer types
- `ADMIN_TO_WORKSHOP` — admin sends to workshop
- `WORKSHOP_TO_WAREHOUSE` — workshop returns to warehouse
- `WAREHOUSE_TO_CUSTOMER` — warehouse ships to customer

### LBAC (Location-Based Access Control)
- WAREHOUSE_MANAGER can only manage transfers within their assigned location
- Transfers cross-location require ADMIN or SUPER_ADMIN

### Tag status flow
1. `IN_WORKSHOP` — tag in workshop (cannot do outbound)
2. `IN_WAREHOUSE` — tag in warehouse (can do outbound)
3. Tags must be `IN_WAREHOUSE` before outbound transfer

### Order rules
- Order items quantity must be >= 1
- Order creation restricted to SUPER_ADMIN only

### Soft-delete
- Users use soft-delete pattern (`deletedAt` field)
- Deleted users cannot log in but data is preserved

---

## Mobile BLE RFID

### Hardware
- UHF RFID reader device (keywords: UHF, RFID, ST-H103, H103)
- Hardcoded MAC address: `E0:4E:7A:F3:78:56`

### BLE UUIDs
- Service: `0000FFE0-0000-1000-8000-00805F9B34FB`
- Write characteristic: `0000FFE3-0000-1000-8000-00805F9B34FB`
- Notify characteristic: `0000FFE4-0000-1000-8000-00805F9B34FB`

### Protocols
- `CF` packet format (0xCF prefix)
- `BB` packet format (0xBB prefix)

### Scan workflow
1. Connect to BLE device by MAC address
2. Enable notifications on notify characteristic
3. Write scan commands to write characteristic
4. Receive tag data via notifications
5. Batch scans every 300ms interval
6. Submit via `POST /sessions` or `POST /orders/mobile-quick-submit`

### Offline behavior
- AsyncStorage persists scanned data locally
- HTTP client throws NetworkError on connection failure
- No offline queue — scans must be submitted when online

---

## Sensitive areas

### Do not modify without explicit approval
1. **Auth flow** — JWT structure, refresh token rotation, per-device session limiting
2. **RBAC/CASL rules** — role permissions are business-critical
3. **Prisma schema** — migrations required, data integrity risk
4. **Socket.IO rooms** — `admin:dashboard` room security
5. **Transfer protection rules** — transferred inventory has special protection

### Do not rename
- Public API routes
- Public service methods that are used across modules
- CASL ability definitions

---

## Design source
Figma: **RIOTEX-UI** (9Gix0X6vqHGmiLjFykY3ea)
All UI work must match Figma. When Figma and DESIGN.md differ, Figma wins.

---

## Deployment

- Backend: Render
- Web: Vercel
- Database: Supabase (PostgreSQL)
- Mobile: EAS Build (Expo)

---

## Current pain points
- Add real current issues here as they arise

---

## What good looks like
- Stable CRUD flow across all modules
- Real-time inventory updates via WebSocket
- Consistent Bento Grid UI across dashboard
- Clean execution reports after changes
- Mobile scanner connects reliably to BLE readers
