import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RFID Inventory Management API')
    .setVersion('1.0.0')
    .setContact('Dreamscape Engineering', 'https://dreamscape.vn', 'support@dreamscape.vn')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Nhập JWT Token ở định dạng chuẩn. Không bắt buộc nhập chữ Bearer phía trước.'
    }, 'access-token')
    .addTag('Auth', 'Xác thực & Quản lý phiên')
    .addTag('Users', 'Quản trị nhân sự hệ thống')
    .addTag('Categories', 'Danh mục vật tư')
    .addTag('Products', 'Quản lý sản phẩm Hàng hóa')
    .addTag('Tags', 'Mã hóa và cấp phát thẻ RFID/EPC')
    .addTag('Inventory', 'Kho bãi & Vận hành tồn kho')
    .addTag('Dashboard', 'Báo cáo Thống kê & KPI')
    .addTag('Activity Logs', 'Theo dõi Audit Log (Dấu vết hoạt động)')
    .addTag('Sessions', 'Lịch sử quét máy nhận dạng RFID')
    .addTag('Locations', 'Quản lý Kho xưởng vật lý')
    .addTag('Orders', 'Xử lý Phiếu lệnh (Inbound/Outbound)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'RFID API Docs',
    swaggerOptions: {
      persistAuthorization: true, // Lưu JWT token sau khi F5 Trang
      docExpansion: 'none',       // Thu gọn toàn bộ endpoint cho gọn gàng
      filter: true,               // Kích hoạt thanh Tìm kiếm API
      displayRequestDuration: true, // Hiện thời gian phản hồi (ms)
    },
  });
}
