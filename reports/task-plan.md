# Task Plan — Email Login & Forgot Password

> **Codex Audit: NEEDS_CHANGES** — 5 CRITICAL issues fixed (Passport usernameField, EmailModule import path, nodemailer install, schema relations, soft-delete lookup)

## 1. Tóm tắt

### Hiện trạng (đã xác minh từ code)
- `AuthService.validateUser(username, password)` — nhận `username` string
- `LocalStrategy.validate(username, password)` — passport mặc định đọc field `username` từ body
- `LocalAuthGuard` — simple wrapper quanh `AuthGuard('local')`
- `UsersService` — có `findByUsername()`, chưa có `findByEmail()`
- Schema: User model **không có field `email`**, **đã có** `failedLoginAttempts` + `lockedUntil`
- SALT_ROUNDS = 12 ✅
- Rate limits đã set: login 10/60s, refresh 30/60s, logout 20/60s ✅

### Mục tiêu
1. Cho phép login bằng **email hoặc username** (1 field `login`)
2. Thêm chức năng **forgot password** qua email
3. Tạo **EmailService** cho transactional emails

### ⚠️ Codex CRITICAL Fixes Applied
1. **Passport usernameField** — LocalStrategy phải pass `usernameField: 'login'` vào super()
2. **EmailModule import** — Thêm `@email/*` path alias vào tsconfig.json
3. **nodemailer dependency** — Cài `nodemailer@^6.9.0` vào package.json
4. **Schema relations** — User model cần thêm `email` + `passwordResetTokens` relation
5. **Soft-delete lookup** — forgot-password email lookup phải có `deletedAt: null`

---

## 2. Database Migration

### 2.1. Thêm `email` vào User model + relation

```prisma
model User {
  // ... existing fields ...
  email                 String?               @unique
  passwordResetTokens   PasswordResetToken[]
  // ... existing relations ...
}
```

### 2.2. Thêm model `PasswordResetToken`

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  token     String    @unique  // SHA-256 hashed
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime? // null = chưa dùng
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([token])
}
```

> ⚠️ **Lưu ý:** Email không dùng `citext` — app-level lowercase normalization khi create/update/login

### 2.3. Chạy migration

```bash
cd backend
npx prisma migrate dev --name add_email_and_password_reset
npx prisma generate
```

---

## 3. Files cần tạo mới

### 3.1. `backend/src/auth/dto/forgot-password.dto.ts`

```typescript
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com hoặc username' })
  @IsString()
  @IsNotEmpty()
  login: string; // email hoặc username
}
```

### 3.2. `backend/src/auth/dto/reset-password.dto.ts`

```typescript
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token từ email reset link' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'Matkhau@1234' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
```

### 3.3. `backend/src/email/email.service.ts`

> ⚠️ **Codex fix:** Cài `npm install nodemailer@^6.9.0` trước

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: ReturnType<typeof createTransport>;

  constructor(private config: ConfigService) {
    this.transporter = createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT', 587)),
      secure: this.config.get('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string, username: string) {
    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM', 'noreply@rfid-inventory.com'),
        to,
        subject: 'Đặt lại mật khẩu — RFID Inventory',
        html: `
          <p>Xin chào ${this.escapeHtml(username)},</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào link sau (hiệu lực 15 phút):</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Nếu bạn không yêu cầu, bỏ qua email này.</p>
        `,
      });
    } catch (error) {
      // Log nhưng không throw — user vẫn thấy "email đã gửi"
      this.logger.error(`Email send failed: ${error.message}`);
    }
  }

  private escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
}
```

### 3.4. `backend/src/email/email.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

---

## 4. Files cần sửa

### 4.1. `backend/src/auth/dto/login.dto.ts`

**Thay đổi:** Đổi field `username` → `login`

```typescript
// Trước
@IsString()
@IsNotEmpty()
username: string;

// Sau
@ApiProperty({ example: 'admin' hoặc 'admin@example.com' })
@IsString()
@IsNotEmpty()
login: string;
```

### 4.2. `backend/src/auth/strategies/local.strategy.ts`

**Thay đổi:** Đổi `validate(username, password)` → `validate(login, password)`, thêm `usernameField` vào super()

```typescript
constructor(private authService: AuthService) {
  super({
    usernameField: 'login',  // ĐỌC req.body.login thay vì req.body.username
    passwordField: 'password',
  });
}

async validate(login: string, password: string) {
  const user = await this.authService.validateUser(login, password);
  if (!user) {
    throw new BusinessException('Sai tài khoản hoặc mật khẩu', 'AUTH_INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
  }
  return user;
}
```

### 4.3. `backend/src/auth/auth.service.ts`

#### 4.3.1. Thêm `findByUsernameOrEmail()` helper (private)

