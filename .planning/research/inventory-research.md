# Research: Multi-Location RFID Inventory Tracking

**Project:** RFID Tag Inventory System
**Domain:** Inventory management with RFID scanning
**Researched:** 2026-03-26
**Confidence:** MEDIUM (based on training data; WebSearch unavailable for verification)

---

## Executive Summary

The current codebase has a **significant architectural gap**: `location` is stored as a freeform string on the `Tag` model rather than as a proper relational model. This prevents accurate per-location quantity tracking, verification workflows, and proper inventory accounting. Multi-location operations (workshops, warehouses, customer sites) are currently tracked via session names rather than structured location entities.

**Critical findings:**
1. No `Location` model exists -- locations are freeform strings
2. Missing verification workflow (scan-to-verify-quantity) is not implemented
3. Inventory transactions (inbound/outbound) are implicitly handled via session scans, not explicit order fulfillment
4. Real-time cross-location visibility requires denormalized queries

---

## 1. Location-Based Inventory Tracking Models

### Current State (GAS DRESS)

The `Tag` model has:
```prisma
location  String?   // freeform string -- NOT a foreign key
status    TagStatus // IN_STOCK, OUT_OF_STOCK, IN_TRANSIT, MISSING
```

Session scans update `location` to the session name:
```typescript
// sessions.service.ts line 130-136
await tx.tag.updateMany({
  where: { epc: { in: uniqueEpcs } },
  data: {
    location: dto.name,  // <-- session name becomes location
    lastSeenAt: now,
    status: tagsToUpdateStatus
  }
});
```

This is a **data integrity risk**. No referential integrity, no location metadata, no hierarchy.

### Recommended Model (Best Practice)

A proper multi-location inventory system requires:

```prisma
model Location {
  id            String      @id @default(uuid())
  name          String      @unique
  type          LocationType
  address       String?
  parentId      String?     // for hierarchy: warehouse > zone > shelf
  parent        Location?   @relation("LocationHierarchy", fields: [parentId], references: [id])
  children      Location[]  @relation("LocationHierarchy")
  createdAt     DateTime    @default(now())

  // Denormalized inventory counts for fast reads
  totalTags     Int         @default(0)
  inStockCount  Int         @default(0)

  tags          Tag[]
  sessions      Session[]
}

enum LocationType {
  CENTRAL_WAREHOUSE
  WORKSHOP
  CUSTOMER_SITE  // hotels/resorts
  STAGING       // receiving/shipping dock
}
```

**Why not freeform string:**
- Cannot enforce referential integrity
- Cannot query "all locations of type WORKSHOP"
- Cannot build location hierarchies (warehouse > zone > shelf)
- Cannot store location metadata (address, contact, capacity)
- No way to answer "what's at location X" without string matching

### Alternative: Hybrid Approach

If you want to minimize schema changes while improving data integrity:

```prisma
model Location {
  id        String   @id @default(uuid())
  code      String   @unique  // e.g., "WH-CENTRAL-01", "WK-SHOP-A"
  name      String
  type      LocationType
  // no parent hierarchy initially
}

// On Tag: locationId String? (foreign key)
model Tag {
  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id])
}
```

This gives you referential integrity and the ability to query by location type without full hierarchy support.

---

## 2. Verification Workflows (Scan to Verify Quantity)

### What "Verification" Means in RFID Context

Verification = comparing **expected quantity** vs **actual scanned quantity** at a location.

**Common verification scenarios:**
1. **Cycle counting** -- scheduled physical count vs system records
2. **Receiving verification** -- PO expected vs arrived
3. **Shipping verification** -- what was picked vs what scanned
4. **Discrepancy detection** -- items missing or in wrong location

### Current Implementation (Missing)

The existing `sessions.service.ts` has a **partial missing tag detection** (lines 153-178):

```typescript
// Detect MISSING tags (only if this is a general scan, NOT an order fulfillment)
if (!order) {
  const missingTags = await tx.tag.findMany({
    where: {
      location: dto.name,
      epc: { notIn: uniqueEpcs },
      status: { not: 'MISSING' }
    }
  });
  // ... marks them as MISSING
}
```

