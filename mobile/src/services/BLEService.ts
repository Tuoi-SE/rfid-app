// src/services/BLEService.ts
// Giờ dùng Bluetooth Classic SPP (Serial Port Profile) thay cho BLE
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';
import { BLE_CONFIG } from '../constants/ble';

export interface RFIDTag {
  epc: string;
  rssi: number;
}

class BTClassicService {
  private device: BluetoothDevice | null = null;
  private readSubscription: any = null;
  private isScanning = false;
  private rawBuffer: number[] = [];

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

  /**
   * Quét thiết bị Bluetooth Classic đã paired
   */
  async quetThietBiClassic(
    onTimThay: (device: any) => void,
    onLoi: (error: Error) => void
  ): Promise<void> {
    try {
      // Lấy danh sách thiết bị đã paired
      const pairedDevices = await RNBluetoothClassic.getBondedDevices();
      console.log('[BT] Paired devices:', pairedDevices.length);
      for (const d of pairedDevices) {
        console.log('[BT] Paired:', d.name, d.address);
        // Tạo device-like object tương thích với UI
        onTimThay({
          id: d.address,
          name: d.name || 'Unknown',
          localName: d.name,
          rssi: null,
          _btDevice: d, // Giữ reference device gốc
        });
      }

      // Cũng bắt đầu discovery tìm thiết bị mới
      console.log('[BT] Starting discovery...');
      const discovered = await RNBluetoothClassic.startDiscovery();
      console.log('[BT] Discovery found:', discovered.length);
      for (const d of discovered) {
        console.log('[BT] Found:', d.name, d.address);
        onTimThay({
          id: d.address,
          name: d.name || 'Unknown',
          localName: d.name,
          rssi: null,
          _btDevice: d,
        });
      }
    } catch (e: any) {
      console.log('[BT] Scan error:', e.message);
      onLoi(e);
    }
  }

  dungQuetThietBi() {
    try {
      RNBluetoothClassic.cancelDiscovery();
    } catch { }
  }

  /**
   * Kết nối Bluetooth Classic SPP
   */
  async ketNoi(
    deviceInfo: any,
    onTagDoc: (tag: RFIDTag) => void
  ): Promise<void> {
    const address = deviceInfo.id || deviceInfo.address;
    console.log('[BT] ============================');
    console.log('[BT] Kết nối Classic SPP tới:', address);

    try {
      // Kết nối SPP
      this.device = await RNBluetoothClassic.connectToDevice(address, {
        delimiter: '', // Raw byte mode
      });
      console.log('[BT] ✅ Connected via SPP!');

      // Subscribe nhận data serial
      this.readSubscription = this.device.onDataReceived((data) => {
        // Data format can be base64 if set up in RNBluetoothClassic configuration
        this.handleSerialData(data.data, onTagDoc);
      });

      console.log('[BT] ✅ Listening for serial data...');
      console.log('[BT] ============================');
    } catch (e: any) {
      console.log('[BT] Connect failed:', e.message);
      throw e;
    }
  }

  /**
   * Xử lý data serial từ reader
   * Data đến dưới dạng bytes (BB protocol)
   */
  private handleSerialData(data: string, onTagDoc: (tag: RFIDTag) => void) {
    let bytes: number[];
    try {
      // Thử decode base64 native (nếu plugin gửi dạng base64)
      bytes = [...Buffer.from(data, 'base64')];
    } catch {
      bytes = data.split('').map(c => c.charCodeAt(0));
    }

    this.rawBuffer.push(...bytes);
    this.parsePackets(onTagDoc);

    // Giới hạn buffer để tránh rò rỉ bộ nhớ nếu packet bị lỗi
    if (this.rawBuffer.length > 8192) {
      this.rawBuffer = this.rawBuffer.slice(-2048);
    }
  }