```typescript
private async findByUsernameOrEmail(login: string) {
  const isEmail = login.includes('@');
  if (isEmail) {
    return this.prisma.user.findUnique({
      where: { email: login, deletedAt: null },
    });
  }
  return this.prisma.user.findUnique({
    where: { username: login, deletedAt: null },
  });
}
```

#### 4.3.2. Cập nhật `validateUser()`

```typescript
// Trước
async validateUser(username: string, password: string) {
  const user = await this.usersService.findByUsername(username);
  // ...
}

// Sau
async validateUser(login: string, password: string) {
  const user = await this.findByUsernameOrEmail(login);
  if (!user) return null;
  // ... (phần còn lại giữ nguyên)
}
```

#### 4.3.3. Thêm `forgotPassword()`

```typescript
async forgotPassword(login: string): Promise<void> {
  const isEmail = login.includes('@');
  // ⚠️ FIX: Thêm deletedAt: null để soft-deleted users không bị target
  const normalizedLogin = isEmail ? login.toLowerCase() : login;
  const user = isEmail
    ? await this.prisma.user.findFirst({
        where: { email: normalizedLogin, deletedAt: null },
      })
    : await this.prisma.user.findFirst({
        where: { username: normalizedLogin, deletedAt: null },
      });

  // Luôn return để prevent email enumeration
  if (!user || !user.email) return;

  // Xóa token cũ của user (đảm bảo 1 active token)
  await this.prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  // Tạo token mới
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

  await this.prisma.passwordResetToken.create({
    data: { token: hashedToken, userId: user.id, expiresAt },
  });

  // Gửi email (không throw nếu fail)
  await this.emailService.sendPasswordResetEmail(user.email, token, user.username);
}
```

#### 4.3.4. Thêm `resetPassword()`

```typescript
async resetPassword(token: string, newPassword: string): Promise<void> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // ⚠️ FIX: Dùng transaction + findFirst để tránh race condition
  const resetToken = await this.prisma.$transaction(async (tx) => {
    const found = await tx.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!found) return null;

    // ⚠️ FIX: Revoke existing refresh tokens of user (session invalidation)
    await tx.refreshToken.updateMany({
      where: { userId: found.userId, revoked: false },
      data: { revoked: true },
    });

    // Mark token as used
    await tx.passwordResetToken.update({
      where: { id: found.id },
      data: { usedAt: new Date() },
    });

    return found;
  });

  if (!resetToken) {
    throw new BusinessException(
      'Token không hợp lệ hoặc đã hết hạn',
      'AUTH_RESET_TOKEN_INVALID',
      HttpStatus.BAD_REQUEST,
    );
  }

  // ⚠️ FIX: Check user is not soft-deleted
  if (resetToken.user.deletedAt) {
    throw new BusinessException(
      'Token không hợp lệ hoặc đã hết hạn',
      'AUTH_RESET_TOKEN_INVALID',
      HttpStatus.BAD_REQUEST,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await this.prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });
}
```

#### 4.3.5. Thêm `EmailService` injection

```typescript
constructor(
  private usersService: UsersService,
  private jwtService: JwtService,
  private config: ConfigService,
  private prisma: PrismaService,
  private activityLogService: ActivityLogService,
  private emailService: EmailService, // THÊM
) {}
```

### 4.4. `backend/src/auth/auth.controller.ts`

Thêm 2 endpoints:

```typescript
/**
 * POST /api/auth/forgot-password
 * Rate limit: 3 lần/phút/IP
 */
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.authService.forgotPassword(dto.login);
  return { success: true, message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi.' };
}

/**
 * POST /api/auth/reset-password
 * Rate limit: 5 lần/phút/IP
 */
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordDto) {
  await this.authService.resetPassword(dto.token, dto.newPassword);
  return { success: true, message: 'Đặt lại mật khẩu thành công.' };
}
```

Import DTOs mới:

```typescript
import { ForgotPasswordDto } from '@auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@auth/dto/reset-password.dto';
```

### 4.5. `backend/tsconfig.json` — Thêm `@email/*` alias

```json
"paths": {
  "@/*": ["src/*"],
  "@common/*": ["src/common/*"],
  "@auth/*": ["src/auth/*"],
  "@users/*": ["src/users/*"],
  "@prisma/*": ["src/prisma/*"],
  "@email/*": ["src/email/*"],  // THÊM
  // ... các alias khác giữ nguyên
}
```

### 4.6. `backend/src/auth/auth.module.ts`

```typescript
import { EmailModule } from '@email/email.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({ /* ... */ }),
    EmailModule, // THÊM
  ],
  // ...
})
export class AuthModule {}
```

### 4.6. `backend/src/users/users.service.ts`

#### 4.6.1. Thêm `findByEmail()`

