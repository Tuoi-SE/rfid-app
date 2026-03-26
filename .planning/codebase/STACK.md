# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.7.3 - All three projects (backend, web, mobile)

**Secondary:**
- JavaScript - Mobile node_modules dependencies

## Runtime

**Backend:**
- Node.js 22.x (implied by @types/node@22)
- Platform: Darwin (macOS) / Linux

**Web:**
- Next.js 16.1.6 (React 19.2.3)
- Server-side rendering enabled

**Mobile:**
- React Native 0.83.2
- Expo SDK 55
- Platform: iOS/Android

## Package Managers

**Backend:** npm 10.x (package-lock.json present)
**Web:** npm 10.x (package-lock.json present)
**Mobile:** npm 10.x (package-lock.json present)

## Frameworks

### Backend (`/backend`)

**Core Framework:**
- NestJS 11.0.1 - Primary backend framework
- TypeScript with decorators enabled

**API & Web:**
- @nestjs/platform-express 11.0.1 - HTTP server
- @nestjs/websockets 11.1.17 - WebSocket support
- @nestjs/platform-socket.io 11.1.17 - Socket.io integration
- Socket.io 4.8.3 - Real-time communication
- Swagger/OpenAPI (@nestjs/swagger 11.2.6) - API documentation at `/api/docs`

**Authentication:**
- @nestjs/jwt 11.0.2 - JWT token handling
- @nestjs/passport 11.0.5 - Auth strategy integration
- passport 0.7.0 - Authentication framework
- passport-jwt 4.0.1 - JWT strategy
- passport-local 1.0.0 - Username/password strategy
- bcrypt 6.0.0 - Password hashing

**Database:**
- Prisma 7.5.0 - ORM
- @prisma/adapter-pg 7.5.0 - PostgreSQL adapter
- @prisma/client 7.5.0 - Database client
- PostgreSQL 15 (docker) - Primary database

**Validation & Transformation:**
- class-validator 0.15.1 - DTO validation
- class-transformer 0.5.1 - Object transformation
- @nestjs/throttler 6.5.0 - Rate limiting (100 req/min)

**Authorization:**
- @casl/ability 6.8.0 - Role-based access control

**Utilities:**
- rxjs 7.8.1 - Reactive programming
- reflect-metadata 0.2.2 - Decorator metadata
- dotenv 17.3.1 - Environment configuration

### Web (`/web`)

**Core Framework:**
- Next.js 16.1.6 - React framework
- React 19.2.3 - UI library
- React DOM 19.2.3

**Styling:**
- Tailwind CSS 4 - Utility-first CSS
- @tailwindcss/postcss 4 - PostCSS integration

**State & Data:**
- @tanstack/react-query 5.90.21 - Server state management
- @tanstack/react-table 8.21.3 - Table component

**UI Components:**
- lucide-react 0.575.0 - Icons

**Real-time:**
- socket.io-client 4.8.3 - WebSocket client

**Data Export:**
- xlsx 0.18.5 - Excel file generation

### Mobile (`/mobile`)

**Core Framework:**
- Expo SDK 55.0.3 - Development platform
- React Native 0.83.2 - Mobile framework
- React 19.2.0 - UI library

**Navigation:**
- @react-navigation/native 7.1.31 - Navigation core
- @react-navigation/bottom-tabs 7.15.2 - Tab navigation

**Bluetooth/RFID:**
- react-native-ble-plx 3.5.1 - BLE communication
- react-native-bluetooth-classic 1.73.0-rc.17 - Classic Bluetooth (backup)
- buffer 6.0.3 - Binary data handling

**Storage:**
- @react-native-async-storage/async-storage 2.2.0 - Local storage
- zustand 5.0.11 - State management

**UI:**
- react-native-safe-area-context 5.6.2 - Safe area handling
- react-native-screens 4.23.0 - Native screens
- lucide-react-native 0.575.0 - Icons
- expo-status-bar 55.0.4 - Status bar

**File Operations:**
- expo-file-system 55.0.9 - File system access
- expo-sharing 55.0.10 - Share functionality

## Testing

**Backend:**
- jest 30.0.0 - Test runner
- ts-jest 29.2.5 - TypeScript Jest transformer
- @nestjs/testing 11.0.1 - NestJS testing utilities
- supertest 7.0.0 - HTTP testing
- @types/jest 30.0.0 - Jest types

## Build Tools

**Backend:**
- @nestjs/cli 11.0.0 - NestJS CLI
- typescript 5.7.3 - TypeScript compiler
- ts-loader 9.5.2 - TypeScript webpack loader
- ts-node 10.9.2 - TypeScript execution
- tsconfig-paths 4.2.0 - Path resolution
- source-map-support 0.5.21 - Source maps

**Web:**
- Next.js built-in build system
- TypeScript 5

**Mobile:**
- Expo CLI (via expo start)
- Metro bundler

## Code Quality

**Linting:**
- eslint 9.18.0 (backend)
- eslint 9 (web)
- eslint-config-prettier 10.0.1 - Prettier ESLint integration
- eslint-plugin-prettier 5.2.2 - Prettier ESLint rules
- typescript-eslint 8.20.0 - TypeScript ESLint
- globals 16.0.0 - Environment globals

**Formatting:**
- prettier 3.4.2 - Code formatter
- Single quote: true
- Trailing comma: all

## Configuration Files

**Backend:**
- `backend/tsconfig.json` - TypeScript config (target ES2023, decorators enabled)
- `backend/nest-cli.json` - NestJS CLI config
- `backend/eslint.config.mjs` - ESLint flat config
- `backend/.prettierrc` - Prettier config
- `backend/jest` config in package.json
- `backend/prisma/schema.prisma` - Database schema

**Web:**
- `web/tsconfig.json` - TypeScript config (target ES2017, path aliases @/*)
- `web/next.config.ts` - Next.js config
- `web/postcss.config.mjs` - PostCSS config (Tailwind)
- `web/eslint.config.mjs` - ESLint config

**Mobile:**
- `mobile/tsconfig.json` - TypeScript config (extends expo/tsconfig.base)
- `mobile/app.json` - Expo configuration

## Platform Requirements

**Development:**
- Node.js 18+ recommended
- npm 9+ or yarn
- Docker (for PostgreSQL)

**Backend Runtime:**
- Node.js 18+
- PostgreSQL 15+

**Web Production:**
- Node.js 18+ (for build)
- Any modern browser (Chrome, Firefox, Safari, Edge)

**Mobile Development:**
- macOS (for iOS development)
- Android Studio or physical device
- Xcode (for iOS)

**Mobile Production:**
- iOS 13+
- Android API 24+ (Android 7.0+)

---

*Stack analysis: 2026-03-26*
