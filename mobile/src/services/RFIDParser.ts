// src/services/RFIDParser.ts
import { Buffer } from 'buffer';

export interface RFIDTag {
  epc: string;   // Ví dụ: "E2 80 69 15 00 00 40 1E CC 01 11 3D"
  rssi: number;  // Ví dụ: -42
}

/**
 * Parser cho dữ liệu ST-H103 UHF RFID Reader.
 * 
 * Dữ liệu BLE đến theo từng chunk nhỏ (8-20 bytes mỗi notification).
 * Parser cần buffer lại và ghép nối trước khi parse.
 * 
 * Format packet đã xác nhận từ thiết bị thực:
 * 
 * HEARTBEAT: CF 00 00 89 xx xx xx xx  (type=0x89, 8 bytes)
 * 
 * TAG DATA:  Có nhiều variant tùy firmware.
 *   Variant 1 (BB response): BB 02 22 00 xx [PC 2bytes] [EPC 12bytes] [RSSI] [CRC] 7E
 *   Variant 2 (CF packet):   CF 00 00 01 ... [EPC data] ...
 * 
 * Do dữ liệu BLE bị chia nhỏ, ta cần buffer tất cả và tìm pattern BB hoặc CF.
 */
export class RFIDParser {
  private buffer: number[] = [];
  private debugMode = true;

  feed(base64: string): RFIDTag[] {
    const bytes = [...Buffer.from(base64, 'base64')];
    this.buffer.push(...bytes);

    const tags: RFIDTag[] = [];

    // Thử parse nhiều format khác nhau
    let safety = 0;
    while (this.buffer.length >= 5 && safety++ < 50) {
      let parsed = false;

      // ===== FORMAT 1: BB response packet =====
      // BB [type] [cmd] [lenH] [lenL] [payload...] [checksum] 7E
      const bbIdx = this.buffer.indexOf(0xBB);
      if (bbIdx !== -1) {
        // Xóa rác trước BB
        if (bbIdx > 0) this.buffer = this.buffer.slice(bbIdx);
        
        if (this.buffer.length >= 7) {
          const lenH = this.buffer[3];
          const lenL = this.buffer[4];
          const payloadLen = (lenH << 8) | lenL;
          const totalPacketLen = 5 + payloadLen + 2; // header(5) + payload + checksum + 7E
          
          if (this.buffer.length >= totalPacketLen) {
            const cmd = this.buffer[2];

            // cmd=0x22 → Inventory response chứa tag EPC
            // cmd=0x39 → Read tag data
            if (cmd === 0x22 || cmd === 0x39) {
              // Payload format: [RSSI] [PC 2 bytes] [EPC n bytes]
              // hoặc:           [Ant] [PC 2 bytes] [EPC n bytes] [RSSI]
              if (payloadLen >= 5) {
                const rssiRaw = this.buffer[5]; // Byte đầu payload
                const rssi = rssiRaw > 127 ? rssiRaw - 256 : -rssiRaw;
                
                // PC là 2 bytes, skip chúng, phần còn lại là EPC
                const epcStart = 5 + 1 + 2; // header offset + rssi + pc(2)
                const epcLen = payloadLen - 1 - 2; // trừ rssi byte và pc(2)
                
                if (epcLen > 0 && epcLen <= 32 && epcStart + epcLen <= this.buffer.length) {
                  const epcBytes = this.buffer.slice(epcStart, epcStart + epcLen);
                  const epc = epcBytes
                    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                    .join(' ');
                  
                  if (this.debugMode) console.log('[Parser] BB tag found:', epc, 'RSSI:', rssi);
                  tags.push({ epc, rssi });
                }
              }
            }
            
            this.buffer = this.buffer.slice(totalPacketLen);
            parsed = true;
            continue;
          } else {
            break; // Chưa đủ data, đợi thêm
          }
        } else {
          break;
        }
      }

      // ===== FORMAT 2: CF packet =====
      const cfIdx = this.buffer.indexOf(0xCF);
      if (cfIdx !== -1) {
        if (cfIdx > 0) this.buffer = this.buffer.slice(cfIdx);
        
        if (this.buffer.length < 4) break;
        
        const type = this.buffer[3];
        
        // Heartbeat (0x89) → bỏ qua 8 bytes
        if (type === 0x89) {
          if (this.buffer.length >= 8) {
            this.buffer = this.buffer.slice(8);
            parsed = true;
            continue;
          } else {
            break;
          }
        }
        
        // Type 0x01 hoặc 0x02 → có thể chứa tag
        // CF packet variable length, ta thử đọc
        // Format ước lượng: CF 00 00 type [param] [param] ... 
        // Dữ liệu thực: cf 00 00 01 01 12 42 1d → 8 bytes
        if (this.buffer.length >= 8) {
          // Thử parse EPC từ byte 4 trở đi (skip CF 00 00 type)
          const paramBytes = this.buffer.slice(4, Math.min(this.buffer.length, 24));
          
          // Tìm xem có chuỗi hex nào giống EPC không (thường >= 4 bytes)
          if (paramBytes.length >= 4) {
            // Xử lý như raw data packet
            const epc = paramBytes
              .map(b => b.toString(16).padStart(2, '0').toUpperCase())
              .join(' ');
            
            if (this.debugMode) console.log('[Parser] CF type', type.toString(16), 'raw params:', epc);
          }
          
          // Consume toàn bộ CF packet (8 bytes mặc định nếu không biết length)
          this.buffer = this.buffer.slice(8);
          parsed = true;
          continue;
        } else {
          break;
        }
      }

      // Không tìm thấy BB hoặc CF → xóa byte đầu và thử lại
      if (!parsed) {
        this.buffer = this.buffer.slice(1);
      }
    }

    return tags;
  }

  reset() {
    this.buffer = [];
  }
}