```typescript
async findByEmail(email: string) {
  return this.prisma.user.findUnique({ where: { email, deletedAt: null } });
}
```

#### 4.6.2. Cập nhật `create()` — thêm email

```typescript
// Trong prisma.user.create data
data: {
  username: dto.username,
  email: dto.email || null, // THÊM
  password: hashedPassword,
  // ...
}
```

#### 4.6.3. Cập nhật `update()` — thêm email + unique check

```typescript
if (dto.email !== undefined) {
  const existing = await this.prisma.user.findFirst({
    where: { email: dto.email, NOT: { id } },
  });
  if (existing) {
    throw new BusinessException('Email đã được sử dụng', 'USER_EMAIL_EXISTS', HttpStatus.CONFLICT);
  }
  data.email = dto.email || null;
}
```

### 4.7. `backend/src/users/dto/create-user.dto.ts`

Thêm email field:

```typescript
@ApiPropertyOptional({ example: 'user@example.com' })
@IsOptional()
@IsEmail()
email?: string;
```

### 4.8. `backend/src/users/dto/update-user.dto.ts`

Thêm email field:

```typescript
@IsOptional()
@IsEmail()
email?: string;
```

### 4.9. `backend/.env.example`

```bash
# --- Email (SMTP) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="RFID Inventory" <noreply@rfid-inventory.com>
FRONTEND_URL=http://localhost:3001
```

---

## 5. Security Considerations

| Measure | Implementation |
|---------|---------------|
| Email enumeration prevention | `forgot-password` luôn trả 200, không leak user existence |
| Rate limiting | 3 req/phút cho forgot-password, 5 req/phút cho reset-password |
| Token entropy | `crypto.randomBytes(32)` = 256-bit |
| Token storage | SHA-256 hash trong DB |
| Token TTL | 15 phút |
| Token single-use | `usedAt` timestamp |
| Password hashing | bcrypt 12 rounds (đã có) |

---

## 6. Files Summary

| Action | File |
|--------|------|
| Tạo mới | `backend/src/auth/dto/forgot-password.dto.ts` |
| Tạo mới | `backend/src/auth/dto/reset-password.dto.ts` |
| Tạo mới | `backend/src/email/email.service.ts` |
| Tạo mới | `backend/src/email/email.module.ts` |
| Sửa | `backend/prisma/schema.prisma` |
| Sửa | `backend/src/auth/dto/login.dto.ts` |
| Sửa | `backend/src/auth/strategies/local.strategy.ts` |
| Sửa | `backend/src/auth/auth.service.ts` |
| Sửa | `backend/src/auth/auth.controller.ts` |
| Sửa | `backend/src/auth/auth.module.ts` |
| Sửa | `backend/src/users/users.service.ts` |
| Sửa | `backend/src/users/dto/create-user.dto.ts` |
| Sửa | `backend/src/users/dto/update-user.dto.ts` |
| Sửa | `backend/.env.example` |

**Tổng: 4 files mới, 10 files sửa**

---

## 7. Execution Order

```
Phase 1 — Database
1. Cập nhật schema.prisma → chạy migration + generate

Phase 2 — DTOs & Email Service
2. `npm install nodemailer@^6.9.0` trong backend/
3. Thêm `@email/*` alias vào backend/tsconfig.json
4. Tạo forgot-password.dto.ts
5. Tạo reset-password.dto.ts
6. Tạo email/email.service.ts
7. Tạo email/email.module.ts

Phase 3 — Core Auth Changes
8. Cập nhật LoginDto (username → login)
9. Cập nhật LocalStrategy (validate login thay vì username, thêm usernameField vào super)
10. Thêm EmailModule vào AuthModule
11. Thêm EmailService vào AuthService constructor
12. Thêm findByUsernameOrEmail() helper trong AuthService
13. Cập nhật validateUser() trong AuthService
14. Thêm forgotPassword() vào AuthService
15. Thêm resetPassword() vào AuthService
16. Thêm 2 endpoints vào AuthController

Phase 4 — User Service
17. Thêm findByEmail() vào UsersService
18. Cập nhật UsersService.create() xử lý email (lowercase normalize)
19. Cập nhật UsersService.update() xử lý email + unique check (lowercase normalize)
20. Cập nhật CreateUserDto thêm email
21. Cập nhật UpdateUserDto thêm email

Phase 5 — Env & Verify
22. Cập nhật .env.example
23. Chạy build để verify
```

---

## 8. Frontend Breaking Change

Frontend (`web/`) hiện gọi:

```typescript
// POST /api/auth/login
{ username: string, password: string }
```

Cần đổi thành:

```typescript
{ login: string, password: string }
```

Backend endpoint vẫn là `POST /api/auth/login` — không đổi route, chỉ đổi body field name.
