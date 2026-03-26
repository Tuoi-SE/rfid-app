# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**BLE Service - Debug Logging:**
- Issue: Temporary debug logging left in production code
- Files: `mobile/src/services/BLEService.ts:174`
- Impact: Logs raw BLE bytes on every read, degrades performance and fills logs
- Fix approach: Remove or guard with a DEBUG_BLE flag

**BLE Parsing - Hardcoded Limits:**
- Issue: Buffer size limits are magic numbers: 8192 max buffer, 2048 slice
- Files: `mobile/src/services/BLEService.ts:179-180`
- Impact: Arbitrary limits may cause data loss or truncation with high scan volumes
- Fix approach: Make configurable or use dynamic buffering

**Tag Event User Resolution:**
- Issue: Comment indicates user name cannot be resolved from TagEvent - userId relation incomplete
- Files: `backend/src/tags/tags.service.ts:70-71`
- Impact: Tag history shows user IDs instead of names, requires manual join
- Fix approach: Add explicit user relation to TagEvent or join in query

**Hardcoded API URL:**
- Issue: SyncService defaults to localhost:3000, no fallback detection
- Files: `mobile/src/services/SyncService.ts:8`
- Impact: Mobile app fails silently if backend unavailable at wrong URL
- Fix approach: Implement service discovery or proper offline queue

**Seed Script - ESLint Disabled:**
- Issue: Seed script disables ESLint for Excel parsing workaround
- Files: `backend/prisma/seed-excel.ts`
- Impact: Opens security hole if this file is ever imported elsewhere
- Fix approach: Refactor to use proper Excel parsing library

---

## Security Considerations

**JWT Secret Fallback Pattern:**
- Risk: If JWT_REFRESH_SECRET not set, falls back to `JWT_SECRET + '_refresh'`
- Files: `backend/src/auth/auth.service.ts:20`
- Current mitigation: Assumes JWT_SECRET is always set in production
- Recommendations: Fail fast if refresh secret not explicitly configured

**CORS Configuration:**
- Risk: Default CORS origins includes localhost, may be too permissive in production
- Files: `backend/src/main.ts:12-17`
- Current mitigation: Reads from config, split by comma
- Recommendations: Validate CORS origins at startup, reject invalid URLs

**WebSocket Authentication:**
- Risk: Socket authentication only checks token validity, no per-message auth
- Files: `backend/src/events/events.gateway.ts:31-52`
- Current mitigation: JWT verification on connection
- Recommendations: Consider per-message authentication for sensitive operations

**No Rate Limiting on Auth:**
- Risk: Brute force attacks on login endpoint possible
- Files: `backend/src/auth/auth.controller.ts` (implied from guards)
- Current mitigation: Throttler module is present but may not cover auth
- Recommendations: Explicitly configure throttler limits for login/refresh endpoints

**Refresh Token Revocation - Race Condition:**
- Risk: Token reuse after logout could occur in narrow window
- Files: `backend/src/auth/auth.service.ts:80-84`
- Current mitigation: Database check before reuse
- Recommendations: Use token families or one-time use tokens

**WebSocket Token in URL:**
- Risk: Token appears in connection URL, may be logged by proxies
- Files: `web/src/app/tags/live/page.tsx:28`
- Impact: Auth token visible in server logs and browser history
- Recommendations: Move token to connection headers or use secure websocket

---

## Performance Bottlenecks

**Stock Summary - O(n*m) Complexity:**
- Problem: getStockSummary() iterates products, then for each iterates tags twice
- Files: `backend/src/inventory/inventory.service.ts:101-128`
- Cause: flatMap followed by filter for each product
- Improvement path: Single query with groupBy or raw aggregation

**Live Scan WebSocket - No Batching:**
- Problem: Every scan triggers immediate database lookup and WebSocket broadcast
- Files: `backend/src/events/events.gateway.ts:59-128`
- Cause: No buffering/debouncing of incoming scans
- Improvement path: Batch scans over 100ms window before processing

**Session Creation - Large Transaction:**
- Problem: Single transaction creates session, scans, updates tags, creates events
- Files: `backend/src/sessions/sessions.service.ts:36-182`
- Cause: Long-held locks during bulk operations
- Improvement path: Split into queued background job for large sessions (>100 tags)

**Web Live Page - State Update Inefficiency:**
- Problem: Creates new array on every scan even if no new tags
- Files: `web/src/app/tags/live/page.tsx:47-63`
- Cause: `setScannedTags(prev => ...)` pattern triggers re-render unnecessarily
- Improvement path: Use React.memo or check hasNew before state update

---

## Fragile Areas

