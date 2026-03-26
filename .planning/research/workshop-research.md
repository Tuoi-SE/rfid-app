# Workshop Management Research: RFID Inventory System for Garment Manufacturing

**Domain:** Multi-location workshop inventory tracking for RFID tag management
**Project:** Garment manufacturing RFID inventory system (Admin -> Workshop -> Warehouse -> Customer)
**Researched:** 2026-03-26
**Confidence:** MEDIUM (Based on existing codebase analysis and established supply chain patterns; WebSearch unavailable for verification)

---

## Executive Summary

The current system tracks tags with a simple `location: String?` field and basic `status` enum. For multi-workshop garment manufacturing, the system needs explicit workshop location modeling, transfer workflows between locations, and reconciliation patterns. The existing `TagEvent` system provides a solid foundation for audit trails, but lacks explicit transfer semantics.

---

## 1. Multi-Location Workshop Inventory Tracking

### Current State

The existing `Tag` model has:
```prisma
location  String?   // Currently free-form string
status    TagStatus // IN_STOCK, OUT_OF_STOCK, IN_TRANSIT, MISSING
```

**Problem:** Using a free-form string for location makes it impossible to:
- Query tags by workshop (case-sensitive string matching)
- Validate location transitions (Admin -> Workshop A should not go directly to Customer)
- Build workshop-specific dashboards
- Track inventory levels per workshop

### Recommended Pattern: Location Entity + Zone Model

**Schema Changes:**

```prisma
model Location {
  id          String   @id @default(uuid())
  code        String   @unique  // e.g., "ADMIN", "WS-A", "WS-B", "CENTRAL-WH", "CUSTOMER-HOTEL-1"
  name        String             // e.g., "Workshop A - Sewing Floor"
  type        LocationType       // ADMIN, WORKSHOP, WAREHOUSE, CUSTOMER
  parentId    String?            // For hierarchical: Workshop belongs to region
  parent      Location?  @relation("LocationHierarchy", fields: [parentId], references: [id])
  children    Location[] @relation("LocationHierarchy")
  tags        Tag[]
  createdAt   DateTime @default(now())
}

enum LocationType {
  ADMIN
  WORKSHOP
  WAREHOUSE
  CUSTOMER
}
```

**Tag model update:**
```prisma
model Tag {
  // ... existing fields
  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id])
  // Keep location string as optional "last known position" for offline scenarios
  locationText String?   // Human-readable: "Workshop A - Sewing Line 3"
}
```

**Why this approach:**
- `Location.code` enables fast, exact-match queries (no LIKE/case issues)
- `LocationType` enforces valid state transitions at the API level
- Hierarchical `parentId` enables regional workshop groupings
- `locationText` provides human-readable detail without querying Location table

### Alternative: Zone-Based Tracking

For high-precision workshop tracking (separate RFID readers per zone within a workshop):

```prisma
model Zone {
  id          String   @id @default(uuid())
  code        String   // "WS-A-LINE-1"
  name        String   // "Workshop A - Sewing Line 1"
  locationId  String  // Parent workshop
  location    Location @relation(...)
}
```

Use when: Workshops have multiple independent RFID scanning stations

---

## 2. Transfer Workflow: Workshop <-> Central Warehouse

### Current Flow Analysis

The system currently has:
- `Order` with `INBOUND`/`OUTBOUND` types
- `InventoryService.processOperation()` with `CHECK_IN`/`CHECK_OUT`
- Session-based scanning that updates tag location

**Gap:** No explicit "transfer" concept. Moving tags from Workshop to Warehouse is conflated with order fulfillment.

### Recommended Transfer Pattern

**New `Transfer` entity:**

