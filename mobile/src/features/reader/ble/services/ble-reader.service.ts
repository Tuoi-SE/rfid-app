import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';
import { BLE_CONFIG } from '../adapters/ble-config';
import { RFIDTag } from '../types';

const manager = new BleManager();

class BleReaderService {
  private device: Device | null = null;
  private notifySubscription: Subscription | null = null;
  private isScanning = false;
  private isConnecting = false;
  private rawBuffer: number[] = [];
  private onTagCallback: ((tag: RFIDTag) => void) | null = null;

  // Dedup: chỉ phát EPC 1 lần mỗi 2 giây, bỏ qua lần quét lặp
  private recentEPCs = new Map<string, number>();
  private readonly DEDUP_MS = 2000;

  private shouldEmitTag(epc: string): boolean {
    const now = Date.now();
    const lastSeen = this.recentEPCs.get(epc);
    if (lastSeen && now - lastSeen < this.DEDUP_MS) return false;
    this.recentEPCs.set(epc, now);
    // Dọn dẹp entry cũ khi map quá lớn
    if (this.recentEPCs.size > 500) {
      for (const [key, time] of this.recentEPCs) {
        if (now - time > this.DEDUP_MS) this.recentEPCs.delete(key);
      }
    }
    return true;
  }

  async requestPermissions(): Promise<boolean> {
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

  async scanDevices(
    onDeviceFound: (device: { id: string, name: string, rssi: number | null }) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const state = await manager.state();
      if (state !== 'PoweredOn') {
        await new Promise<void>((resolve) => {
          const sub = manager.onStateChange((newState) => {
            if (newState === 'PoweredOn') { sub.remove(); resolve(); }
          }, true);
          setTimeout(() => { sub.remove(); resolve(); }, 5000);
        });
      }

      const seen = new Set<string>();

      if (BLE_CONFIG.MAC_ADDRESS) {
        try {
          const knownDevices = await manager.devices([BLE_CONFIG.MAC_ADDRESS]);
          for (const d of knownDevices) {
            if (!seen.has(d.id)) {
              seen.add(d.id);
              onDeviceFound({ id: d.id, name: d.localName || d.name || 'RFID Reader (saved)', rssi: d.rssi });
            }
          }
        } catch {}
      }

      try {
        const connected = await manager.connectedDevices([BLE_CONFIG.SERVICE_UUID]);
        for (const d of connected) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            onDeviceFound({ id: d.id, name: (d.localName || d.name || 'Device') + ' (connected)', rssi: d.rssi });
          }
        }
      } catch {}

