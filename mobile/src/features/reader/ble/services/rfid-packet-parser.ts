import { Buffer } from 'buffer';
import { RFIDTag } from '../types';

export class RFIDPacketParser {
  private buffer: number[] = [];
  private debugMode = true;

  feed(base64: string): RFIDTag[] {
    const bytes = [...Buffer.from(base64, 'base64')];
    this.buffer.push(...bytes);

    const tags: RFIDTag[] = [];

    let safety = 0;
    while (this.buffer.length >= 5 && safety++ < 50) {
      let parsed = false;

      // BB FORMAT
      const bbIdx = this.buffer.indexOf(0xBB);
      if (bbIdx !== -1) {
        if (bbIdx > 0) this.buffer = this.buffer.slice(bbIdx);
        
        if (this.buffer.length >= 7) {
          const payloadLen = (this.buffer[3] << 8) | this.buffer[4];
          const totalPacketLen = 5 + payloadLen + 2; 
          
          if (this.buffer.length >= totalPacketLen) {
            const cmd = this.buffer[2];

            if (cmd === 0x22 || cmd === 0x39) {
              if (payloadLen >= 5) {
                const rssiRaw = this.buffer[5];
                const rssi = rssiRaw > 127 ? rssiRaw - 256 : -rssiRaw;
                
                const epcStart = 8; 
                const epcLen = payloadLen - 3; 
                
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
            break; 
          }
        } else {
          break;
        }
      }

      // CF FORMAT
      const cfIdx = this.buffer.indexOf(0xCF);
      if (cfIdx !== -1) {
        if (cfIdx > 0) this.buffer = this.buffer.slice(cfIdx);
        
        if (this.buffer.length < 4) break;
        
        const type = this.buffer[3];
        
        if (type === 0x89) {
          if (this.buffer.length >= 8) {
            this.buffer = this.buffer.slice(8);
            parsed = true;
            continue;
          } else {
            break;
          }
        }
        
        if (this.buffer.length >= 8) {
          const paramBytes = this.buffer.slice(4, Math.min(this.buffer.length, 24));
          
          if (paramBytes.length >= 4) {
            const epc = paramBytes
              .map(b => b.toString(16).padStart(2, '0').toUpperCase())
              .join(' ');
            
            if (this.debugMode) console.log('[Parser] CF type', type.toString(16), 'raw params:', epc);
          }
          
          this.buffer = this.buffer.slice(8);
          parsed = true;
          continue;
        } else {
          break;
        }
      }

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