**Problems:**
- Only detects tags that were **expected to be there** based on historical `location` field
- No **expected quantity** concept per location
- No **verification session** type -- it's bundled into regular scan sessions
- No workflow for "verified count matches expected" vs "discrepancy found"

### Recommended Verification Workflow

```
┌─────────────────────────────────────────────────────────┐
│  VERIFICATION SESSION FLOW                               │
├─────────────────────────────────────────────────────────┤
│  1. Create Verification Session                          │
│     - locationId (required)                             │
│     - expectedTagIds OR expectedProductCounts           │
│     - session type: VERIFICATION                        │
│                                                         │
│  2. Worker scans tags at location                       │
│     - Each scan recorded with location context          │
│     - Real-time progress: scanned / expected            │
│                                                         │
│  3. On session complete:                                │
│     - FOUND: scanned tags at location                   │
│     - MISSING: expected but not scanned                 │
│     - UNEXPECTED: scanned but not expected at location  │
│                                                         │
│  4. Generate discrepancy report                         │
│     - Adjust inventory if authorized                     │
│     - Or flag for investigation                         │
└─────────────────────────────────────────────────────────┘
```

### Data Model for Verification

```prisma
model VerificationSession {
  id            String    @id @default(uuid())
  name          String
  locationId    String
  location      Location  @relation(fields: [locationId], references: [id])
  status        VerificationStatus @default(PENDING)
  expectedCount Int?      // if verifying by product quantity
  scannedCount  Int       @default(0)
  discrepancyCount Int   @default(0)
  userId        String?
  startedAt     DateTime  @default(now())
  completedAt   DateTime?

  scans         Scan[]
  discrepancies VerificationDiscrepancy[]
}

enum VerificationStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  DISCREPANCY_FOUND
  RESOLVED
}

model VerificationDiscrepancy {
  id                  String   @id @default(uuid())
  verificationSessionId String
  tagId               String
  type                DiscrepancyType  // MISSING, UNEXPECTED, WRONG_LOCATION
  expectedLocationId  String?
  foundLocationId     String?
}

enum DiscrepancyType {
  MISSING          // expected at location, not found
  UNEXPECTED        // found at location, not expected
  WRONG_LOCATION   // found but should be elsewhere
}
```

---

## 3. Inventory Transaction Patterns (Inbound/Outbound per Location)

### Current State

The `Order` model has `OrderType.INBOUND` and `OrderType.OUTBOUND`, but the flow is implicit in sessions:

```typescript
// sessions.service.ts lines 101-106
if (order.type === 'OUTBOUND') {
  tagsToUpdateStatus = 'OUT_OF_STOCK'; // Xuất kho
} else if (order.type === 'INBOUND') {
  tagsToUpdateStatus = 'IN_STOCK'; // Nhập kho
}
```

**Problems:**
- No explicit **source/destination location** on orders
- No **quantity per location** tracking (only tag-level status)
- No **inventory transaction log** separate from tag events
- Cannot answer "what moved from warehouse A to workshop B yesterday"

### Recommended Transaction Model

**Option A: Separate InventoryTransaction Table** (Industry Standard)

```prisma
model InventoryTransaction {
  id            String            @id @default(uuid())
  type          TransactionType
  productId     String
  product       Product           @relation(fields: [productId], references: [id])
  quantity      Int

  // Location context
  fromLocationId String?
  toLocationId   String?

  // Optional: linked to order/session
  orderId       String?
  sessionId     String?
  verificationId String?

  userId        String
  note          String?
  createdAt     DateTime          @default(now())
}

enum TransactionType {
  RECEIVING      // PO arrived at warehouse
  TRANSFER_OUT   // left a location
  TRANSFER_IN    // arrived at a location
  ADJUSTMENT     // manual correction
  SCRAP          // written off
  RETURN         // returned from customer
}
```

