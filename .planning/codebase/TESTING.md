# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Backend (NestJS):**
- Test Runner: Jest 30.x
- Config location: `backend/package.json` (jest section)
- E2E config: `backend/test/jest-e2e.json`
- Testing package: `@nestjs/testing` for unit/integration tests

**Frontend Web:**
- No test framework configured
- Package at `web/package.json`: No jest or vitest
- Uses React Query for server state, manual testing

**Frontend Mobile:**
- No test framework configured
- Package at `mobile/package.json`: No jest or vitest

## Run Commands

**Backend:**
```bash
npm test                    # Run unit tests
npm run test:watch          # Watch mode
npm run test:cov            # Coverage report
npm run test:e2e           # E2E tests (jest-e2e.json)
npm run test:debug          # Debug with inspector
```

## Test File Organization

**Location:**
- Backend unit tests: Co-located with source files using `*.spec.ts` pattern
- Backend E2E tests: `backend/test/` directory
- Example E2E test: `backend/test/app.e2e-spec.ts`

**Naming:**
- Unit tests: `filename.spec.ts` (e.g., `tags.service.spec.ts`)
- E2E tests: `*.e2e-spec.ts`

**Current State:**
- No unit spec files found in `backend/src/` (only in node_modules)
- Only E2E test exists at `backend/test/app.e2e-spec.ts`
- Mobile and Web have no test files

## Test Structure

**E2E Test Example from `backend/test/app.e2e-spec.ts`:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

**Pattern Analysis:**
- Uses `Test.createTestingModule()` with `imports`
- Compiles NestJS application for testing
- Uses `supertest` for HTTP assertions
- Basic `beforeEach` setup per test

## Jest Configuration

**From `backend/package.json`:**
```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

**E2E Config from `backend/test/jest-e2e.json`:**
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## Mocking

**Current State:**
- No explicit mocking patterns found in existing tests
- E2E test uses real `AppModule` import (no mocks)

**NestJS Testing Module Approach:**
```typescript
// Standard mocking pattern (not currently used)
const mockPrismaService = {
  tag: { findMany: jest.fn(), findUnique: jest.fn() },
  // ...
};
```

**What Could Be Mocked:**
- `PrismaService` - database operations
- `JwtService` - token generation
- External services (BLE, etc.)

## Fixtures and Factories

**Current State:**
- No test fixtures or factories defined
- E2E tests use real database via Prisma

**Prisma Test DB:**
- No explicit test database configuration found
- Likely uses development database for E2E tests

## Coverage

**Requirements:** None enforced

**Current Coverage:**
- Unit tests: Not implemented (0% coverage likely)
- E2E tests: Minimal - only `app.e2e-spec.ts` with one passing test

**View Coverage:**
```bash
npm run test:cov
```

## Test Types

**Unit Tests:**
- Not implemented in this codebase
- No `*.spec.ts` files found in `backend/src/`

**Integration Tests:**
- E2E tests via Jest + supertest
- Only one basic test exists

**E2E Tests:**
- Located at `backend/test/app.e2e-spec.ts`
- Tests HTTP endpoints
- No test for authentication, tags, users, or other modules

## Mobile Testing

**Current State:**
- No test framework installed
- No test files exist
- Manual testing only

**What Would Be Needed:**
- Jest or Vitest setup
- React Native Testing Library
- Mock for `react-native-ble-plx`

## Web Testing

**Current State:**
- No test framework installed
- ESLint configured but no tests
- Manual testing only

**What Would Be Needed:**
- Jest or Vitest setup
- React Testing Library or Cypress
- Mock for API calls (React Query mocking)

## Common Patterns (Not Currently Used)

**Async Testing:**
```typescript
it('should create a tag', async () => {
  const result = await tagsService.create(createTagDto, 'user-id');
  expect(result).toHaveProperty('epc');
});
```

**Error Testing:**
```typescript
it('should throw NotFoundException for non-existent tag', async () => {
  await expect(tagsService.findByEpc('non-existent')).rejects.toThrow(NotFoundException);
});
```

**Mocking Service:**
```typescript
const tagsService = {
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
};
```

## Critical Gaps

1. **No unit tests** for any service, controller, or module
2. **No mocking patterns** established
3. **No test coverage enforcement** (coverage command exists but no threshold)
4. **E2E coverage minimal** - only one passing test
5. **Mobile and Web untested** - no test infrastructure
6. **No database isolation** for tests (E2E uses real DB)
7. **No API integration tests** for major endpoints

---

*Testing analysis: 2026-03-26*
