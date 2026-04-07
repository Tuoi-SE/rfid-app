'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { TransferDetailsModal } from '@/features/transfers/components/transfer-details-modal';

export default function TransferIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <TransferDetailsModal 
      transferId={id} 
      onClose={() => router.push('/transfers')} 
    />
  );
}