**Why separate from TagEvent:**
- TagEvent is an audit log per tag (useful for timeline)
- InventoryTransaction is an accounting record per product/location
- You need both: tag events for "where's my specific tag?", transactions for "how many of product X at location Y?"

**Option B: Enhanced TagStatus with Location History** (Simpler)

If you don't need full accounting, extend TagEvent:

```prisma
model TagEvent {
  // existing fields...
  fromLocationId String?  // when MOVED, where did it come from
  toLocationId   String?  // when MOVED, where did it go to
  quantity       Int?     // for bulk movements
}
```

This is simpler but doesn't support aggregate queries like "total received at WH-Central this month" as efficiently.

---

## 4. Real-Time Inventory Visibility Across Locations

### Current Implementation

The `inventory.service.ts` `getStockSummary()` aggregates by **status** and **product**, not by location:

```typescript
// Lines 91-96: Overall status counts (no location dimension)
const statusCounts = await this.prisma.tag.groupBy({
  by: ['status'],
  _count: { _all: true },
});

// Lines 101-110: Per-product breakdown (no location)
const products = await this.prisma.product.findMany({
  select: {
    id: true, name: true, sku: true,
    category: { select: { name: true } },
    tags: { select: { status: true } },  // <-- all locations mixed
  },
});
```

**Gap:** Cannot get "how many of product X at warehouse A vs workshop B".

### Recommended: Denormalized Location Inventory Counts

For real-time visibility without expensive joins, maintain aggregate counts:

```prisma
model LocationInventory {
  id          String   @id @default(uuid())
  locationId  String
  productId   String
  quantity    Int      @default(0)  // last verified count

  // Composite unique to prevent duplicates
  @@unique([locationId, productId])
}
```

**Update strategy:**
1. On scan session completion: recalculate actual counts, compare to stored
2. On verification session: update `LocationInventory.quantity` to verified count
3. On transfer: decrement source, increment destination atomically

**Alternative: Materialized View or Query**

If you don't want to maintain denormalized counts:
```typescript
// Per-location, per-product count query
async getLocationInventory(locationId: string) {
  return this.prisma.tag.groupBy({
    by: ['productId', 'status'],
    where: { locationId },
    _count: { _all: true },
  });
}
```

**Trade-off:** Simpler (single source of truth), but slower for dashboards with many locations.

---

## 5. Common Tech Debt and Pitfalls

### Critical Pitfalls (Cause Rewrites)

#### 1. Location as Freeform String
**Problem:** Every query requires string matching, no referential integrity, cannot filter by location type.
**Prevention:** Create `Location` model with foreign key on `Tag.locationId`.
**Detection:** `SELECT * FROM "Tag" WHERE location LIKE '%workshop%'` queries indicate this problem.

#### 2. Missing Quantity at Location Level
**Problem:** You can only track "tag status" (IN_STOCK/OUT_OF_STOCK) not "quantity per location". When the same product is at multiple locations, you cannot answer "how many at each?".
**Prevention:** Add `LocationInventory` model or at minimum `Tag.locationId` as FK.
**Current state:** The codebase has this problem -- `Tag.location` is string, no FK.

#### 3. Verification Workflow Not Separated from Scanning
**Problem:** The missing-tag detection is buried inside session creation. No concept of "we're doing a verification run vs a normal scan".
**Prevention:** Create `VerificationSession` model with explicit expected vs actual.
**Current state:** Partial implementation in `sessions.service.ts` lines 153-178.

#### 4. No Source/Destination on Transfers
**Problem:** `OUTBOUND` order doesn't record WHERE items went, just sets status to OUT_OF_STOCK. `INBOUND` doesn't record WHERE items arrived.
**Prevention:** Add `fromLocationId` and `toLocationId` to order fulfillment flow.
**Current state:** Order model has no location fields.

### Moderate Pitfalls

#### 5. Denormalized Counts Not Maintained
**Problem:** `getStockSummary()` does expensive aggregations on every call. With 10K+ tags, this becomes slow.
**Prevention:** Add `Location.totalTags`, `Location.inStockCount` and update atomically on changes.
**Current state:** No denormalized counts exist.

