# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

### Backend API

**RFID Inventory REST API**
- Base URL: `http://localhost:3000/api` (configurable via `NEXT_PUBLIC_API_URL`)
- Authentication: JWT Bearer token
- Swagger docs: `http://localhost:3000/api/docs`

**API Endpoints:**
- `/auth/*` - Authentication (login, logout, refresh)
- `/users/*` - User management
- `/categories/*` - Category CRUD
- `/products/*` - Product CRUD
- `/tags/*` - RFID tag management
- `/orders/*` - Inbound/outbound orders
- `/sessions/*` - Scan session management
- `/inventory/*` - Check-in/check-out operations
- `/dashboard/*` - Statistics
- `/activity-logs/*` - Activity logging

### WebSocket/Real-time

**Socket.io Server (Backend)**
- Port: Same as HTTP (3000)
- CORS: Configurable via `CORS_ORIGINS`
- Rooms: `admin:dashboard`, `scan:live`

**Events:**
- `scanStream` - Mobile scan data streaming
- `scanDetected` - Emitted to web clients
- `inventoryUpdate` - Dashboard updates
- `tagsUpdated` - Tag data refresh
- `liveScan` - Real-time scan broadcast
- `sessionCreated` - New session notification

## Data Storage

### Database

**PostgreSQL 15 (Docker)**
- Provider: PostgreSQL
- Connection: `postgresql://postgres:password@localhost:5432/rfid_db`
- ORM: Prisma 7.5.0
- Adapter: @prisma/adapter-pg
- Docker image: `postgres:15-alpine`
- Port: 5432

**Prisma Schema Models:**
- `User` - System users with roles (ADMIN, WAREHOUSE_MANAGER)
- `RefreshToken` - JWT refresh tokens
- `Category` - Product categories
- `Product` - Products with SKU
- `Tag` - RFID tags with EPC codes
- `TagEvent` - Tag history/events
- `Order` - Inbound/outbound orders
- `OrderItem` - Order line items
- `Session` - Scan sessions
- `Scan` - Individual tag scans with RSSI
- `ActivityLog` - User activity audit log

### Mobile Local Storage

**AsyncStorage**
- Package: `@react-native-async-storage/async-storage`
- Usage: Token storage, local caching

**Zustand Store**
- Package: `zustand 5.0.11`
- Usage: Client-side state (auth, tags)

## Authentication & Identity

**Backend Auth Implementation:**
- JWT tokens (access + refresh)
- Passport.js for strategy handling
- bcrypt for password hashing

**Auth Flow:**
1. Login via `/auth/login` returns JWT
2. Access token stored in localStorage (web) or Zustand (mobile)
3. Refresh token stored in httpOnly-like flow
4. Token refresh via `/auth/refresh`

**Roles:**
- ADMIN - Full system access
- WAREHOUSE_MANAGER - Operational access only

**CASL Integration:**
- `@casl/ability` for role-based permissions
- Used in guards and interceptors

## Mobile Hardware Integration

### Bluetooth Low Energy (BLE)

**Primary Library:**
- `react-native-ble-plx 3.5.1`

**Secondary/Fallback:**
- `react-native-bluetooth-classic 1.73.0-rc.17`

**RFID Reader Communication:**
- Service UUID: Configurable via `BLE_CONFIG.SERVICE_UUID`
- Characteristic UUIDs: Configurable via `BLE_CONFIG.CHAR_NOTIFY_UUID`, `CHAR_WRITE_UUID`
- Protocols: CF (0xCF prefix) and BB (0xBB prefix)
- RSSI parsing for signal strength

**Required Permissions:**
- iOS: `NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription`
- Android: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`, `BLUETOOTH`, `BLUETOOTH_ADMIN`

## Environment Configuration

**Backend `.env` variables:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/rfid_db
JWT_SECRET=<64-char-random-string>
JWT_EXPIRATION=1d
CORS_ORIGINS=http://localhost:3001
PORT=3000
```

**Web environment variables:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Mobile API URL:**
- Default: `http://localhost:3000/api`
- Configurable via `SyncService.setApiUrl()`

## Monitoring & Observability

**Error Tracking:** Not detected (no Sentry, Bugsnag, or similar)

**Logging:**
- Backend: Console logging (console.log)
- Mobile: Console logging with tags like `[BLE]`, `[Sync]`

**Health Check:**
- Endpoint: `/health` (via `HealthController`)
- Status: Basic server health

## CI/CD & Deployment

**Docker:**
- `docker-compose.yml` for PostgreSQL
- Image: `postgres:15-alpine`
- Volume: `pgdata` for persistence

**Hosting:**
- Backend: Self-hosted (localhost)
- Web: Self-hosted (localhost:3001)
- Mobile: Expo (EAS build)

**Expo Configuration:**
- Project ID: `e3bb5ccd-92d0-4721-8cad-cf2da48ff3eb`
- Owner: `funny_12`
- iOS Bundle ID: `com.rfid.inventory`
- Android Package: `com.rfid.inventory`

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:**
- Mobile push to `/tags/live` endpoint for real-time scan capture
- Mobile push to `/sessions` for session storage
- WebSocket events for real-time dashboard updates

## Key Dependencies at Risk

**Maintenance Concerns:**
- `react-native-bluetooth-classic@1.73.0-rc.17` - Release candidate version
- `bcrypt@6.0.0` - Native module requiring rebuild
- `jest@30.0.0` - Very new major version
- `eslint@9.18.0` - Flat config format changes

---

*Integration audit: 2026-03-26*
