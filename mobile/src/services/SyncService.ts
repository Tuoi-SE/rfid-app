// src/services/SyncService.ts
// Đồng bộ tags và push scans lên backend

import { RFIDTag } from './RFIDParser';
import { useAuthStore } from '../store/authStore';
import { Alert } from 'react-native';

let API_URL = 'http://localhost:3000/api';

class SyncService {
  setApiUrl(url: string) {
    API_URL = url;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private handleUnauthorized(res: Response) {
    if (res.status === 401) {
      // Token expired or invalid
      Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
      useAuthStore.getState().logout();
      throw new Error("Unauthorized (401)");
    }
  }

  // Tải tên tags từ server về local
  async pullTags(): Promise<Record<string, string>> {
     try {
        const res = await fetch(`${API_URL}/tags?limit=1000`, {
          headers: this.getHeaders(),
        });
        this.handleUnauthorized(res);
        if (!res.ok) throw new Error(`Fetch tags failed: ${res.status}`);
        
        const responseData = await res.json();
        const tags = Array.isArray(responseData.data) 
          ? responseData.data 
          : (Array.isArray(responseData.tags) ? responseData.tags : (Array.isArray(responseData) ? responseData : []));

        return Object.fromEntries(
          tags.map((t: any) => [t.epc, t.product?.name || t.name || t.epc])
        );
     } catch(e) {
         console.error("Lỗi kéo dữ liệu tags từ server", e);
         throw e;
     }
  }

  // Push raw scan directly to live endpoint
  async pushLiveScan(tags: RFIDTag[]): Promise<void> {
      try {
        const res = await fetch(`${API_URL}/tags/live`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ scans: tags })
        });
        this.handleUnauthorized(res);
        if (res.ok) {
          console.log('[Sync] Live scan pushed:', tags.length, 'tags');
        }
      } catch (e) {
          console.error("Lỗi bắn tag lên live channel:", e);
      }
  }

  // Gửi kết quả phiên quét lên server
  async pushSession(session: {
    name: string;
    orderId?: string;
    scans: { epc: string; rssi: number; time: Date }[];
  }): Promise<void> {
    // Convert Date objects to ISO strings for backend validation
    const payload = {
      name: session.name,
      orderId: session.orderId,
      scans: session.scans.map(s => ({
        epc: s.epc,
        rssi: s.rssi,
        time: s.time instanceof Date ? s.time.toISOString() : new Date(s.time).toISOString(),
      })),
    };

    console.log('[Sync] Pushing session:', payload.name, 'with', payload.scans.length, 'scans');

    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    this.handleUnauthorized(res);

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error('[Sync] Push session failed:', res.status, errorBody);
      throw new Error(`Push session failed: ${res.status}`);
    }
    
    console.log('[Sync] ✅ Session saved to server!');
  }

  // --- MỚI THÊM: API Cấp Thẻ ---

  // Lấy danh sách Sản phẩm
  async getProducts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_URL}/products?limit=1000`, {
        headers: this.getHeaders(),
      });
      this.handleUnauthorized(res);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Fetch products failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Lỗi kéo dữ liệu products", e);
      throw e;
    }
  }

  // Gán Tag vào Sản phẩm (Cấp thẻ)
  async assignTags(productId: string, tagIds: string[]): Promise<void> {
    try {
      const res = await fetch(`${API_URL}/tags/assign`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ productId, tagIds })
      });
      this.handleUnauthorized(res);
      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`Assign tags failed: ${res.status} ${errorBody}`);
      }
      console.log('[Sync] assigned', tagIds.length, 'tags to product', productId);
    } catch (e) {
      console.error("Lỗi assign tags", e);
      throw e;
    }
  }

  // Lấy danh sách Phiếu Nhập/Xuất (Orders)
  async pullOrders(): Promise<any[]> {
    try {
      const res = await fetch(`${API_URL}/orders?limit=100`, {
        headers: this.getHeaders(),
      });
      this.handleUnauthorized(res);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Fetch orders failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Lỗi kéo dữ liệu orders", e);
      throw e;
    }
  }
}

export default new SyncService();
