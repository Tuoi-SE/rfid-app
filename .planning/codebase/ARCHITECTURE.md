# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Modular Monolith with Real-time Events

This is a **NestJS backend** combined with a **Next.js web frontend** and **React Native mobile app**. The system manages RFID tag inventory with real-time scanning capabilities.

**Key Characteristics:**
- NestJS module-based architecture with clear domain separation
- Prisma ORM for PostgreSQL database access
- Socket.IO WebSocket gateway for real-time scan updates
- JWT-based authentication with refresh token rotation
- CASL-based authorization (role permissions)
- React Query for web data fetching and caching
- Zustand for mobile state management
- REST API with Swagger documentation at `/api/docs`

## Layers

**API/REST Layer:**
- Purpose: Handle HTTP requests and responses
- Location: `backend/src/{module}/{module}.controller.ts`
- Contains: Route handlers decorated with `@Controller`, `@Get`, `@Post`, `@Patch`, `@Delete`
- Depends on: Services, DTOs
- Used by: Web frontend, Mobile app, External clients

**Business Logic Layer:**
- Purpose: Core application logic and data manipulation
- Location: `backend/src/{module}/{module}.service.ts`
- Contains: Service classes with `@Injectable()`, business rules, database queries via Prisma
- Depends on: PrismaService
- Used by: Controllers

**Data Access Layer:**
- Purpose: Database operations and transactions
- Location: `backend/src/prisma/prisma.service.ts`
- Contains: Prisma client wrapper providing database access
- Depends on: Prisma client (generated from schema)
- Used by: All services

**Real-time Events Layer:**
- Purpose: WebSocket communication for live scan updates
- Location: `backend/src/events/events.gateway.ts`
- Contains: Socket.IO gateway handling scan streams and broadcasting updates
- Depends on: JWT service, PrismaService
- Used by: Mobile app (during scanning), Web dashboard (live updates)

**Authentication/Authorization Layer:**
- Purpose: Identity verification and access control
- Location: `backend/src/auth/`
- Contains: JWT strategy, Local strategy, CASL module, Role guards
- Depends on: UsersModule, JwtModule, PassportModule
- Used by: All guarded routes

**Frontend UI Layer:**
- Purpose: User interface and data presentation
- Location: `web/src/app/` (Next.js App Router pages), `web/src/components/` (reusable components)
- Contains: React Server Components, client components with 'use client'
- Depends on: API client (`web/src/lib/api.ts`), AuthProvider
- Used by: Browser

**Mobile State Layer:**
- Purpose: Local state management with offline support
- Location: `mobile/src/store/` (Zustand stores), `mobile/src/services/` (BLE/Sync services)
- Contains: State stores for inventory, auth, BLE operations
- Depends on: React Native, Zustand
- Used by: Mobile app screens

## Data Flow

**Tag Scanning Flow:**
1. Mobile app connects to RFID reader via BLE (`mobile/src/services/BLEService.ts`)
2. Scanned EPCs are sent to backend via REST (`/api/tags/live`) or WebSocket (`scanStream` event)
3. Backend `EventsGateway` processes scans, auto-creates unknown tags
4. Backend emits `scanDetected` event to `scan:live` room
5. Web dashboard receives real-time updates via Socket.IO client
6. Tags are enriched with product data and displayed

**Authentication Flow:**
1. User submits credentials to `/api/auth/login`
2. `AuthService` validates via `LocalStrategy`
3. Returns JWT access token (15min) and refresh token
4. Client stores tokens in localStorage (web) or Zustand (mobile)
5. Subsequent requests include `Authorization: Bearer {token}`
6. `JwtAuthGuard` validates token on protected routes
7. Refresh token used to obtain new access token before expiry

**Tag Assignment Flow:**
1. Admin selects tags and product in web UI
2. POST to `/api/tags/assign` with tagIds and productId
3. `TagsService.assignTags()` runs in transaction:
   - Updates all tags with productId
   - Creates TagEvent records for each assignment
4. Emits `tagsUpdated` event via `EventsGateway`
5. Connected clients receive update and refresh tag list

## Key Abstractions

**NestJS Module:**
- Purpose: Code organization and dependency injection boundaries
- Examples: `backend/src/tags/tags.module.ts`, `backend/src/auth/auth.module.ts`
- Pattern: Each module has controller, service, and owns its DTOs. Imported in `AppModule`.

**DTO (Data Transfer Object):**
- Purpose: Validate and transform incoming request data
- Examples: `backend/src/tags/dto/create-tag.dto.ts`, `backend/src/tags/dto/query-tags.dto.ts`
- Pattern: Class with validation decorators from `class-validator`

**Prisma Service:**
- Purpose: Single instance of Prisma client for all database operations
- Location: `backend/src/prisma/prisma.service.ts`
- Pattern: Injectable singleton, wraps `new PrismaClient()`

**API Client (Frontend):**
- Purpose: Unified HTTP client with auth and error handling
- Location: `web/src/lib/api.ts`
- Pattern: `apiClient()` function that adds Bearer token, handles 401 redirect, returns parsed JSON

**Zustand Store (Mobile):**
- Purpose: Lightweight state management with persistence
- Examples: `mobile/src/store/inventoryStore.ts`, `mobile/src/store/authStore.ts`
- Pattern: Create store with selectors, use `persist` middleware for offline storage

## Entry Points

**Backend Server:**
- Location: `backend/src/main.ts`
- Triggers: `npm run start:dev` or `npm run start:prod`
- Responsibilities: Bootstrap NestJS app, configure CORS, validation pipes, exception filter, Swagger docs, shutdown hooks

**Web Frontend:**
- Location: `web/src/app/layout.tsx`
- Triggers: Browser navigation to Next.js app
- Responsibilities: Root layout with providers (QueryProvider, AuthProvider), AppShell with sidebar

**Mobile App:**
- Location: `mobile/App.tsx`
- Triggers: App launch on device/emulator
- Responsibilities: Navigation setup with bottom tabs, auth gate, BLE initialization

**WebSocket Gateway:**
- Location: `backend/src/events/events.gateway.ts`
- Triggers: Mobile scan stream connection
- Responsibilities: JWT auth on connect, room management, scan processing, real-time broadcasts

## Error Handling

**Strategy:** Global exception filter with structured JSON responses

**Patterns:**
- `backend/src/common/filters/http-exception.filter.ts` catches all exceptions
- HTTP exceptions return status code and message
- Unknown exceptions return 500 with generic message, log stack trace
- Response format: `{ statusCode, message, timestamp }`

**Service-level errors:**
- `NotFoundException` for missing resources
- `ConflictException` for duplicate entries
- `BadRequestException` for validation failures
- All use Vietnamese messages for UI display

## Cross-Cutting Concerns

**Logging:** NestJS Logger via `Logger.log()`, `Logger.error()` in services

**Validation:** `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`

**Authentication:** JWT Bearer tokens via `@nestjs/jwt` + Passport

**Authorization:** CASL for permissions, `@Roles()` decorator + `RolesGuard` for route protection

**Rate Limiting:** `@nestjs/throttler` configured globally (100 requests/minute)

**Activity Logging:** `ActivityLogInterceptor` logs all HTTP requests with user, action, entity, IP

---

*Architecture analysis: 2026-03-26*
