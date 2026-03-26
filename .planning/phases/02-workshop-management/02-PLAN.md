---
phase: "02-workshop-management"
plan: "02"
type: "execute"
wave: 1
depends_on: []
files_modified:
  - "backend/prisma/schema.prisma"
  - "backend/src/transfers/transfers.module.ts"
  - "backend/src/transfers/transfers.service.ts"
  - "backend/src/transfers/transfers.controller.ts"
  - "backend/src/transfers/dto/create-transfer.dto.ts"
  - "backend/src/transfers/dto/confirm-transfer.dto.ts"
  - "backend/src/transfers/dto/query-transfers.dto.ts"
  - "backend/src/app.module.ts"
autonomous: true
requirements:
  - "WORKSHOP-01"
  - "TAGS-02"
must_haves:
  truths:
    - "Transfer model exists with ADMIN_TO_WORKSHOP type and PENDING/COMPLETED/CANCELLED status"
    - "Admin can create transfer from ADMIN location to WORKSHOP location"
    - "Workshop manager can confirm transfer receipt (COMPLETED)"
    - "When COMPLETED, Tag.locationRel points to destination workshop"
    - "When COMPLETED, Tag.status = IN_STOCK"
    - "Transfer code is unique and auto-generated"
  artifacts:
    - path: "backend/prisma/schema.prisma"
      contains: "model Transfer"
      provides: "Transfer entity for tracking Admin→Workshop movement"
    - path: "backend/prisma/schema.prisma"
      contains: "model TransferItem"
      provides: "Tag items in transfer"
    - path: "backend/prisma/schema.prisma"
      contains: "enum TransferType"
      provides: "Type enum: ADMIN_TO_WORKSHOP"
    - path: "backend/prisma/schema.prisma"
      contains: "enum TransferStatus"
      provides: "Status enum: PENDING, COMPLETED, CANCELLED"
    - path: "backend/src/transfers/transfers.service.ts"
      contains: "create("
      provides: "Create transfer (PENDING) - Admin only"
    - path: "backend/src/transfers/transfers.service.ts"
      contains: "confirm("
      provides: "Confirm transfer (COMPLETED) - Workshop manager"
    - path: "backend/src/transfers/transfers.service.ts"
      contains: "updateMany"
      provides: "Bulk update Tag.locationRel and Tag.status on COMPLETED"
---

<objective>
Tạo Transfer model và API cho 2-step workflow: Admin tạo Transfer (PENDING) → Workshop confirm (COMPLETED)

Purpose: Track việc chuyển tag từ Admin đến xưởng may. Khi COMPLETED, tag được gán locationId = workshop đích và status = IN_STOCK.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@backend/prisma/schema.prisma
@backend/src/categories/categories.service.ts
@backend/src/orders/orders.service.ts
</context>

<interfaces>
From backend/prisma/schema.prisma (existing Tag and Location models):
```prisma
model Tag {
  id        String    @id @default(uuid())
  epc       String    @unique
  productId String?
  product   Product?  @relation(fields: [productId], references: [id])
  status    TagStatus @default(IN_STOCK)
  location  String?
  locationId  String?
  locationRel Location?  @relation(fields: [locationId], references: [id])
  lastSeenAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  scans     Scan[]
  events    TagEvent[]
}

model Location {
  id        String       @id @default(uuid())
  code      String       @unique
  name      String
  type      LocationType
  address   String?
  deletedAt DateTime?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  tags      Tag[]
}

enum LocationType {
  ADMIN
  WORKSHOP
  WAREHOUSE
  CUSTOMER
}

enum TagStatus {
  IN_STOCK
  OUT_OF_STOCK
  IN_TRANSIT
  MISSING
}
```

