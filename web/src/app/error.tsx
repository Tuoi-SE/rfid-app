'use client';

import { useEffect } from 'react';
import { ErrorPageLayout } from '@/components/ErrorPageLayout';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorPageLayout 
      code="500"
      title="Đã xảy ra lỗi hệ thống"
      description="Rất tiếc, đã có vấn đề kỹ thuật xảy ra từ phía chúng tôi. Vui lòng quay lại sau hoặc liên hệ hỗ trợ."
    />
  );
}
