import { useState, useEffect } from 'react';
import { ordersApi } from '../api/orders.api';
import { Order } from '../types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.pullOrders();
      setOrders(data.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS'));
    } catch (e: any) {
      setError(e.message || 'Không thể lấy danh sách Phiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
}