**BLE Protocol Parsing:**
- Files: `mobile/src/services/BLEService.ts:184-264`
- Why fragile: Relies on magic bytes 0xCF and 0xBB for packet detection, no CRC validation
- Safe modification: Add protocol version detection before parsing
- Test coverage: Manual testing only, no unit tests

**WebSocket Reconnection:**
- Files: `web/src/app/tags/live/page.tsx`
- Why fragile: No automatic reconnection when connection drops mid-session
- Safe modification: Add socket.io reconnection handlers
- Test coverage: Not tested

**Mobile Offline Queue:**
- Files: `mobile/src/services/SyncService.ts`
- Why fragile: pushSession catches error but still calls luuVaoBo(), unclear if retry logic exists
- Safe modification: Implement proper offline-first with exponential backoff
- Test coverage: Not tested

**API Response Handling:**
- Files: `mobile/src/services/SyncService.ts:42-45`
- Why fragile: Attempts to handle multiple response formats (data.data, data.tags, raw array)
- Safe modification: Standardize API response format across all endpoints
- Test coverage: Not tested

---

## Dependencies at Risk

**react-native-ble-plx - BLE Library:**
- Risk: Native module with infrequent updates, may not support newer React Native
- Impact: Could break on RN upgrade
- Migration plan: Keep RN version stable, or migrate to @invicara/react-native-ble-plx fork

**Prisma 7.x - Very Recent:**
- Risk: Major version (7.x) may have undetected bugs or breaking changes
- Impact: Schema migrations, client compatibility
- Migration plan: Lock to minor version, test migrations thoroughly before prod

**Socket.io Client/Server Version Mismatch:**
- Risk: Mixing socket.io 4.8.3 client with NestJS websockets 11.x
- Impact: Protocol incompatibility could cause silent failures
- Migration plan: Verify version compatibility matrix

---

## Test Coverage Gaps

**Backend Services:**
- What's not tested: SessionsService, TagsService, InventoryService have no unit tests
- Files: `backend/src/sessions/sessions.service.ts`, `backend/src/tags/tags.service.ts`, `backend/src/inventory/inventory.service.ts`
- Risk: Refactoring any of these services could break production silently
- Priority: High

**BLE Protocol Parsing:**
- What's not tested: Packet parsing logic (parsePackets, handleBLEData)
- Files: `mobile/src/services/BLEService.ts:170-264`
- Risk: Protocol changes or edge cases cause data loss
- Priority: Medium

**WebSocket Gateway:**
- What's not tested: Connection handling, room management, scanStream
- Files: `backend/src/events/events.gateway.ts`
- Risk: Connection handling bugs could cause memory leaks or auth bypass
- Priority: High

**Mobile State Management:**
- What's not tested: Zustand stores, store synchronization
- Files: `mobile/src/store/bleStore.ts`, `mobile/src/store/inventoryStore.ts`, `mobile/src/store/authStore.ts`
- Risk: State corruption could cause incorrect inventory counts
- Priority: Medium

---

## Missing Critical Features

**Backend Backup/Restore:**
- Problem: No database backup mechanism exists
- Blocks: Disaster recovery, migration between environments

**Mobile - Tag Assignment Confirmation:**
- Problem: assignTags() doesn't return result or verify server received data
- Blocks: User doesn't know if tag assignment succeeded

**Web - Session Export:**
- Problem: Sessions can be viewed but not exported to Excel/CSV
- Blocks: Audit reporting, offline reconciliation

**Backend - Audit Log for Tag Deletes:**
- Problem: Deleting a tag doesn't create a TagEvent
- Files: `backend/src/tags/tags.service.ts:162-167`
- Blocks: Tracking tag lifecycle fully, compliance requirements

---

## Known Bugs

**Mobile - Bluetooth Permission Dialog Blocks:**
- Symptoms: Android permission dialog triggers app pause, scan stops
- Files: `mobile/src/services/BLEService.ts:23-33`
- Trigger: Requesting BLUETOOTH_SCAN or BLUETOOTH_CONNECT permissions
- Workaround: None identified

**Web - Live Page Duplicate Detection:**
- Symptoms: Same EPC can appear twice in scannedTags array
- Files: `web/src/app/tags/live/page.tsx:51-59`
- Trigger: When scanDetected arrives while liveScan also pending
- Workaround: Manual deduplication on save

**Mobile - Session Save Swallows Errors:**
- Symptoms: Error during pushSession shows success alert anyway
- Files: `mobile/src/screens/QuetTheScreen.tsx:85-87`
- Trigger: Network error after local save
- Workaround: Check server sync status manually

---

*Concerns audit: 2026-03-26*
