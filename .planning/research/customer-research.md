# Customer Management Research: B2B Inventory for Hotel/Resort Industry

**Domain:** RFID garment inventory system for hospitality (hotels/resorts)
**Researched:** 2026-03-26
**Confidence:** MEDIUM (based on B2B inventory domain knowledge, not specific web research)

## Executive Summary

This system tracks RFID garment tags from manufacturing through warehousing to hotel/resort customers. The core requirement is tracking "exported to customer" quantities without needing delivery confirmation from customers.

**Key insight:** Customer management in this context is primarily about creating a destination entity for outbound orders and enabling inventory visibility per customer. The system does NOT need full partner lifecycle management.

---

## 1. Customer Entity Design

### Recommended Schema

```prisma
enum CustomerType {
  HOTEL
  RESORT
  SPA
  OTHER
}

model Customer {
  id          String       @id @default(uuid())
  code        String       @unique  // e.g., "HTL-001", "RSR-001"
  name        String
  type        CustomerType
  address     String?
  contactName String?
  contactPhone String?
  contactEmail String?
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relationships
  orders      Order[]      // Outbound orders to this customer
  tags        Tag[]        // Tags currently at this customer location
}
```

### Design Rationale

| Field | Purpose | Why |
|-------|---------|-----|
| `code` | Human-readable identifier | Hotel chains use codes in their own systems |
| `type` | Distinguish hotel vs resort | Different laundry workflows |
| `tags` relation | Track customer-specific inventory | Core visibility requirement |
| `isActive` | Soft delete | Historical orders remain valid |

### Hotel/Resort Hierarchy Considerations

**Option A: Flat model (recommended for MVP)**
- Single `Customer` table
- `type` field distinguishes hotel vs resort
- Sufficient for tracking "exported quantity"

**Option B: Hierarchical model**
```
Organization (chain HQ)
  └── Property (individual hotel/resort)
```
- Use when: Multiple properties under one billing entity
- Add later when billing/contract complexity grows

**Recommendation:** Start with Option A. The PROJECT.md states only tracking "exported quantity" per customer, not contract hierarchies.

---

## 2. Delivery/Outbound Tracking Patterns

### Pattern: Extend Existing Order Model

The existing `Order` model already supports `INBOUND` and `OUTBOUND` types. Add `customerId` for outbound orders:

```prisma
model Order {
  // ... existing fields ...
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id])

  @@index([customerId])
}
```

### Flow for Outbound to Customer

1. **Create OUTBOUND order** with `customerId` pointing to destination
2. **Scan tags** to verify quantities (existing Session/Scan pattern)
3. **Complete order** - tags change status to `OUT_OF_STOCK` and `location` updates to customer code
4. **No delivery confirmation needed** (per PROJECT.md constraints)

### Tag Location Tracking

Current schema has `Tag.location` as optional string. For customer-specific tracking:

```prisma
model Tag {
  // ... existing fields ...
  customerId String?   // Null = in warehouse/transport
  customer   Customer? @relation(fields: [customerId], references: [id])

  @@index([customerId])
}
```

**Alternative: Use status + location**
- `status: OUT_OF_STOCK` + `location: "CUSTOMER:HTL-001"` if you prefer denormalized
- **Recommendation:** Use `customerId` relation for referential integrity and easier queries

### Key Inventory States

| State | Tag.status | Tag.location | Tag.customerId | Meaning |
|-------|------------|--------------|----------------|---------|
| In warehouse | IN_STOCK | null | null | Available stock |
| In transit | IN_TRANSIT | null | null | Moving to customer |
| At customer | OUT_OF_STOCK | null | set | Delivered to customer |

---

## 3. Customer-Specific Inventory Visibility

### Requirements

- View total tags at each customer
- View breakdown by product type at each customer
- Track export history per customer

### Recommended API Endpoints

```
GET    /api/customers                    # List all customers
POST   /api/customers                    # Create customer
GET    /api/customers/:id                # Get customer details
PATCH  /api/customers/:id                 # Update customer
DELETE /api/customers/:id                 # Soft delete (set isActive=false)

GET    /api/customers/:id/inventory       # Tags at this customer
GET    /api/customers/:id/orders          # Order history for customer
GET    /api/customers/:id/summary          # Quick stats: total tags, last delivery
```

### Inventory Summary Query

