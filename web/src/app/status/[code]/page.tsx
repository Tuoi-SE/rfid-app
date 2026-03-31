import { ErrorPageLayout } from '@/components/ErrorPageLayout';
import { notFound } from 'next/navigation';

const statusMessages: Record<string, { title: string; description: string }> = {
  '400': {
    title: 'Yêu cầu không hợp lệ',
    description: 'Có vẻ như dữ liệu gửi đi không chính xác hoặc link chứa tham số bị hỏng. Vui lòng kiểm tra lại.',
  },
  '401': {
    title: 'Chưa xác thực',
    description: 'Phiên làm việc của bạn đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng tiến hành đăng nhập lại để tiếp tục.',
  },
  '403': {
    title: 'Không có quyền truy cập',
    description: 'Bạn không có quyền hoặc chức năng này yêu cầu cấp bậc cao hơn. Vui lòng liên hệ Quản trị viên hệ thống.',
  },
  '404': {
    title: 'Không tìm thấy trang',
    description: 'Có vẻ như kiến trúc của trang bạn đang tìm kiếm đã bị thay đổi hoặc đường dẫn không còn tồn tại trong hệ thống của chúng tôi.',
  },
  '408': {
    title: 'Kết nối quá hạn',
    description: 'Dữ liệu đường truyền của bạn đang độ trễ cao khiến máy chủ không thể xử lý. Vui lòng tải lại trang.',
  },
  '429': {
    title: 'Thao tác quá nhanh',
    description: 'Hệ thống nhận thấy bạn đang gửi quá nhiều yêu cầu trong thời gian ngắn! Vui lòng chậm lại và thử lại sau ít phút.',
  },
  '500': {
    title: 'Đã xảy ra lỗi hệ thống',
    description: 'Rất tiếc, đã có vấn đề kỹ thuật xảy ra từ phía chúng tôi. Vui lòng quay lại sau hoặc liên hệ hỗ trợ.',
  },
  '502': {
    title: 'Lỗi kết nối ngầm',
    description: 'Máy chủ phản hồi không hợp lệ (Bad Gateway). Lỗi cấu hình mạng hoặc proxy, vui lòng thử lại sau.',
  },
  '503': {
    title: 'Bảo trì hệ thống',
    description: 'Hệ thống đang được nâng cấp hoặc bảo trì định kỳ nhằm nâng cao trải nghiệm. Vui lòng quay lại sau ít phút.',
  },
  '504': {
    title: 'Máy chủ phản hồi chậm',
    description: 'Hết thời gian chờ phản hồi (Gateway Timeout). Hệ thống hiện tại có thể đang quá tải.',
  },
};

export default function StatusErrorPage({ params }: { params: { code: string } }) {
  const { code } = params;
  
  const statusConfig = statusMessages[code];

  if (!statusConfig) {
    return notFound();
  }

  return (
    <ErrorPageLayout 
      code={code}
      title={statusConfig.title}
      description={statusConfig.description}
    />
  );
}