```prisma
model Transfer {
  id            String        @id @default(uuid())
  code          String        @unique  // "TRF-20260326-001"
  type          TransferType  // WORKSHOP_TO_WAREHOUSE, WAREHOUSE_TO_CUSTOMER, etc.
  status        TransferStatus // PENDING, IN_TRANSIT, COMPLETED, CANCELLED
  sourceId      String        // Location ID (workshop)
  destinationId String        // Location ID (warehouse/customer)
  createdById   String
  createdBy     User          @relation(...)
  items         TransferItem[]
  createdAt     DateTime      @default(now())
  completedAt   DateTime?
}

enum TransferType {
  WORKSHOP_TO_WAREHOUSE
  WAREHOUSE_TO_WORKSHOP    // Returns/rejects
  WARHOUSE_TO_CUSTOMER
  CUSTOMER_TO_WAREHOUSE    // Returns
  INTER_WORKSHOP           // If tags move between workshops
}

enum TransferStatus {
  PENDING      // Created, not yet shipped
  IN_TRANSIT   // Handed off to logistics
  COMPLETED    // Received at destination
  CANCELLED    // Cancelled before completion
}

model TransferItem {
  id          String   @id @default(uuid())
  transferId  String
  transfer    Transfer @relation(...)
  tagId       String
  tag         Tag      @relation(...)
  scannedAt   DateTime? // When tag was scanned during receive
  condition   String?  // "GOOD", "DAMAGED", "MISSING"
}
```

### Transfer Workflow State Machine

```
[PENDING] --> [IN_TRANSIT] --> [COMPLETED]
     |              |
     v              v
 [CANCELLED]   [CANCELLED]
```

### API Endpoints for Transfers

```typescript
// POST /api/transfers          - Create transfer order
// GET  /api/transfers           - List transfers (filterable by status, type, location)
// GET  /api/transfers/:id       - Transfer details with items
// POST /api/transfers/:id/ship - Mark as IN_TRANSIT (source scans tags)
// POST /api/transfers/:id/receive - Confirm receipt (destination scans tags)
// POST /api/transfers/:id/cancel  - Cancel transfer
// GET  /api/transfers/:id/diff  - Show missing/damaged items after receipt
```

### Recommended Business Logic

**1. Create Transfer (from Workshop):**
```typescript
async createTransfer(dto: CreateTransferDto, userId: string) {
  // Validates:
  // - Source is a WORKSHOP location
  // - User has permission at source location
  // - Tags actually exist at source location
  // - No conflicting pending transfers for those tags
}
```

**2. Ship Transfer (IN_TRANSIT):**
- Workshop operator scans tags being sent
- System marks those specific tags as `IN_TRANSIT`
- Generates TransferItem records
- Updates `locationText` to "In transit to [destination]"

**3. Receive Transfer (COMPLETED):**
- Warehouse operator scans received tags
- System compares scanned vs shipped
- Tags not scanned -> `MISSING` status, flagged in `TransferItem.condition`
- All tags updated to new location
- Transfer status -> COMPLETED

**4. Reconciliation (POST_COMPLETED):**
- Any discrepancies logged to `TransferItem.condition`
- Dashboard shows transfer accuracy rate per workshop
- Triggers investigation workflow if > 5% missing

---

## 3. Workshop Inventory Reconciliation Patterns

### Pattern A: Cycle Counting (Recommended for Workshops)

**Concept:** Schedule regular partial counts rather than full inventory shutdowns.

```typescript
// POST /api/reconciliation/cycles
interface CycleCountDto {
  locationId: string;
  zoneId?: string;        // Optional: specific zone
  expectedTags: string[]; // EPCs expected to be present
}

interface CycleCountResult {
  locationId: string;
  expected: number;
  found: number;
  missing: string[];      // EPCs not scanned
  unexpected: string[];  // EPCs scanned but not expected
  accuracy: number;       // percentage
}
```

**Workflow:**
1. System generates expected tag list for workshop location
2. Workshop operator scans current inventory
3. System compares found vs expected
4. Missing tags -> `MISSING` status + TagEvent
5. Unexpected tags -> flagged for investigation (could be mislocated)
6. Results stored for analytics

### Pattern B: Full Reconciliation (Periodic)

For quarterly/all-hands counts:

```typescript
// POST /api/reconciliation/full
interface FullReconciliationDto {
  locationId: string;
  scannedTags: string[]; // All EPCs physically counted
  sessionName: string;   // "Workshop A - Q1 2026 Count"
}
```

**Difference from Cycle Count:**
- Full replacement of expected set
- Creates new `Session` for the count
- Marks previously tracked tags as missing if not in scan
- Should be rare (quarterly at most)