      console.log('[BLE] Starting scan...');
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          manager.stopDeviceScan();
          console.log('[BLE] Scan done, found', seen.size, 'devices');
          resolve();
        }, 10000);

        manager.startDeviceScan(null, { allowDuplicates: false }, (error, dev) => {
          if (error) { clearTimeout(timeout); onError(new Error(error.message)); resolve(); return; }
          if (dev && dev.id && !seen.has(dev.id)) {
            const name = dev.localName || dev.name || '';
            if (name) {
              seen.add(dev.id);
              onDeviceFound({ id: dev.id, name, rssi: dev.rssi });
            }
          }
        });
      });
    } catch (e: any) {
      onError(e);
    }
  }

  stopDeviceScan() {
    try { manager.stopDeviceScan(); } catch {}
  }

  async connect(deviceInfo: { id: string }, onTagRead: (tag: RFIDTag) => void): Promise<void> {
    const deviceId = deviceInfo.id;
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.onTagCallback = onTagRead;

    try {
      console.log('[BLE] Connecting to:', deviceId);
      manager.stopDeviceScan();
      await this.disconnect();
      await new Promise(r => setTimeout(r, 100));

      this.device = await manager.connectToDevice(deviceId, { timeout: 5000 });
      console.log('[BLE] ✅ Connected!');

      if (Platform.OS === 'android') {
        try {
          await this.device.requestMTU(512);
          console.log('[BLE] MTU 512 requested');
        } catch (mtuErr) {
          console.log('[BLE] MTU request not supported/failed, proceeding anyway', mtuErr);
        }
      }

      await this.device.discoverAllServicesAndCharacteristics();

      const services = await this.device.services();
      
      const targetService = services.find(s => s.uuid.toUpperCase().includes('FFE0'));
      if (targetService) {
        const chars = await targetService.characteristics();
        for (const ch of chars) {
          if (ch.isNotifiable || ch.isIndicatable) {
            console.log('[BLE] 📡 Subscribing:', ch.uuid);
            ch.monitor((error, characteristic) => {
              if (error) return;
              if (characteristic?.value && this.onTagCallback) {
                this.handleBLEData(characteristic.value, this.onTagCallback);
              }
            });
          }
        }
      } else {
        this.notifySubscription = this.device.monitorCharacteristicForService(
          BLE_CONFIG.SERVICE_UUID, BLE_CONFIG.CHAR_NOTIFY_UUID,
          (error, characteristic) => {
            if (error) return;
            if (characteristic?.value && this.onTagCallback) {
              this.handleBLEData(characteristic.value, this.onTagCallback);
            }
          }
        );
      }

      console.log('[BLE] ✅ Listening for RFID data');
    } catch (e: any) {
      console.log('[BLE] Connect failed:', e.message);
      this.device = null;
      throw e;
    } finally {
      this.isConnecting = false;
    }
  }

  private handleBLEData(base64Data: string, onTagRead: (tag: RFIDTag) => void) {
    if (!onTagRead) return;
    const bytes = [...Buffer.from(base64Data, 'base64')];
    this.rawBuffer.push(...bytes);
    this.parsePackets(onTagRead);
    if (this.rawBuffer.length > 8192) {
      this.rawBuffer = this.rawBuffer.slice(-2048);
    }
  }

  private parsePackets(onTagRead: (tag: RFIDTag) => void) {
    let safety = 0;
    while (this.rawBuffer.length >= 5 && safety++ < 100) {
      const cfIdx = this.rawBuffer.indexOf(0xCF);
      const bbIdx = this.rawBuffer.indexOf(0xBB);
      
      let startIdx = -1;
      let protocol = '';
      if (cfIdx !== -1 && bbIdx !== -1) {
        startIdx = Math.min(cfIdx, bbIdx);
        protocol = startIdx === cfIdx ? 'CF' : 'BB';
      } else if (cfIdx !== -1) {
        startIdx = cfIdx;
        protocol = 'CF';
      } else if (bbIdx !== -1) {
        startIdx = bbIdx;
        protocol = 'BB';
      }

      if (startIdx === -1) {
        this.rawBuffer = [];
        break;
      }

      if (startIdx > 0) {
        this.rawBuffer = this.rawBuffer.slice(startIdx);
      }

      if (this.rawBuffer.length < 5) break;

      if (protocol === 'CF') {
        const cmd = this.rawBuffer[3];
        const len = this.rawBuffer[4];
        const totalLen = 5 + len + 2;

        if (this.rawBuffer.length < totalLen) break;

        if (cmd === 0x01 && len >= 6) { 
           const rssiHigh = this.rawBuffer[6];
           const rssiLow = this.rawBuffer[7];
           let rssiRaw = (rssiHigh << 8) | rssiLow;
           if (rssiRaw > 32767) rssiRaw -= 65536;
           const rssi = Math.round(rssiRaw / 10);
           
           const epcLen = this.rawBuffer[10];
           if (epcLen > 0 && 11 + epcLen <= totalLen - 2) {
             const epcBytes = this.rawBuffer.slice(11, 11 + epcLen);
             const epc = epcBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
             if (this.shouldEmitTag(epc)) onTagRead({ epc, rssi });
           }
        }
        this.rawBuffer = this.rawBuffer.slice(totalLen);
        
      } else if (protocol === 'BB') {
        if (this.rawBuffer.length < 7) break;
        const type = this.rawBuffer[1];
        const cmd = this.rawBuffer[2];
        const payloadLen = (this.rawBuffer[3] << 8) | this.rawBuffer[4];
        const totalLen = 5 + payloadLen + 2;

        if (payloadLen > 1024) { this.rawBuffer.shift(); continue; }
        if (this.rawBuffer.length < totalLen) break;
        if (this.rawBuffer[totalLen - 1] !== 0x7E) { this.rawBuffer.shift(); continue; }

        if (type === 0x02 && (cmd === 0x22 || cmd === 0x27) && payloadLen >= 5) {
          const rssiRaw = this.rawBuffer[5];
          const rssi = rssiRaw > 127 ? rssiRaw - 256 : -rssiRaw;
          const epcLen = payloadLen - 3;
          if (epcLen > 0 && epcLen <= 62) {
            const epcBytes = this.rawBuffer.slice(8, 8 + epcLen);
            const epc = epcBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            if (this.shouldEmitTag(epc)) onTagRead({ epc, rssi });
          }
        }
        this.rawBuffer = this.rawBuffer.slice(totalLen);
      }
    }
  }

  async disconnect(): Promise<void> {
    this.isScanning = false;
    this.notifySubscription?.remove();
    this.notifySubscription = null;
    try {
      if (this.device) {
        const isConnected = await this.device.isConnected();
        if (isConnected) await this.device.cancelConnection();
      }
    } catch {}
    this.device = null;
    this.rawBuffer = [];
  }

  async startInventory(): Promise<void> {
    if (!this.device) throw new Error('Chưa kết nối BLE');
    if (this.isScanning) return;
    this.isScanning = true;
    this.rawBuffer = [];
    this.recentEPCs.clear();

    const cmdBytes = Buffer.from(BLE_CONFIG.COMMANDS.START_INVENTORY);
    const base64Cmd = cmdBytes.toString('base64');

    const services = await this.device.services();
    const targetService = services.find(s => s.uuid.toUpperCase().includes('FFE0'));

    if (targetService) {
      const chars = await targetService.characteristics();
      for (const ch of chars) {
        if (ch.isWritableWithoutResponse || ch.isWritableWithResponse) {
          try {
            if (ch.isWritableWithoutResponse) {
              await ch.writeWithoutResponse(base64Cmd);
            } else {
              await ch.writeWithResponse(base64Cmd);
            }
          } catch {}
        }
      }
    } else {
      try {
        await this.device.writeCharacteristicWithResponseForService(
          BLE_CONFIG.SERVICE_UUID, BLE_CONFIG.CHAR_WRITE_UUID, base64Cmd);
      } catch {
        try {
          await this.device.writeCharacteristicWithoutResponseForService(
            BLE_CONFIG.SERVICE_UUID, BLE_CONFIG.CHAR_WRITE_UUID, base64Cmd);
        } catch {}
      }
    }
  }

  async stopInventory(): Promise<void> {
    if (!this.device) return;
    this.isScanning = false;

    const cmdBytes = Buffer.from(BLE_CONFIG.COMMANDS.STOP_INVENTORY);
    const base64Cmd = cmdBytes.toString('base64');

    const services = await this.device.services();
    const targetService = services.find(s => s.uuid.toUpperCase().includes('FFE0'));

    if (targetService) {
      const chars = await targetService.characteristics();
      for (const ch of chars) {
        if (ch.isWritableWithoutResponse || ch.isWritableWithResponse) {
          try {
            if (ch.isWritableWithoutResponse) await ch.writeWithoutResponse(base64Cmd);
            else await ch.writeWithResponse(base64Cmd);
          } catch {}
        }
      }
    } else {
      try {
        await this.device.writeCharacteristicWithResponseForService(
          BLE_CONFIG.SERVICE_UUID, BLE_CONFIG.CHAR_WRITE_UUID, base64Cmd);
      } catch {
        try {
          await this.device.writeCharacteristicWithoutResponseForService(
            BLE_CONFIG.SERVICE_UUID, BLE_CONFIG.CHAR_WRITE_UUID, base64Cmd);
        } catch {}
      }
    }
  }

  isConnected(): boolean {
    return this.device !== null;
  }
}

export const bleReaderService = new BleReaderService();