  /**
   * Parse BB protocol packets từ serial buffer
   */
  private parsePackets(onTagDoc: (tag: RFIDTag) => void) {
    let safety = 0;
    while (this.rawBuffer.length >= 7 && safety++ < 100) {
      // Tìm BB header
      const bbIdx = this.rawBuffer.indexOf(0xBB);
      if (bbIdx === -1) {
        // Không có BB, tìm CF (mặc dù CF thường không mang EPC ở reader của user)
        const cfIdx = this.rawBuffer.indexOf(0xCF);
        if (cfIdx === -1) {
          this.rawBuffer = [];
          break;
        }
        if (cfIdx > 0) this.rawBuffer = this.rawBuffer.slice(cfIdx);
        if (this.rawBuffer.length >= 8) {
          this.rawBuffer = this.rawBuffer.slice(8); // Skip CF packet
          continue;
        }
        break;
      }

      if (bbIdx > 0) this.rawBuffer = this.rawBuffer.slice(bbIdx);
      if (this.rawBuffer.length < 7) break; // Cần ít nhất 7 bytes cho header+len

      const type = this.rawBuffer[1];
      const cmd = this.rawBuffer[2];
      const lenH = this.rawBuffer[3];
      const lenL = this.rawBuffer[4];
      const payloadLen = (lenH << 8) | lenL;
      const totalLen = 5 + payloadLen + 2; // header(5) + payload + checksum(1) + 0x7E(1)

      // Kiểm tra sanity: payload len quá lớn hoặc checksum không khớp?
      if (payloadLen > 1024) {
        // Payload vô lý, rớt header này
        this.rawBuffer.shift();
        continue;
      }

      // Chưa đủ dữ liệu để parse
      if (this.rawBuffer.length < totalLen) break;

      // Kiểm tra kí tự kết thúc 0x7E
      if (this.rawBuffer[totalLen - 1] !== 0x7E) {
        // Packet không hợp lệ
        this.rawBuffer.shift();
        continue;
      }

      // Tag data response: type=0x02, cmd=0x22 (inventory) or 0x27 (multi-read)
      if (type === 0x02 && (cmd === 0x22 || cmd === 0x27) && payloadLen >= 5) {
        const rssiRaw = this.rawBuffer[5];
        const rssi = rssiRaw > 127 ? rssiRaw - 256 : -rssiRaw;
        // PC = 2 bytes at offset 6,7
        const epcLen = payloadLen - 3; // minus RSSI(1) + PC(2)
        const epcStart = 8; // after header(5) + rssi(1) + pc(2)

        if (epcLen > 0 && epcLen <= 62) {
          const epcBytes = this.rawBuffer.slice(epcStart, epcStart + epcLen);
          const epc = epcBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
          onTagDoc({ epc, rssi });
        }
      }

      // Chuyển sang packet tiếp theo
      this.rawBuffer = this.rawBuffer.slice(totalLen);
    }
  }

  async ngat(): Promise<void> {
    this.isScanning = false;
    this.readSubscription?.remove?.();
    this.readSubscription = null;
    try {
      if (this.device) {
        await this.device.disconnect();
      }
    } catch { }
    this.device = null;
    this.rawBuffer = [];
  }

  async batDauQuet(): Promise<void> {
    if (!this.device) throw new Error('Chưa kết nối SPP');
    if (this.isScanning) return;
    this.isScanning = true;
    this.rawBuffer = [];

    const cmd = Buffer.from(BLE_CONFIG.COMMANDS.START_INVENTORY);
    console.log('[BT] Gửi START_INVENTORY qua SPP...');
    try {
      await this.device.write(cmd.toString('base64'), 'base64');
      console.log('[BT] ✅ START sent via SPP');
    } catch (e: any) {
      console.log('[BT] START error:', e.message);
    }
  }

  async dungQuet(): Promise<void> {
    if (!this.device) return;
    this.isScanning = false;
    const cmd = Buffer.from(BLE_CONFIG.COMMANDS.STOP_INVENTORY);
    console.log('[BT] Gửi STOP...');
    try {
      await this.device.write(cmd.toString('base64'), 'base64');
      console.log('[BT] ✅ STOP sent');
    } catch (e: any) {
      console.log('[BT] STOP error:', e.message);
    }
  }

  daKetNoi(): boolean {
    return this.device !== null;
  }
}

export default new BTClassicService();