### Pattern C: Transfer-Based Reconciliation

After each transfer receipt, perform mini-reconciliation:
- Compare transferred items vs received items
- Log discrepancies immediately
- No separate reconciliation session needed

### Discrepancy Handling

```typescript
interface DiscrepancyReport {
  id: string;
  locationId: string;
  type: 'MISSING' | 'UNEXPECTED' | 'DAMAGED';
  tagId: string;
  expectedLocation?: string;
  actualLocation?: string;
  reportedAt: DateTime;
  resolvedAt?: DateTime;
  resolution?: 'FOUND' | 'WRITTEN_OFF' | 'TRANSFERRED';
}
```

**Resolution Workflow:**
1. Missing tag flagged
2. Workshop manager notified
3. 48-hour grace period to find tag
4. If not found: `WRITTEN_OFF` with reason, audit log entry
5. Unexpected tag: trace to last valid transfer, correct location

---

## 4. API Design Patterns for Workshop Management

### Location-Aware Queries

All inventory queries should filter by location:

```typescript
// GET /api/tags?locationId=ws-a-uuid
// GET /api/tags?locationType=WORKSHOP
// GET /api/tags?locationId=ws-a-uuid&status=IN_STOCK

// QueryTagsDto extension
interface QueryTagsDto {
  // ... existing fields
  locationId?: string;
  locationType?: LocationType;
}
```

### Nested Location Filtering

```typescript
// Get all tags in "Workshop A" and its sub-zones
// GET /api/tags?locationId=ws-a-uuid&includeChildren=true
```

### Workshop-Scoped Sessions

Sessions should be scoped to a location:

```typescript
// POST /api/sessions
interface CreateSessionDto {
  name: string;
  locationId: string;  // REQUIRED - which workshop/warehouse
  // ... existing fields
}
```

### Transfer API Design

**Clean REST resource design:**

```
/api/transfers
  POST   - Create transfer
  GET    - List transfers (filterable)

/api/transfers/:id
  GET    - Transfer details

/api/transfers/:id/ship
  POST   - Initiate shipment (source confirms tags)

/api/transfers/:id/receive
  POST   - Confirm receipt (destination confirms tags)

/api/transfers/:id/items
  GET    - Items in transfer
  POST   - Add items to pending transfer
  DELETE - Remove items from pending transfer

/api/transfers/:id/cancel
  POST   - Cancel transfer
```

### Permission Scoping

Workshop managers should only see/operate on their workshop:

```typescript
// Every endpoint that touches location-specific data
async validateLocationAccess(userId: string, locationId: string, action: 'read' | 'write') {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { locationAccess: true }
  });

  if (!user.locationAccess.some(loc => loc.id === locationId)) {
    throw new ForbiddenException('No access to this location');
  }
}
```

### Event-Driven Updates

```typescript
// WebSocket events for real-time workshop dashboards
EventsGateway.emit('transferUpdate', { transferId, status });
EventsGateway.emit('locationInventoryUpdate', { locationId, tagCount });
EventsGateway.emit('reconciliationAlert', { locationId, missingCount });
```

---

## 5. Tag Status Flow (Updated)

Current flow:
```
ADMIN -> [IN_STOCK] -> Workshop -> [OUT_OF_STOCK] -> Warehouse -> [OUT_OF_STOCK] -> Customer
```

Recommended flow with explicit states:

```
ADMIN (tags created)
    |
    v
[IN_STOCK at Admin] --transfer--> [IN_STOCK at Workshop]
                                         |
                                         v (work begins)
                                   [IN_PROGRESS at Workshop]
                                         |
                                         v (work completed)
                                   [IN_STOCK at Workshop]
                                         |
                                         v (ship to warehouse)
[IN_TRANSIT] --workshop transfer-->
                                         |
                                         v (receive at warehouse)
                                   [IN_STOCK at Warehouse]
                                         |
                                         v (ship to customer)
[IN_TRANSIT] --customer transfer-->
                                         |
                                         v (receive at customer)
                                   [DELIVERED to Customer]
```

**New status consideration:**
- `IN_PROGRESS` - Tag is actively being worked on in workshop (optional, for granular tracking)
- `DELIVERED` - End state when received at customer

