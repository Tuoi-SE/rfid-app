// src/services/SyncService.ts
// Đồng bộ tags và push scans lên backend

import { RFIDTag } from './RFIDParser';

// Use host IP address, as localhost refers to the Android emulator itself
// e.g. 192.168.1.xxx or 10.x.x.x
let API_URL = 'http://192.168.1.13:3000/api'; 

class SyncService {
  setApiUrl(url: string) {
    API_URL = url;
  }

  // Tải tên tags từ server về local
  async pullTags(): Promise<Record<string, string>> {
     try {
        const res = await fetch(`${API_URL}/tags`);
        if (!res.ok) throw new Error("Fetch failed");
        
        const responseData = await res.json();
        // The endpoint currently returns { "success": true, "tags": [...] }
        const tags = Array.isArray(responseData.tags) ? responseData.tags : (Array.isArray(responseData) ? responseData : []);

        // Trả về map: { "EPC hex": "Tên hiển thị" }
        return Object.fromEntries(
          tags.map((t: any) => [t.epc, t.name])
        );
     } catch(e) {
         console.error("Lỗi kéo dữ liệu tags từ server", e);
         throw e;
     }
  }

  // Push raw scan directly to live endpoint
  async pushLiveScan(tags: RFIDTag[]): Promise<void> {
      try {
        await fetch(`${API_URL}/tags/live`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tags)
        });
      } catch (e) {
          console.error("Lỗi bắn tag lên live channel:", e);
      }
  }

  // Gửi kết quả phiên quét lên server
  async pushSession(session: {
    name: string;
    scans: { epc: string; rssi: number; time: Date }[];
  }): Promise<void> {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    if (!res.ok) {
        throw new Error("Push session failed");
    }
  }
}

export default new SyncService();
