# RFID Inventory System — Tài liệu Toàn bộ Dự án

> **Thiết bị**: UHF RFID Sled Reader ST-H103 (Focus RFID Co., Ltd)  
> **Tags**: RFID Label ST-U4216 U9  
> **MAC**: E0:4E:7A:F3:78:56  
> **Mục tiêu**: App React Native (Expo) + Web App quản lý inventory bằng tiếng Việt

---

## MỤC LỤC

1. [Thông tin thiết bị](#1-thông-tin-thiết-bị)
2. [BLE UUID đã xác nhận](#2-ble-uuid-đã-xác-nhận)
3. [Phân tích dữ liệu thô](#3-phân-tích-dữ-liệu-thô)
4. [Kiến trúc hệ thống tổng quan](#4-kiến-trúc-hệ-thống-tổng-quan)
5. [Phase 1 — Backend API](#5-phase-1--backend-api)
6. [Phase 2 — Web App](#6-phase-2--web-app)
7. [Phase 3 — Mobile App Expo](#7-phase-3--mobile-app-expo)
8. [Timeline thực hiện](#8-timeline-thực-hiện)

---

## 1. Thông tin thiết bị

### Hardware

| Thông tin | Giá trị |
|-----------|---------|
| Tên thiết bị | UHF RFID Sled Reader |
| Model | ST-H103 |
| Hãng sản xuất | Focus RFID Co., Ltd |
| MAC Address | E0:4E:7A:F3:78:56 |
| Hardware Version | CP-218710_V1.2 |
| Firmware Version | UHF Hand Reader H103 2024.12.03 |
| Tần số hoạt động | USA (902–928 MHz) |
| Output Power | 33 dBm |
| Q Value | 4 |
| Session | S0 |

### Tags RFID

| Thông tin | Giá trị |
|-----------|---------|
| Model | ST-U4216 U9 |
| Số lượng test | 12 PCs |
| EPC Length | 12 bytes |
| Tiêu chuẩn | EPC Gen2 UHF |

### Kết nối hỗ trợ

- BLE (Bluetooth Low Energy) ← **Dùng trong dự án này**
- LAN / TCP
- UART
- USB (VID: 1155 / 0x0483, PID: 22352 / 0x5740 — STM32 Virtual COM)

---

## 2. BLE UUID đã xác nhận

> ✅ Đã test thực tế với nRF Connect — hoạt động 100%

### Services

| Service | UUID | Mô tả |
|---------|------|-------|
| Generic Access | 0x1800 | System |
| Generic Attribute | 0x1801 | System |
| Device Information | 0x180A | System |
| Battery Service | 0x180F | Thông tin pin |
| Human Interface Device | 0x1812 | HID |
| Scan Parameters | 0x1813 | System |
| **Unknown Service** | **0xFFE0** | **Serial UART over BLE — DÙNG CÁI NÀY** |

### Characteristics của Service 0xFFE0

| UUID | Properties | Vai trò |
|------|-----------|---------|
| 0xFFE1 | READ, WRITE | Đọc/ghi dữ liệu |
| 0xFFE2 | READ | Đọc config |
| **0xFFE3** | **WRITE** | ⭐ **Gửi lệnh vào đây** |
| **0xFFE4** | **NOTIFY** | ⭐ **Nhận data RFID từ đây** |
| 0xFFE5 | READ | Đọc thông tin |

### Full UUID (128-bit) để dùng trong code

```
SERVICE_UUID:     0000FFE0-0000-1000-8000-00805F9B34FB
CHAR_WRITE_UUID:  0000FFE3-0000-1000-8000-00805F9B34FB
CHAR_NOTIFY_UUID: 0000FFE4-0000-1000-8000-00805F9B34FB
```

### Lệnh đã test thành công

```
Start Inventory: BB 00 27 00 03 22 00 00 4A 7E
Stop Inventory:  BB 00 28 00 00 28 7E
```

> **Đã xác nhận**: Gửi lệnh Start qua FFE3 → FFE4 trả về data với header `CF`

---

## 3. Phân tích dữ liệu thô

### Format packet từ FFE4

```
Header: CF
Ví dụ packet EPC:
CF 00 00 01 12 00 FD 8A 01 00 0C E2 80 69 15 00 00 40 1E CC 01 11 3D ...
                              ↑↑                 ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                              EPC len=12         EPC data (12 bytes)
```

| Byte Index | Giá trị ví dụ | Ý nghĩa |
|-----------|--------------|---------|
| 0 | CF | Header |
| 1-2 | 00 00 | Reserved |
| 3 | 01 | Packet type |
| 4-9 | ... | Internal data |
| 10 | 0C (=12) | EPC Length (bytes) |
| 11 đến 11+len | E2 80 69 15... | EPC Data |
| 11+len | rssi raw | RSSI (signed byte) |
| 11+len+1 | checksum | Checksum |

### Packet status/heartbeat (bỏ qua)

```
CF 00 00 89 01 02 98 B2  ← Type 0x89 = status, không phải EPC
```

### EPC thực tế đọc được (13 thẻ)

```
Tag 01: E2 80 69 15 00 00 50 1E CC 01 0D 3D  (RSSI: -56)
Tag 02: E2 80 69 15 00 00 40 1E CC 01 11 3D  (RSSI: -42)
Tag 03: 30 34 30 03 98 0F 7C 00 00 00 01 A8  (RSSI: -70)
Tag 04: 30 34 0B 9D 90 18 0E 4A B4 1D DE 99  (RSSI: -68)
Tag 05: 00 B0 7A 15 00 0F 9F EF 88 00 02 EC  (RSSI: -78)
Tag 06: 30 34 0C 11 9C 38 B9 70 15 00 79 87  (RSSI: -72)
Tag 07: 30 34 0C 11 9C 23 95 B0 14 3F 13 8E  (RSSI: -76)
```

---

## 4. Kiến trúc hệ thống tổng quan

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   📱 Mobile App              🌐 Web App             │
│   (Expo React Native)        (Next.js)              │
│                                                     │
│   - Kết nối BLE ST-H103      - Quản lý tags         │
│   - Quét inventory           - Đổi tên hàng loạt    │
│   - Xem báo cáo realtime     - Import/Export Excel  │
│   - Offline mode             - Lịch sử phiên quét   │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │  REST API + WebSocket
                   ▼
┌─────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)             │
│                                                     │
│   POST /api/tags/bulk    ← Đổi tên hàng loạt        │
│   GET  /api/tags         ← Lấy danh sách tags       │
│   POST /api/sessions     ← Lưu phiên quét           │
│   WS   /ws               ← Realtime sync            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Database (PostgreSQL + Prisma)          │
│                                                     │
│   tags         (epc, name, category, location)      │
│   scan_sessions (id, name, startedAt, endedAt)      │
│   scans        (tagEpc, sessionId, rssi, time)      │
└─────────────────────────────────────────────────────┘
```

### Flow hoạt động

```
[Web App] Đặt tên cho EPC
    ↓ POST /api/tags/bulk
[Backend] Lưu vào DB
    ↓ WebSocket broadcast
[Mobile App] Nhận tên mới realtime
    ↓
[Mobile App] Quét BLE → ST-H103
    ↓ EPC nhận được → match với tên từ server
[Mobile App] Hiển thị tên thay vì EPC hex
    ↓ Kết thúc phiên
[Backend] Lưu scan session
    ↓
[Web App] Xem báo cáo, xuất Excel
```

---

## 5. Phase 1 — Backend API

### Stack

```
Node.js + Express + TypeScript
PostgreSQL + Prisma ORM
JWT Authentication
Socket.io (WebSocket realtime)
```

### Cấu trúc thư mục

```
backend/
├── src/
│   ├── routes/
│   │   ├── tags.ts
│   │   ├── sessions.ts
│   │   └── auth.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── index.ts
├── .env
└── package.json
```

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tag {
  id          String   @id @default(uuid())
  epc         String   @unique
  name        String
  description String?
  category    String?
  location    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  scans       Scan[]
}

model Session {
  id          String    @id @default(uuid())
  name        String
  startedAt   DateTime  @default(now())
  endedAt     DateTime?
  totalTags   Int       @default(0)
  scans       Scan[]
}

model Scan {
  id        String   @id @default(uuid())
  tagEpc    String
  tag       Tag      @relation(fields: [tagEpc], references: [epc])
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  rssi      Int
  scannedAt DateTime @default(now())
}
```

### API Endpoints

```typescript
// GET    /api/tags              — Lấy tất cả tags
// POST   /api/tags              — Tạo tag mới
// PATCH  /api/tags/:epc         — Cập nhật 1 tag
// PATCH  /api/tags/bulk         — Cập nhật hàng loạt ⭐
// DELETE /api/tags/:epc         — Xóa tag

// POST   /api/sessions          — Tạo phiên quét mới
// POST   /api/sessions/:id/scans — Thêm kết quả quét
// GET    /api/sessions          — Lấy lịch sử phiên
// GET    /api/sessions/:id      — Chi tiết 1 phiên

// Body bulk update:
// PATCH /api/tags/bulk
// [
//   { "epc": "E2 80 69 15...", "name": "Hàng A - Kệ 1" },
//   { "epc": "30 34 0B 9D...", "name": "Hàng B - Kệ 2" }
// ]
```

### Setup & Deploy

```bash
# Cài đặt
npm init -y
npm install express prisma @prisma/client socket.io jsonwebtoken bcrypt
npm install -D typescript @types/express ts-node

# Khởi tạo Prisma
npx prisma init
npx prisma migrate dev --name init
npx prisma generate

# Deploy miễn phí
# Option 1: Railway.app
# Option 2: Render.com
# Option 3: Supabase (PostgreSQL) + Vercel (API)
```

---

## 6. Phase 2 — Web App

### Stack

```
Next.js 14 + TypeScript
TailwindCSS
React Query (@tanstack/react-query)
TanStack Table (bảng dữ liệu lớn)
xlsx (import/export Excel)
```

### Cấu trúc thư mục

```
web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← Dashboard
│   ├── tags/
│   │   ├── page.tsx          ← Bảng tags + bulk edit
│   │   └── import/page.tsx   ← Import Excel
│   ├── sessions/
│   │   └── page.tsx          ← Lịch sử quét
│   └── reports/
│       └── page.tsx          ← Báo cáo + xuất Excel
├── components/
│   ├── TagTable.tsx
│   ├── BulkEditModal.tsx
│   └── ImportExcel.tsx
└── lib/
    └── api.ts
```

### Tính năng màn hình Tags

```
┌──────────────────────────────────────────────────────────┐
│  🏷 Quản lý Tags RFID        [+ Thêm] [📥 Import Excel] │
│                                                          │
│  🔍 Tìm kiếm: [___________]  Lọc: [Tất cả ▼]           │
│                                                          │
│  ☑  EPC                  Tên hiển thị    Danh mục  Vị trí│
│  ☑  E2 80 69 15 00 00..  [Áo len đỏ  ]  Quần áo   Kệ A1 │
│  ☑  30 34 0B 9D 90 18..  [Quần jean  ]  Quần áo   Kệ A2 │
│  □   00 B0 7A 15 00 0F..  [___________]  -          -    │
│                                                          │
│  ✅ Đã chọn: 2 tags                                      │
│  [✏️ Sửa hàng loạt]  [🗑 Xóa]  [📤 Xuất Excel]         │
└──────────────────────────────────────────────────────────┘
```

### Import/Export Excel workflow

```
Export template:
  Web App → tạo file Excel với cột: EPC | Tên | Danh mục | Vị trí
  
User điền tên:
  | E2 80 69 15... | Áo len đỏ size M | Quần áo | Kệ A1 |
  | 30 34 0B 9D... | Quần jean nam    | Quần áo | Kệ A2 |

Import lại:
  Web App đọc Excel → PATCH /api/tags/bulk → DB cập nhật
  → Mobile app tự động nhận tên mới qua WebSocket
```

---

## 7. Phase 3 — Mobile App Expo

### Stack

```
Expo (React Native) + TypeScript
react-native-ble-plx (BLE)
Zustand (state management)
@react-navigation/bottom-tabs
@react-native-async-storage/async-storage
expo-sharing + expo-file-system (xuất file)
```

### Setup project

```bash
# Tạo project
npx create-expo-app RFIDInventory --template blank-typescript
cd RFIDInventory

# Cài dependencies
npm install react-native-ble-plx
npm install zustand
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npx expo install expo-sharing expo-file-system

# Build development client (BLE không chạy trên Expo Go)
npx eas login
npx eas build:configure
npx eas build --profile development --platform android
```

### Cấu hình app.json

```json
{
  "expo": {
    "name": "RFID Kho Hàng",
    "slug": "rfid-inventory",
    "version": "1.0.0",
    "android": {
      "package": "com.rfid.inventory",
      "permissions": [
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    "plugins": [
      ["react-native-ble-plx", {
        "isBackgroundEnabled": false,
        "bluetoothAlwaysPermission": "Cần Bluetooth để kết nối RFID reader"
      }]
    ]
  }
}
```

### Cấu trúc thư mục Mobile

```
src/
├── constants/
│   └── ble.ts              ← UUID đã xác nhận
├── services/
│   ├── BLEService.ts       ← Kết nối BLE
│   ├── RFIDParser.ts       ← Parse packet CF...
│   └── SyncService.ts      ← Sync với backend
├── store/
│   ├── inventoryStore.ts   ← Zustand: tags, tên
│   └── bleStore.ts         ← Zustand: trạng thái BLE
├── screens/
│   ├── KetNoiScreen.tsx    ← Tìm & kết nối BLE
│   ├── QuetTheScreen.tsx   ← Quét + xem tên
│   └── KhoHangScreen.tsx   ← Danh sách inventory
└── App.tsx
```

### File constants/ble.ts

```typescript
// src/constants/ble.ts
// ✅ UUID đã xác nhận 100% từ nRF Connect

export const BLE_CONFIG = {
  // Lọc thiết bị theo tên
  DEVICE_NAME_KEYWORDS: ['UHF', 'RFID', 'ST-H103'],
  MAC_ADDRESS: 'E0:4E:7A:F3:78:56',

  // Service chính
  SERVICE_UUID:     '0000FFE0-0000-1000-8000-00805F9B34FB',

  // Characteristic để GỬI lệnh
  CHAR_WRITE_UUID:  '0000FFE3-0000-1000-8000-00805F9B34FB',

  // Characteristic để NHẬN data EPC
  CHAR_NOTIFY_UUID: '0000FFE4-0000-1000-8000-00805F9B34FB',

  // Lệnh điều khiển (đã test thành công)
  COMMANDS: {
    START_INVENTORY: [0xBB, 0x00, 0x27, 0x00, 0x03, 0x22, 0x00, 0x00, 0x4A, 0x7E],
    STOP_INVENTORY:  [0xBB, 0x00, 0x28, 0x00, 0x00, 0x28, 0x7E],
  }
};
```

### File services/RFIDParser.ts

```typescript
// src/services/RFIDParser.ts
import { Buffer } from 'buffer';

export interface RFIDTag {
  epc: string;   // Ví dụ: "E2 80 69 15 00 00 40 1E CC 01 11 3D"
  rssi: number;  // Ví dụ: -42
}

export class RFIDParser {
  private buffer: number[] = [];

  /**
   * Feed base64 data từ BLE notify
   * Trả về các tag EPC đọc được
   *
   * Format packet ST-H103:
   * [CF][00][00][type][??][??][??][??][??][??][epcLen][epc bytes...][rssi][checksum]
   *  0   1   2   3                              10     11...
   */
  feed(base64: string): RFIDTag[] {
    const bytes = [...Buffer.from(base64, 'base64')];
    this.buffer.push(...bytes);

    const tags: RFIDTag[] = [];

    while (this.buffer.length >= 7) {
      // Tìm header CF
      const idx = this.buffer.indexOf(0xCF);
      if (idx === -1) { this.buffer = []; break; }
      if (idx > 0) this.buffer = this.buffer.slice(idx);
      if (this.buffer.length < 11) break;

      // Type 0x89 = status/heartbeat → bỏ qua
      if (this.buffer[3] === 0x89) {
        this.buffer = this.buffer.slice(8);
        continue;
      }

      const epcLen = this.buffer[10];

      // Validate EPC length
      if (epcLen === 0 || epcLen > 32) {
        this.buffer = this.buffer.slice(1);
        continue;
      }

      const totalLen = 11 + epcLen + 2;
      if (this.buffer.length < totalLen) break;

      // Extract EPC
      const epcBytes = this.buffer.slice(11, 11 + epcLen);
      const epc = epcBytes
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');

      // RSSI (signed byte)
      const rssiRaw = this.buffer[11 + epcLen];
      const rssi = rssiRaw > 127 ? rssiRaw - 256 : rssiRaw;

      tags.push({ epc, rssi });
      this.buffer = this.buffer.slice(totalLen);
    }

    return tags;
  }

  reset() {
    this.buffer = [];
  }
}
```

### File services/BLEService.ts

```typescript
// src/services/BLEService.ts
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';
import { BLE_CONFIG } from '../constants/ble';
import { RFIDParser, RFIDTag } from './RFIDParser';

class BLEService {
  private manager = new BleManager();
  private device: Device | null = null;
  private subscription: Subscription | null = null;
  private parser = new RFIDParser();

  async xinQuyen(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(granted).every(
      v => v === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  quetThietBi(
    onTimThay: (device: Device) => void,
    onLoi: (error: Error) => void
  ): void {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) { onLoi(error); return; }
      if (!device) return;
      const ten = device.name || device.localName || '';
      const timThay = BLE_CONFIG.DEVICE_NAME_KEYWORDS
        .some(kw => ten.includes(kw));
      if (timThay) {
        this.manager.stopDeviceScan();
        onTimThay(device);
      }
    });
  }

  dungQuetThietBi() {
    this.manager.stopDeviceScan();
  }

  async ketNoi(
    device: Device,
    onTagDoc: (tag: RFIDTag) => void
  ): Promise<void> {
    this.device = await device.connect();
    await this.device.discoverAllServicesAndCharacteristics();

    // Subscribe FFE4 để nhận data
    this.subscription = this.device.monitorCharacteristicForService(
      BLE_CONFIG.SERVICE_UUID,
      BLE_CONFIG.CHAR_NOTIFY_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const tags = this.parser.feed(characteristic.value);
        tags.forEach(onTagDoc);
      }
    );
  }

  async ngat(): Promise<void> {
    this.subscription?.remove();
    await this.device?.cancelConnection();
    this.device = null;
    this.parser.reset();
  }

  // Gửi lệnh Start Inventory vào FFE3
  async batDauQuet(): Promise<void> {
    if (!this.device) throw new Error('Chưa kết nối');
    const data = Buffer.from(BLE_CONFIG.COMMANDS.START_INVENTORY);
    await this.device.writeCharacteristicWithResponseForService(
      BLE_CONFIG.SERVICE_UUID,
      BLE_CONFIG.CHAR_WRITE_UUID,
      data.toString('base64')
    );
  }

  // Gửi lệnh Stop Inventory vào FFE3
  async dungQuet(): Promise<void> {
    if (!this.device) return;
    const data = Buffer.from(BLE_CONFIG.COMMANDS.STOP_INVENTORY);
    await this.device.writeCharacteristicWithResponseForService(
      BLE_CONFIG.SERVICE_UUID,
      BLE_CONFIG.CHAR_WRITE_UUID,
      data.toString('base64')
    );
  }

  daKetNoi(): boolean {
    return this.device !== null;
  }
}

export default new BLEService();
```

### File services/SyncService.ts

```typescript
// src/services/SyncService.ts
// Đồng bộ tên tags giữa server và mobile

const API_URL = 'https://your-backend.com/api'; // Thay bằng URL thực

class SyncService {

  // Tải tên tags từ server về local
  async pullTags(): Promise<Record<string, string>> {
    const res = await fetch(`${API_URL}/tags`);
    const tags = await res.json();
    // Trả về map: { "EPC hex": "Tên hiển thị" }
    return Object.fromEntries(
      tags.map((t: any) => [t.epc, t.name])
    );
  }

  // Gửi kết quả phiên quét lên server
  async pushSession(session: {
    name: string;
    scans: { epc: string; rssi: number; time: Date }[];
  }): Promise<void> {
    await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
  }
}

export default new SyncService();
```

### File store/inventoryStore.ts

```typescript
// src/store/inventoryStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TagItem {
  epc: string;
  tenHienThi: string;   // Tên lấy từ server hoặc tự đặt
  rssi: number;
  soLanQuet: number;
  lanQuetDau: Date;
  lanQuetCuoi: Date;
  coMat: boolean;
}

interface InventoryState {
  tags: Record<string, TagItem>;
  tenTuServer: Record<string, string>; // EPC → Tên từ server

  themHoacCapNhatTag: (epc: string, rssi: number) => void;
  capNhatTenTuServer: (tenMap: Record<string, string>) => void;
  doiTen: (epc: string, tenMoi: string) => void;
  batDauPhienMoi: () => void;
  xoaTatCa: () => void;
  luuVaoBo: () => Promise<void>;
  taiTuBo: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  tags: {},
  tenTuServer: {},

  themHoacCapNhatTag: (epc, rssi) => set(state => {
    const tenServer = state.tenTuServer[epc];
    const tagCu = state.tags[epc];
    return {
      tags: {
        ...state.tags,
        [epc]: tagCu ? {
          ...tagCu,
          rssi,
          soLanQuet: tagCu.soLanQuet + 1,
          lanQuetCuoi: new Date(),
          coMat: true,
        } : {
          epc,
          tenHienThi: tenServer || `Thẻ chưa đặt tên`,
          rssi,
          soLanQuet: 1,
          lanQuetDau: new Date(),
          lanQuetCuoi: new Date(),
          coMat: true,
        }
      }
    };
  }),

  capNhatTenTuServer: (tenMap) => set(state => {
    // Cập nhật tên cho các tag đã có
    const tagsCapNhat = { ...state.tags };
    Object.entries(tenMap).forEach(([epc, ten]) => {
      if (tagsCapNhat[epc]) {
        tagsCapNhat[epc] = { ...tagsCapNhat[epc], tenHienThi: ten };
      }
    });
    return { tags: tagsCapNhat, tenTuServer: tenMap };
  }),

  doiTen: (epc, tenMoi) => set(state => ({
    tags: { ...state.tags, [epc]: { ...state.tags[epc], tenHienThi: tenMoi } }
  })),

  batDauPhienMoi: () => set(state => {
    const tagsCapNhat = Object.fromEntries(
      Object.entries(state.tags).map(([k, v]) => [k, { ...v, coMat: false }])
    );
    return { tags: tagsCapNhat };
  }),

  xoaTatCa: () => set({ tags: {} }),

  luuVaoBo: async () => {
    await AsyncStorage.setItem('rfid_tags', JSON.stringify(get().tags));
  },

  taiTuBo: async () => {
    const raw = await AsyncStorage.getItem('rfid_tags');
    if (raw) set({ tags: JSON.parse(raw) });
  },
}));
```

### File store/bleStore.ts

```typescript
// src/store/bleStore.ts
import { create } from 'zustand';
import { Device } from 'react-native-ble-plx';

interface BLEState {
  trangThai: 'chua_ket_noi' | 'dang_quet' | 'da_ket_noi' | 'loi';
  thietBiTimThay: Device[];
  thietBiDaKetNoi: Device | null;
  dangQuetInventory: boolean;

  setTrangThai: (tt: BLEState['trangThai']) => void;
  themThietBi: (device: Device) => void;
  setThietBiKetNoi: (device: Device | null) => void;
  setDangQuet: (dang: boolean) => void;
  xoaDanhSachThietBi: () => void;
}

export const useBLEStore = create<BLEState>((set) => ({
  trangThai: 'chua_ket_noi',
  thietBiTimThay: [],
  thietBiDaKetNoi: null,
  dangQuetInventory: false,

  setTrangThai: tt => set({ trangThai: tt }),
  themThietBi: device => set(state => ({
    thietBiTimThay: [
      ...state.thietBiTimThay.filter(d => d.id !== device.id),
      device
    ]
  })),
  setThietBiKetNoi: device => set({ thietBiDaKetNoi: device }),
  setDangQuet: dang => set({ dangQuetInventory: dang }),
  xoaDanhSachThietBi: () => set({ thietBiTimThay: [] }),
}));
```

### File screens/KetNoiScreen.tsx

```typescript
// src/screens/KetNoiScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import BLEService from '../services/BLEService';
import SyncService from '../services/SyncService';
import { useBLEStore } from '../store/bleStore';
import { useInventoryStore } from '../store/inventoryStore';

export default function KetNoiScreen({ navigation }: any) {
  const [dangTimKiem, setDangTimKiem] = useState(false);
  const [dangKetNoi, setDangKetNoi] = useState(false);

  const { thietBiTimThay, themThietBi, setThietBiKetNoi,
          setTrangThai, xoaDanhSachThietBi } = useBLEStore();
  const { themHoacCapNhatTag, capNhatTenTuServer } = useInventoryStore();

  const batDauTim = async () => {
    const coQuyen = await BLEService.xinQuyen();
    if (!coQuyen) {
      Alert.alert('Cần cấp quyền Bluetooth và Location');
      return;
    }
    xoaDanhSachThietBi();
    setDangTimKiem(true);

    BLEService.quetThietBi(
      device => themThietBi(device),
      error => {
        setDangTimKiem(false);
        Alert.alert('Lỗi Bluetooth', error.message);
      }
    );

    setTimeout(() => {
      BLEService.dungQuetThietBi();
      setDangTimKiem(false);
    }, 10000);
  };

  const ketNoiVao = async (device: Device) => {
    setDangKetNoi(true);
    try {
      // Pull tên tags từ server trước
      try {
        const tenMap = await SyncService.pullTags();
        capNhatTenTuServer(tenMap);
      } catch {
        // Offline mode — dùng tên local
      }

      await BLEService.ketNoi(device, tag => {
        themHoacCapNhatTag(tag.epc, tag.rssi);
      });

      setThietBiKetNoi(device);
      setTrangThai('da_ket_noi');
      navigation.navigate('QuetThe');
    } catch (e: any) {
      Alert.alert('Không kết nối được', e.message);
    } finally {
      setDangKetNoi(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tieuDe}>🔍 Tìm RFID Reader</Text>

      <TouchableOpacity
        style={[styles.nut, dangTimKiem && styles.nutMo]}
        onPress={batDauTim}
        disabled={dangTimKiem || dangKetNoi}
      >
        {dangTimKiem
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.textNut}>📡 Quét Bluetooth</Text>
        }
      </TouchableOpacity>

      {thietBiTimThay.length === 0 && !dangTimKiem && (
        <Text style={styles.huongDan}>
          Nhấn "Quét Bluetooth" để tìm thiết bị.{'\n'}
          Đảm bảo RFID reader ST-H103 đã bật nguồn.
        </Text>
      )}

      <FlatList
        data={thietBiTimThay}
        keyExtractor={d => d.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.thietBiItem}
            onPress={() => ketNoiVao(item)}
          >
            <View>
              <Text style={styles.tenThietBi}>
                {item.name || 'ST-H103 RFID Reader'}
              </Text>
              <Text style={styles.macText}>{item.id}</Text>
              <Text style={styles.rssiText}>RSSI: {item.rssi} dBm</Text>
            </View>
            <Text style={styles.nutKetNoi}>
              {dangKetNoi ? '...' : 'Kết nối →'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0a1a', padding: 16 },
  tieuDe:       { fontSize: 22, fontWeight: 'bold', color: '#4dd0e1',
                  marginBottom: 20, textAlign: 'center' },
  nut:          { backgroundColor: '#1976D2', padding: 14, borderRadius: 10,
                  alignItems: 'center', marginBottom: 20 },
  nutMo:        { backgroundColor: '#555' },
  textNut:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  huongDan:     { color: '#666', textAlign: 'center', marginTop: 40,
                  lineHeight: 24 },
  thietBiItem:  { backgroundColor: '#1a1a2e', padding: 14, borderRadius: 10,
                  marginBottom: 10, flexDirection: 'row',
                  justifyContent: 'space-between', alignItems: 'center',
                  borderWidth: 1, borderColor: '#2a2a4e' },
  tenThietBi:   { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  macText:      { color: '#888', fontSize: 12 },
  rssiText:     { color: '#4dd0e1', fontSize: 12 },
  nutKetNoi:    { color: '#4dd0e1', fontWeight: 'bold' },
});
```

### File screens/QuetTheScreen.tsx

```typescript
// src/screens/QuetTheScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Modal, Alert
} from 'react-native';
import BLEService from '../services/BLEService';
import SyncService from '../services/SyncService';
import { useBLEStore } from '../store/bleStore';
import { useInventoryStore, TagItem } from '../store/inventoryStore';

export default function QuetTheScreen() {
  const { dangQuetInventory, setDangQuet } = useBLEStore();
  const { tags, doiTen, batDauPhienMoi, luuVaoBo } = useInventoryStore();
  const [tagChon, setTagChon] = useState<TagItem | null>(null);
  const [tenMoi, setTenMoi] = useState('');
  const [hienModal, setHienModal] = useState(false);

  const danhSach = Object.values(tags).sort(
    (a, b) => b.lanQuetCuoi.getTime() - a.lanQuetCuoi.getTime()
  );

  const batDauQuet = async () => {
    batDauPhienMoi();
    await BLEService.batDauQuet();
    setDangQuet(true);
  };

  const dungQuet = async () => {
    await BLEService.dungQuet();
    setDangQuet(false);
    await luuVaoBo();

    // Gửi kết quả lên server
    try {
      await SyncService.pushSession({
        name: `Kiểm kho ${new Date().toLocaleDateString('vi-VN')}`,
        scans: danhSach
          .filter(t => t.coMat)
          .map(t => ({ epc: t.epc, rssi: t.rssi, time: t.lanQuetCuoi }))
      });
    } catch {
      Alert.alert('Lưu offline', 'Sẽ đồng bộ khi có mạng');
    }
  };

  const mauRSSI = (rssi: number) => {
    if (rssi > -60) return '#4CAF50';
    if (rssi > -75) return '#FF9800';
    return '#f44336';
  };

  return (
    <View style={styles.container}>
      {/* Thống kê */}
      <View style={styles.thongKe}>
        <View style={styles.soThongKe}>
          <Text style={styles.soLon}>{danhSach.length}</Text>
          <Text style={styles.nhan}>Tổng thẻ</Text>
        </View>
        <View style={styles.soThongKe}>
          <Text style={[styles.soLon, { color: '#4CAF50' }]}>
            {danhSach.filter(t => t.coMat).length}
          </Text>
          <Text style={styles.nhan}>Có mặt</Text>
        </View>
        <View style={styles.soThongKe}>
          <Text style={[styles.soLon, { color: '#f44336' }]}>
            {danhSach.filter(t => !t.coMat).length}
          </Text>
          <Text style={styles.nhan}>Vắng mặt</Text>
        </View>
      </View>

      {/* Nút quét */}
      <TouchableOpacity
        style={[styles.nutQuet, dangQuetInventory && styles.nutDung]}
        onPress={dangQuetInventory ? dungQuet : batDauQuet}
      >
        <Text style={styles.textNutQuet}>
          {dangQuetInventory ? '⏹  Dừng quét' : '▶  Bắt đầu quét'}
        </Text>
      </TouchableOpacity>

      {/* Danh sách */}
      <FlatList
        data={danhSach}
        keyExtractor={item => item.epc}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.theTag}
            onLongPress={() => {
              setTagChon(item);
              setTenMoi(item.tenHienThi);
              setHienModal(true);
            }}
          >
            <View style={styles.dongDau}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.dot, {
                  backgroundColor: item.coMat ? '#4CAF50' : '#f44336'
                }]} />
                <Text style={styles.tenTag}>{item.tenHienThi}</Text>
              </View>
              <Text style={{ color: mauRSSI(item.rssi), fontSize: 13 }}>
                {item.rssi} dBm
              </Text>
            </View>
            <Text style={styles.epcText}>{item.epc}</Text>
            <Text style={styles.textPhu}>
              {item.coMat ? '✅ Có mặt' : '❌ Vắng mặt'} · {item.soLanQuet} lần quét
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.troung}>
            {dangQuetInventory ? '🔍 Đang tìm thẻ...' : '📭 Nhấn "Bắt đầu quét"'}
          </Text>
        }
      />

      {/* Modal đổi tên */}
      <Modal visible={hienModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.tieuDeModal}>✏️ Đổi tên thẻ</Text>
            <Text style={styles.epcModal}>{tagChon?.epc}</Text>
            <TextInput
              style={styles.input}
              value={tenMoi}
              onChangeText={setTenMoi}
              placeholder="Nhập tên mới..."
              placeholderTextColor="#666"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.nutModal, { backgroundColor: '#333' }]}
                onPress={() => setHienModal(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nutModal, { backgroundColor: '#4dd0e1' }]}
                onPress={() => {
                  if (tagChon && tenMoi.trim()) {
                    doiTen(tagChon.epc, tenMoi.trim());
                    setHienModal(false);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>💾 Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a1a', padding: 12 },
  thongKe:     { flexDirection: 'row', backgroundColor: '#1a1a2e',
                 borderRadius: 12, padding: 16, marginBottom: 12,
                 justifyContent: 'space-around' },
  soThongKe:   { alignItems: 'center' },
  soLon:       { fontSize: 28, fontWeight: 'bold', color: '#4dd0e1' },
  nhan:        { color: '#888', fontSize: 12, marginTop: 2 },
  nutQuet:     { backgroundColor: '#4CAF50', borderRadius: 12,
                 padding: 16, alignItems: 'center', marginBottom: 12 },
  nutDung:     { backgroundColor: '#f44336' },
  textNutQuet: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  theTag:      { backgroundColor: '#1a1a2e', borderRadius: 10,
                 padding: 12, marginBottom: 8, borderWidth: 1,
                 borderColor: '#2a2a4e' },
  dongDau:     { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center' },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  tenTag:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  epcText:     { color: '#4dd0e1', fontSize: 11, marginTop: 4,
                 fontFamily: 'monospace' },
  textPhu:     { color: '#666', fontSize: 12, marginTop: 4 },
  troung:      { color: '#555', textAlign: 'center', marginTop: 60, fontSize: 16 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
                 justifyContent: 'flex-end' },
  modal:       { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20,
                 borderTopRightRadius: 20, padding: 24 },
  tieuDeModal: { color: '#4dd0e1', fontSize: 18, fontWeight: 'bold',
                 marginBottom: 8 },
  epcModal:    { color: '#555', fontSize: 11, marginBottom: 16,
                 fontFamily: 'monospace' },
  input:       { backgroundColor: '#0a0a1a', color: '#fff', borderRadius: 8,
                 padding: 12, fontSize: 16, marginBottom: 16,
                 borderWidth: 1, borderColor: '#4dd0e1' },
  nutModal:    { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
});
```

### File App.tsx

```typescript
// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useInventoryStore } from './src/store/inventoryStore';
import KetNoiScreen from './src/screens/KetNoiScreen';
import QuetTheScreen from './src/screens/QuetTheScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const taiTuBo = useInventoryStore(s => s.taiTuBo);

  useEffect(() => {
    taiTuBo(); // Load dữ liệu đã lưu khi mở app
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle:          { backgroundColor: '#0a0a1a' },
          headerTintColor:      '#4dd0e1',
          tabBarStyle:          { backgroundColor: '#0a0a1a', borderTopColor: '#1a1a2e' },
          tabBarActiveTintColor:   '#4dd0e1',
          tabBarInactiveTintColor: '#555',
        }}
      >
        <Tab.Screen
          name="KetNoi"
          component={KetNoiScreen}
          options={{ title: '🔌 Kết nối' }}
        />
        <Tab.Screen
          name="QuetThe"
          component={QuetTheScreen}
          options={{ title: '📡 Quét thẻ' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### Build & Deploy Mobile

```bash
# 1. Đăng nhập Expo
npx eas login

# 2. Config EAS
npx eas build:configure

# 3. Build APK Android để test
npx eas build --profile development --platform android

# 4. Cài APK lên điện thoại, sau đó chạy dev server
npx expo start --dev-client
```

---

## 8. Timeline thực hiện

```
TUẦN 1 — Backend
  □ Setup Node.js + PostgreSQL + Prisma
  □ CRUD API cho tags
  □ Bulk update API
  □ Sessions/Scans API
  □ Deploy lên Railway hoặc Render (miễn phí)

TUẦN 2 — Web App
  □ Setup Next.js + TailwindCSS
  □ Bảng tags có thể edit inline
  □ Bulk edit modal
  □ Import/Export Excel
  □ Lịch sử phiên quét

TUẦN 3 — Mobile App
  □ Setup Expo + EAS
  □ BLE kết nối ST-H103 (UUID đã confirmed)
  □ Parser packet CF → EPC
  □ Hiển thị tên từ server
  □ Quét inventory + đổi tên
  □ Push kết quả lên server

TUẦN 4 — Tích hợp & Hoàn thiện
  □ Test end-to-end toàn bộ flow
  □ Realtime sync WebSocket
  □ Xử lý offline mode
  □ Build APK production
  □ Báo cáo xuất Excel
```

---

## Ghi chú quan trọng

### BLE đã test thành công
- Gửi `BB 00 27 00 03 22 00 00 4A 7E` vào **FFE3** → Reader bắt đầu quét
- **FFE4** trả về packet với header `CF` chứa EPC data
- Packet status `CF 00 00 89 ...` cần bỏ qua trong parser

### Khi gặp vấn đề BLE
```
Lỗi thường gặp:
1. "Permission denied" → Cần cấp quyền BLUETOOTH_SCAN + LOCATION
2. Không tìm thấy thiết bị → Kiểm tra reader đã bật nguồn chưa
3. Data không parse được → Kiểm tra lại byte index 10 là EPC length
4. BLE không chạy → Phải build Development Client, không dùng Expo Go
```

### Thứ tự ưu tiên
```
1. Backend API (cả web và mobile đều cần)
2. Mobile App (vì đã có đủ UUID + lệnh)
3. Web App (dùng để quản lý tên tags)
```

---

*Tài liệu tổng hợp từ quá trình thảo luận và test thực tế với thiết bị ST-H103*
