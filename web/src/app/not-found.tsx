import React from 'react';
import { ErrorPageLayout } from '@/components/ErrorPageLayout';

export default function NotFound() {
  return (
    <ErrorPageLayout 
      code="404"
      title="Không tìm thấy trang"
      description="Có vẻ như kiến trúc của trang bạn đang tìm kiếm đã bị thay đổi hoặc đường dẫn không còn tồn tại trong hệ thống của chúng tôi."
    />
  );
}