```typescript
async getCustomerInventory(customerId: string) {
  const tags = await this.prisma.tag.findMany({
    where: { customerId },
    include: { product: { include: { category: true } } },
  });

  // Group by product
  const breakdown = groupBy(tags, t => t.productId);
  return Object.entries(breakdown).map(([productId, tags]) => ({
    productId,
    productName: tags[0].product.name,
    category: tags[0].product.category.name,
    quantity: tags.length,
  }));
}
```

---

## 4. Common API Patterns for Customer Management

### NestJS Service Pattern

Based on existing codebase patterns (see `orders.service.ts`, `products.service.ts`):

```typescript
@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const code = `CUST-${Date.now().toString().slice(-6)}`;
    return this.prisma.customer.create({
      data: { ...createCustomerDto, code },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.customer.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { tags: true, orders: true } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getInventorySummary(customerId: string) {
    const [totalTags, recentExports] = await Promise.all([
      this.prisma.tag.count({ where: { customerId } }),
      this.prisma.order.count({
        where: { customerId, type: 'OUTBOUND', status: 'COMPLETED' },
      }),
    ]);
    return { totalTags, totalExports: recentExports };
  }
}
```

### DTO Pattern

```typescript
// create-customer.dto.ts
export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(CustomerType)
  type: CustomerType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
```

### Controller Pattern

```typescript
@Controller('api/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles('ADMIN', 'WAREHOUSE_MANAGER')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.customersService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Roles('ADMIN', 'WAREHOUSE_MANAGER')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/inventory')
  @Roles('ADMIN', 'WAREHOUSE_MANAGER')
  getInventory(@Param('id') id: string) {
    return this.customersService.getInventorySummary(id);
  }
}
```

### Role-Based Access

| Action | ADMIN | WAREHOUSE_MANAGER |
|--------|-------|-------------------|
| Create customer | Yes | No |
| View customers | Yes | Yes |
| View customer inventory | Yes | Yes |
| Update customer | Yes | No |
| Delete customer | Yes | No |

---

## 5. Integration with Existing Schema

### Migration Strategy

1. **Add Customer model** - new table
2. **Add customerId to Tag** - nullable foreign key
3. **Add customerId to Order** - nullable foreign key for OUTBOUND orders

### Tag Status Flow Updates

When OUTBOUND order completes:
```typescript
async completeOutboundOrder(orderId: string, userId: string) {
  const order = await this.prisma.order.update({
    where: { id: orderId },
    data: { status: 'COMPLETED' },
    include: { items: { include: { product: true } } },
  });

  // For each tag in the order items, update customer assignment
  // This requires tracking which specific tags were in the order
  // Consider adding OrderItem.tagId[] for precise tracking
}
```

**Issue identified:** Current `OrderItem` tracks `quantity` not specific `tagId` values. For precise customer assignment, you may need:

```prisma
model OrderItem {
  // existing fields...
  tagIds String[]  // Optional: specific tag IDs in this line item
}
```

**Alternative:** Keep it simple - on OUTBOUND completion, scan tags and assign `customerId` during the scan session. The existing `Session` already tracks scanned tags.

---

## 6. Anti-Patterns to Avoid

| Anti-Pattern | Why Avoid | Instead |
|--------------|-----------|---------|
| Hard delete customers | Breaks order history | Soft delete with `isActive` |
| Store customer name in Tag | Duplication, sync issues | Use `customerId` relation |
| Embed customer in location string | Hard to query | Use separate `customerId` field |
| Require delivery confirmation | Outside scope per PROJECT.md | Track only "exported" |
| Multi-tenant isolation | Not required - single org | Simple role-based access |

---

## 7. Recommended Next Steps

1. **Phase 1:** Add `Customer` model, seed with hotel/resort types
2. **Phase 2:** Add `customerId` to `Tag`, update OUTBOUND flow to assign
3. **Phase 3:** Add customer inventory visibility endpoints
4. **Phase 4:** Dashboard widget showing tags-per-customer breakdown

---

## Sources

- Project context: `.planning/PROJECT.md`
- Existing patterns: `backend/src/orders/orders.service.ts`, `backend/src/inventory/inventory.service.ts`
- Schema: `backend/prisma/schema.prisma`

**Confidence:** MEDIUM - Based on B2B inventory domain patterns. Recommend validation against actual hotel/resort laundry operations if implementation details are critical.