#### 6. Tag Status vs Location Confusion
**Problem:** `Tag.status = OUT_OF_STOCK` could mean "checked out to a customer" OR "actually missing". The enum values don't capture location context.
**Prevention:** Use `status` for physical state (IN_STOCK, MISSING, IN_TRANSIT) and `locationId` for "where is it?" separately.
**Current state:** `OUT_OF_STOCK` is overloaded.

#### 7. No Audit Log for Inventory Corrections
**Problem:** When discrepancy is found, manual adjustment happens without recording who approved it and why.
**Prevention:** `InventoryTransaction` with `type: ADJUSTMENT` and `note` field.
**Current state:** ActivityLog exists but doesn't capture inventory correction reasoning.

### Minor Pitfalls

#### 8. EPC Normalization Missing
**Problem:** EPCs might come in different formats (with/without spaces, uppercase/lowercase). Comparing them fails.
**Prevention:** Normalize on ingestion: `epc.toUpperCase().replace(/\\s/g, '')`
**Current state:** Unknown -- need to check if `RFIDParser.ts` normalizes.

#### 9. Session Name Used as Location
**Problem:** `dto.name` becomes `tag.location`. If session is named "Morning count 2026-03-25", location becomes that string -- not a real location reference.
**Prevention:** Require `locationId` on session creation, use session name only for human reference.
**Current state:** `sessions.service.ts` line 130 uses `location: dto.name`.

---

## 6. Recommendations Summary

### Immediate (Current Sprint)

| Issue | Fix |
|-------|-----|
| Location as string | Create `Location` model with `code`, `name`, `type`. Add `Tag.locationId` FK. |
| Session name = location | Sessions should reference `locationId`. Session name is display only. |
| Missing detection bundled | Refactor to use `VerificationSession` when doing inventory checks. |

### Short-Term (Next Sprint)

| Issue | Fix |
|-------|-----|
| No per-location counts | Add `LocationInventory` model or maintain denormalized `Location.totalTags`, `Location.inStockCount` |
| No source/dest on orders | Add `fromLocationId`, `toLocationId` to order fulfillment |
| Status overloaded | Clarify `OUT_OF_STOCK` vs `MISSING` semantics |

### Medium-Term

| Issue | Fix |
|-------|-----|
| Real-time dashboard | Add `LocationInventory` for sub-second dashboard loads |
| Audit trail for corrections | Add `InventoryTransaction` model |
| Verification workflow UI | Build verification session flow in web/mobile apps |

---

## 7. Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Location model design | MEDIUM | Standard pattern; WebSearch unavailable to verify against current industry examples |
| Verification workflow | MEDIUM | Pattern is industry-standard; implementation details inferred |
| Transaction patterns | MEDIUM | `InventoryTransaction` is SAP/Oracle-standard; slight variation for RFID context |
| Pitfalls identified | MEDIUM-HIGH | Based on training data common RFID inventory implementation mistakes |
| Current state analysis | HIGH | Direct code review of existing codebase |

---

## 8. Gaps Needing Further Research

1. **RFID read accuracy patterns** -- How does the ST-H103 handle tag collision? Multiple scans of same tag in one session?
2. **Offline sync strategy** -- Mobile app has offline storage but sync conflict resolution not defined
3. **Expected product quantity workflow** -- How do POs/expected quantities get loaded for verification?
4. **Customer site (hotel/resort) specifics** -- Items at customer location: do they need check-out/check-in workflow?

---

## Sources

- **Context7:** Not available for this domain
- **Training data:** General knowledge of RFID inventory management patterns, ERP inventory models (SAP MM), Prisma schema best practices
- **Direct code analysis:** Current codebase at `/Users/heymac/Desktop/Project/RFIDInventory`

**Confidence flag:** Findings should be validated against industry RFID middleware documentation (Impinj, Zebra) and actual warehouse management system implementations before finalizing architecture.
