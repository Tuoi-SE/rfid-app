# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- Backend (NestJS): `kebab-case.ts` for all files - `tags.service.ts`, `auth.controller.ts`, `http-exception.filter.ts`
- Frontend (Next.js/React): `PascalCase.tsx` for components - `Sidebar.tsx`, `EditTagModal.tsx`
- Frontend utilities: `camelCase.ts` - `api.ts`, `bleStore.ts`
- Mobile (React Native): `camelCase.ts` for services/stores - `BLEService.ts`, `authStore.ts`

**Functions/Methods:**
- NestJS Services: `camelCase`, descriptive Vietnamese comments - `async findAll(query)`, `async create(dto, userId?)`
- React Components: `PascalCase` for components, `camelCase` for hooks - `export function TagsPage()`, `useQuery()`, `useAuth()`
- Event handlers: `handleXxx` pattern in React - `onClick={() => handleEdit(row.original.epc)}`

**Variables:**
- `camelCase` for local variables and function parameters
- `SCREAMING_SNAKE_CASE` for constants - `SALT_ROUNDS`, `USER_SELECT`
- Descriptive names in Vietnamese for user-facing strings

**Types/Interfaces:**
- TypeScript interfaces: `PascalCase` - `interface TagData`, `interface AuthContextType`
- DTOs: `PascalCase` with `Dto` suffix - `CreateTagDto`, `UpdateTagDto`, `QueryTagsDto`

## Code Style

**Formatting:**
- Tool: Prettier with single quotes and trailing commas
- Config at `backend/.prettierrc`:
  ```json
  { "singleQuote": true, "trailingComma": "all" }
  ```
- Format command: `npm run format`

**Linting:**
- Backend: ESLint flat config with TypeScript ESLint
- Config at `backend/eslint.config.mjs`
- Key rules:
  - `@typescript-eslint/no-explicit-any`: 'off'
  - `@typescript-eslint/no-floating-promises`: 'warn'
  - `@typescript-eslint/no-unsafe-argument`: 'warn'
  - `prettier/prettier`: 'error' with `endOfLine: "auto"`

**TypeScript Configuration:**
- Backend (`backend/tsconfig.json`):
  - `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
  - `experimentalDecorators: true`, `emitDecoratorMetadata: true`
  - Target: ES2023
- Web (`web/tsconfig.json`):
  - `strict: true`
  - Path alias: `@/*` maps to `./src/*`
  - JSX: `react-jsx`

## Import Organization

**Order (Backend NestJS):**
1. External packages - `@nestjs/common`, `@nestjs/config`
2. Third-party - `bcrypt`, `passport`
3. Internal modules - `../prisma/prisma.service`, `./dto/create-tag.dto`
4. Relative paths - `.prisma/client`

**Example from `backend/src/tags/tags.controller.ts`:**
```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '.prisma/client';
```

**Frontend (Next.js):**
- Absolute imports via `@/` path alias for src files
- Relative imports for sibling files

**Example from `web/src/components/Sidebar.tsx`:**
```typescript
import { Tag, Search, Radio } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
```

## Error Handling

**Backend NestJS:**
- Uses built-in NestJS exceptions: `NotFoundException`, `ConflictException`, `BadRequestException`, `UnauthorizedException`
- Custom global exception filter at `backend/src/common/filters/http-exception.filter.ts`
- Vietnamese error messages for user feedback

**Error Pattern in Services:**
```typescript
// From backend/src/tags/tags.service.ts
if (!tag) throw new NotFoundException(`Không tìm thấy tag với EPC "${epc}"`);
if (existing) throw new ConflictException(`Tag với EPC "${dto.epc}" đã tồn tại`);
```

**Global Exception Filter:**
- Returns JSON with `statusCode`, `message`, `timestamp`
- Logs unhandled errors with stack trace
- Vietnamese default message: `'Lỗi hệ thống nội bộ'`

**Frontend API Client:**
```typescript
// From web/src/lib/api.ts
if (response.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
  throw new Error('Unauthorized');
}
if (!response.ok) {
  const err = await response.json().catch(() => ({}));
  throw new Error(err.message || `API Error: ${response.statusText}`);
}
```

## Logging

**Backend:**
- NestJS Logger via `new Logger('ExceptionFilter')`
- Console.log for startup messages in `main.ts`
- Examples: `console.log('[BLE] Starting scan...')`

**Mobile:**
- `console.log` with prefixes like `[BLE]`, `[BLE-RAW]`
- Example from `mobile/src/services/BLEService.ts`: `console.log('[BLE] ✅ Connected!')`

**Frontend Web:**
- No explicit logging; relies on React Query error states

## Comments

**Vietnamese Comments:**
- Inline comments in Vietnamese explaining business logic
- Example: `// Tạo sự kiện nếu có đổi thông tin quan trọng`

**Code TODOs:**
- No TODO/FIXME comments found in source code

**Documentation:**
- Swagger decorators for API documentation
- Example from `backend/src/main.ts`:
  ```typescript
  .addTag('Tags', 'RFID tag management')
  ```

## Function Design

**Size:**
- Services contain multiple methods (10-20 methods typical)
- Controllers delegate to services, minimal logic

**Parameters:**
- DTOs for data transfer objects
- Optional `userId?: string` for user context
- Query DTOs for pagination/filtering

**Return Values:**
- Services return Prisma results or formatted objects
- Controllers return service results directly
- Pagination pattern: `{ data, total, page, limit, totalPages }`

## Module Design

**Backend Structure (NestJS):**
```
src/
  prisma/          # Database service
  auth/            # Authentication module
  users/           # User management
  tags/            # RFID tag management
  categories/      # Category management
  products/        # Product management
  sessions/        # Scan session management
  inventory/       # Inventory operations
  orders/          # Order management
  events/          # WebSocket events
  dashboard/       # Dashboard stats
  activity-log/    # Activity logging
  casl/            # Authorization
  common/          # Shared (filters, interceptors)
```

**Frontend Structure (Next.js App Router):**
```
web/src/
  app/             # Pages (folder-based routing)
  components/      # Reusable UI components
  providers/       # Context providers
  lib/             # API client, utilities
```

**Mobile Structure (React Native + Expo):**
```
mobile/src/
  screens/         # Screen components
  services/        # BLE, Sync services
  store/           # Zustand stores
  constants/       # Configuration
```

**Exports:**
- Backend: Named exports for modules
- Frontend: Named function exports for components
- Mobile: Default exports for services (`export default new BLEService()`)

---

*Convention analysis: 2026-03-26*