**Retain existing:**
- `IN_STOCK` - Sitting at a location
- `OUT_OF_STOCK` - Checked out/shipped
- `IN_TRANSIT` - Being transferred
- `MISSING` - Cannot locate

---

## 6. Data Model Summary

### Recommended Schema Additions

```prisma
// New models
model Location {
  id          String       @id @default(uuid())
  code        String       @unique
  name        String
  type        LocationType
  parentId    String?
  parent      Location?    @relation("LocationHierarchy", fields: [parentId], references: [id])
  children    Location[]   @relation("LocationHierarchy")
  tags        Tag[]
  transfersFrom Transfer[] @relation("TransferSource")
  transfersTo   Transfer[] @relation("TransferDestination")
  createdAt   DateTime     @default(now())
}

model Transfer {
  id              String          @id @default(uuid())
  code            String          @unique
  type            TransferType
  status          TransferStatus  @default(PENDING)
  sourceId        String
  source          Location        @relation("TransferSource", fields: [sourceId], references: [id])
  destinationId   String
  destination     Location        @relation("TransferDestination", fields: [destinationId], references: [id])
  createdById     String
  createdBy       User            @relation(fields: [createdById], references: [id])
  items           TransferItem[]
  createdAt       DateTime        @default(now())
  completedAt     DateTime?
}

model TransferItem {
  id          String    @id @default(uuid())
  transferId  String
  transfer    Transfer  @relation(...)
  tagId       String
  tag         Tag       @relation(...)
  scannedAt   DateTime?
  condition   String?   // "GOOD", "DAMAGED", "MISSING"
}

// Tag model update
model Tag {
  // ... existing fields
  locationId    String?
  location      Location? @relation(...)
  locationText String?   // Human-readable: "Workshop A - Line 3"
}
```

### TagStatus Update

```prisma
enum TagStatus {
  IN_STOCK
  OUT_OF_STOCK   // Deprecated: use IN_TRANSIT or DELIVERED
  IN_TRANSIT
  MISSING
  IN_PROGRESS    // Optional: actively being worked
  DELIVERED      // End state at customer
}
```

---

## 7. Implementation Recommendations

### Phase 1: Location Infrastructure
- Add `Location` model with seed data (Admin, Workshop A, Workshop B, Central WH, Customer locations)
- Update `Tag` model with `locationId`
- Add location filtering to existing queries
- Location management API (CRUD for locations)

### Phase 2: Transfer System
- Add `Transfer` and `TransferItem` models
- Transfer API endpoints
- Transfer workflow (create -> ship -> receive)
- Transfer dashboard

### Phase 3: Reconciliation
- Cycle count API and UI
- Full reconciliation flow
- Discrepancy reporting
- Missing tag workflow

### Phase 4: Analytics
- Workshop accuracy metrics
- Transfer time tracking
- Inventory forecasting per location
- Alert thresholds

---

## 8. Key Differences from Current Implementation

| Aspect | Current | Recommended |
|--------|---------|------------|
| Location | Free-form string | Location entity with type |
| Transfers | Confused with orders | Explicit Transfer model |
| Inventory ops | CHECK_IN/CHECK_OUT | Transfer-based workflow |
| Missing tags | Simple MISSING status | Discrepancy tracking with resolution workflow |
| Workshop ops | Generic sessions | Location-scoped sessions with reconciliation |
| Permissions | Role-based only | Location + role based |

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Location string data migration | One-time migration script, backfill locationId from locationText |
| Workshop operators mis-scanning | Clear UI prompts showing expected location |
| Offline scanning at workshops | Queue transfers, sync when online |
| Tag loss during transfer | Require scan confirmation at both ends |
| Too many location types | Start with 4 types, add as needed |

---

## 10. Sources

**Confidence Level: MEDIUM**

This research is based on:
1. Analysis of existing codebase (NestJS, Prisma, existing patterns)
2. Established supply chain inventory management patterns
3. General software engineering best practices

No web search was available to verify against current industry practices. Recommend validation against:
- WMS (Warehouse Management System) documentation
- GS1 RFID standards for supply chain
- Industry-specific garment manufacturing inventory practices