From backend/src/orders/orders.service.ts (code generation pattern):
```typescript
const code = `${createOrderDto.type === 'INBOUND' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Thêm Transfer và TransferItem model vào schema.prisma</name>
  <files>backend/prisma/schema.prisma</files>
  <action>
Thêm vào backend/prisma/schema.prisma, sau enum LocationType và trước model Location:

```prisma
enum TransferType {
  ADMIN_TO_WORKSHOP
}

enum TransferStatus {
  PENDING
  COMPLETED
  CANCELLED
}

model Transfer {
  id              String          @id @default(uuid())
  code            String          @unique  // "TRF-{timestamp}-{random}"
  type            TransferType    @default(ADMIN_TO_WORKSHOP)
  status          TransferStatus  @default(PENDING)
  sourceId        String          // Location - ADMIN
  source          Location        @relation("TransferSource", fields: [sourceId], references: [id])
  destinationId   String          // Location - WORKSHOP
  destination     Location        @relation("TransferDestination", fields: [destinationId], references: [id])
  createdById     String
  createdBy       User            @relation(fields: [createdById], references: [id])
  items           TransferItem[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  completedAt     DateTime?

  @@index([status])
  @@index([type])
  @@index([sourceId])
  @@index([destinationId])
  @@index([createdById])
}

model TransferItem {
  id          String    @id @default(uuid())
  transferId  String
  transfer    Transfer  @relation(fields: [transferId], references: [id], onDelete: Cascade)
  tagId       String
  tag         Tag       @relation(fields: [tagId], references: [id])
  condition   String?   // "GOOD", "DAMAGED", "MISSING"
  scannedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@index([transferId])
  @@index([tagId])
}
```

Cập nhật Location model để thêm relations:
```prisma
model Location {
  // ... existing fields ...
  transfersFrom Transfer[] @relation("TransferSource")
  transfersTo   Transfer[] @relation("TransferDestination")
}
```

Cập nhật User model để thêm relation:
```prisma
model User {
  // ... existing fields ...
  transfers    Transfer[]
}
```

Cập nhật Tag model để thêm relation:
```prisma
model Tag {
  // ... existing fields ...
  transferItems TransferItem[]
}
```
</action>
  <verify>
    <automated>grep -A5 "enum TransferType" backend/prisma/schema.prisma && grep -A15 "model Transfer " backend/prisma/schema.prisma && grep -A10 "model TransferItem" backend/prisma/schema.prisma</automated>
  </verify>
  <done>Transfer model tồn tại với code, type (ADMIN_TO_WORKSHOP), status (PENDING/COMPLETED/CANCELLED), sourceId, destinationId, createdById, items[]</done>
  <read_first>backend/prisma/schema.prisma</read_first>
  <acceptance_criteria>
    - Schema chứa `enum TransferType { ADMIN_TO_WORKSHOP }`
    - Schema chứa `enum TransferStatus { PENDING COMPLETED CANCELLED }`
    - Schema chứa `model Transfer` với các trường: id, code (unique), type, status (default PENDING), sourceId, destinationId, createdById, items[], createdAt, updatedAt, completedAt
    - Schema chứa `model TransferItem` với các trường: id, transferId, tagId, condition, scannedAt, createdAt
    - Transfer có relations tới Location (source, destination), User (createdBy)
    - TransferItem có relation tới Transfer và Tag
    - Location có relations transfersFrom và transfersTo
    - User có relation transfers
    - Tag có relation transferItems
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Tạo TransfersModule với service và controller</name>
  <files>backend/src/transfers/transfers.module.ts</files>
  <action>
Tạo thư mục backend/src/transfers/ với các file:

**backend/src/transfers/transfers.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
```

Đăng ký TransfersModule trong backend/src/app.module.ts (sau OrdersModule):
```typescript
import { TransfersModule } from './transfers/transfers.module';
// ... imports ...

@Module({
  imports: [
    // ... existing imports ...
    OrdersModule,
    TransfersModule,
  ],
  // ...
})
export class AppModule {}
```
</action>
  <verify>
    <automated>ls -la backend/src/transfers/ && grep "TransfersModule" backend/src/app.module.ts</automated>
  </verify>
  <done>TransfersModule tồn tại và được đăng ký trong AppModule</done>
  <read_first>backend/src/app.module.ts</read_first>
  <acceptance_criteria>
    - File backend/src/transfers/transfers.module.ts tồn tại
    - Module được đăng ký trong app.module.ts imports array
    - Module imports PrismaModule và EventsModule
    - Module exports TransfersService
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Implement TransfersService với create và confirm logic</name>
  <files>backend/src/transfers/transfers.service.ts</files>
  <action>
Tạo backend/src/transfers/transfers.service.ts:

```typescript
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { EventsGateway } from '../events/events.gateway';
import { randomBytes } from 'crypto';
import { LocationType, TransferStatus, TagStatus, Role } from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(dto: CreateTransferDto, userId: string) {
    // Validate source is ADMIN location
    const source = await this.prisma.location.findUnique({ where: { id: dto.sourceId } });
    if (!source) throw new NotFoundException('Không tìm thấy vị trí nguồn');
    if (source.type !== LocationType.ADMIN) {
      throw new BadRequestException('Vị trí nguồn phải là ADMIN');
    }

    // Validate destination is WORKSHOP location
    const destination = await this.prisma.location.findUnique({ where: { id: dto.destinationId } });
    if (!destination) throw new NotFoundException('Không tìm thấy vị trí đích');
    if (destination.type !== LocationType.WORKSHOP) {
      throw new BadRequestException('Vị trí đích phải là WORKSHOP');
    }

    // Generate unique code: TRF-{timestamp}-{random}
    const code = `TRF-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // Validate tags exist and are available
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: dto.tagIds } },
    });
    if (tags.length !== dto.tagIds.length) {
      throw new BadRequestException('Một số tag không tồn tại');
    }

    // Check no pending transfer for these tags
    const pendingTransfers = await this.prisma.transferItem.findMany({
      where: {
        tagId: { in: dto.tagIds },
        transfer: { status: TransferStatus.PENDING },
      },
    });
    if (pendingTransfers.length > 0) {
      throw new BadRequestException('Một số tag đang trong transfer PENDING khác');
    }

    // Create transfer with items
    const transfer = await this.prisma.transfer.create({
      data: {
        code,
        type: 'ADMIN_TO_WORKSHOP',
        status: TransferStatus.PENDING,
        sourceId: dto.sourceId,
        destinationId: dto.destinationId,
        createdById: userId,
        items: {
          create: dto.tagIds.map(tagId => ({
            tagId,
          })),
        },
      },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });

    this.events.server.emit('transferUpdate', transfer);
    return transfer;
  }

  async confirm(transferId: string, dto: ConfirmTransferDto, userId: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: { items: true, destination: true },
    });

    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer không ở trạng thái PENDING');
    }

    // Validate user role is WAREHOUSE_MANAGER (per D-08)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== Role.WAREHOUSE_MANAGER) {
      throw new ForbiddenException('Chỉ Warehouse Manager mới có thể xác nhận transfer');
    }

    // Update all tags: locationRel = destination workshop, status = IN_STOCK (per D-09, D-11)
    await this.prisma.tag.updateMany({
      where: { id: { in: transfer.items.map(item => item.tagId) } },
      data: {
        locationId: transfer.destinationId,
        status: TagStatus.IN_STOCK,
      },
    });

    // Mark items as scanned
    await this.prisma.transferItem.updateMany({
      where: { transferId },
      data: {
        scannedAt: new Date(),
        condition: 'GOOD',
      },
    });

    // Complete transfer
    const completedTransfer = await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });

    this.events.server.emit('transferUpdate', completedTransfer);
    return completedTransfer;
  }

  async findAll(query: QueryTransfersDto) {
    const { page = 1, limit = 20, status, type, sourceId, destinationId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (sourceId) where.sourceId = sourceId;
    if (destinationId) where.destinationId = destinationId;

    const [data, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          source: true,
          destination: true,
          createdBy: { select: { username: true } },
          items: { include: { tag: true } },
        },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    return transfer;
  }

  async cancel(id: string, userId: string) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Không tìm thấy transfer');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Chỉ transfer PENDING mới có thể hủy');
    }

    return this.prisma.transfer.update({
      where: { id },
      data: { status: TransferStatus.CANCELLED },
      include: {
        source: true,
        destination: true,
        createdBy: { select: { username: true } },
        items: { include: { tag: true } },
      },
    });
  }
}
```
</action>
  <verify>
    <automated>grep -n "async create\|async confirm\|async findAll\|async findOne\|async cancel" backend/src/transfers/transfers.service.ts</automated>
  </verify>
  <done>TransfersService có create (PENDING), confirm (COMPLETED), findAll, findOne, cancel methods</done>
  <read_first>backend/src/orders/orders.service.ts</read_first>
  <acceptance_criteria>
    - Service có async create() với validation source=ADMIN, destination=WORKSHOP
    - Service có async confirm() với validation role=WAREHOUSE_MANAGER
    - confirm() cập nhật Tag.locationId = destination và Tag.status = IN_STOCK
    - confirm() đánh dấu items scannedAt và condition = GOOD
    - confirm() cập nhật transfer status = COMPLETED và completedAt
    - Service có async findAll() với pagination và filters
    - Service có async findOne() với include relations
    - Service có async cancel() cho PENDING transfers
    - Code format: TRF-{timestamp}-{random} (per orders.service.ts pattern)
    - EventsGateway emit 'transferUpdate' khi transfer thay đổi
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 4: Tạo DTOs và Controller cho Transfers</name>
  <files>backend/src/transfers/dto/create-transfer.dto.ts, backend/src/transfers/dto/confirm-transfer.dto.ts, backend/src/transfers/dto/query-transfers.dto.ts, backend/src/transfers/transfers.controller.ts</files>
  <action>
Tạo thư mục backend/src/transfers/dto/ và các file DTO:

**backend/src/transfers/dto/create-transfer.dto.ts:**
```typescript
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  sourceId: string;  // Location ADMIN

  @IsUUID()
  destinationId: string;  // Location WORKSHOP

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  tagIds: string[];
}
```

**backend/src/transfers/dto/confirm-transfer.dto.ts:**
```typescript
// Empty - confirmation uses transferId from URL param
// Future: could include scanned EPCs to verify
export class ConfirmTransferDto {}
```

**backend/src/transfers/dto/query-transfers.dto.ts:**
```typescript
import { IsOptional, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryTransfersDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsEnum(['ADMIN_TO_WORKSHOP'])
  type?: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  destinationId?: string;
}
```

**backend/src/transfers/transfers.controller.ts:**
```typescript
import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../casl/roles.guard';
import { Roles } from '../casl/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateTransferDto, @Request() req) {
    return this.transfersService.create(dto, req.user.id);
  }

  @Post(':id/confirm')
  @Roles(Role.WAREHOUSE_MANAGER)
  confirm(@Param('id') id: string, @Body() dto: ConfirmTransferDto, @Request() req) {
    return this.transfersService.confirm(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN)
  cancel(@Param('id') id: string, @Request() req) {
    return this.transfersService.cancel(id, req.user.id);
  }

  @Get()
  findAll(@Query() query: QueryTransfersDto) {
    return this.transfersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transfersService.findOne(id);
  }
}
```
</action>
  <verify>
    <automated>ls backend/src/transfers/dto/ && grep -l "create-transfer.dto\|confirm-transfer.dto\|query-transfers.dto" backend/src/transfers/dto/*.ts</automated>
  </verify>
  <done>Transfers DTOs và Controller tồn tại với các endpoints: POST /transfers (ADMIN), POST /transfers/:id/confirm (WAREHOUSE_MANAGER), POST /transfers/:id/cancel (ADMIN), GET /transfers, GET /transfers/:id</done>
  <read_first>backend/src/orders/orders.service.ts</read_first>
  <acceptance_criteria>
    - create-transfer.dto.ts có sourceId (UUID), destinationId (UUID), tagIds (array of UUID)
    - confirm-transfer.dto.ts tồn tại (có thể trống)
    - query-transfers.dto.ts có page, limit, status, type, sourceId, destinationId filters
    - Controller có @Post() create với @Roles(Role.ADMIN)
    - Controller có @Post(':id/confirm') với @Roles(Role.WAREHOUSE_MANAGER) (per D-08)
    - Controller có @Post(':id/cancel') với @Roles(Role.ADMIN)
    - Controller có @Get() findAll và @Get(':id') findOne
    - Controller dùng JwtAuthGuard và RolesGuard
  </acceptance_criteria>
</task>

</tasks>

<verification>
- Chạy `npx prisma validate` để validate schema
- Chạy `npx prisma generate` để generate Prisma client
- API endpoint test: POST /api/transfers tạo transfer PENDING
- API endpoint test: POST /api/transfers/:id/confirm cập nhật tags và COMPLETED
- Verify: Tag.locationId = workshop destination và Tag.status = IN_STOCK sau confirm
</verification>

<success_criteria>
- Transfer model tồn tại với type ADMIN_TO_WORKSHOP và status PENDING/COMPLETED/CANCELLED
- TransferItem model có relation tới Tag
- Admin có thể tạo transfer (POST /api/transfers)
- Warehouse Manager có thể confirm transfer (POST /api/transfers/:id/confirm) - per D-08
- Khi COMPLETED: Tag.locationRel = destination workshop (per D-11)
- Khi COMPLETED: Tag.status = IN_STOCK (per D-09)
- Transfer code format: TRF-{timestamp}-{random}
- Các role guards hoạt động đúng (ADMIN cho create/cancel, WAREHOUSE_MANAGER cho confirm)
</success_criteria>

<output>
Sau khi hoàn thành, tạo `.planning/phases/02-workshop-management/02-SUMMARY.md`
</output>
