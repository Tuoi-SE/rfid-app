'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { OrderDetailsModal } from '@/features/orders/components/order-details-modal';

export default function OrderIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <OrderDetailsModal 
      orderId={id} 
      onClose={() => router.push('/orders')} 
    />
  );
}
