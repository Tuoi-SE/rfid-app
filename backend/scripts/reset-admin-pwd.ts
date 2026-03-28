import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

class ResetAdminPasswordScript {
  static async run() {
    const args = process.argv.slice(2);
    const targetUsername = args[0];

    if (!targetUsername) {
      console.error('Lỗi: Bạn phải cung cấp Tên Đăng Nhập (Username) của người cần khôi phục.');
      console.error('Cú pháp đúng: npm run db:reset-admin -- <username>');
      process.exit(1);
    }

    console.log(`Đang tìm kiếm người dùng: ${targetUsername}...`);

    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!user) {
      console.error(`Lỗi: Không tìm thấy người dùng '${targetUsername}' trong hệ thống.`);
      process.exit(1);
    }

    // Khóa tài khoản chỉ cho Role ADMIN được phép dùng lệnh này
    // Bạn có thể bỏ qua check role nếu muốn lệnh này dùng cho MỌI user (Tuỳ nhu cầu)
    if (user.role !== 'ADMIN') {
      console.warn(`Cảnh báo: Tài khoản '${targetUsername}' có Role là ${user.role}, không phải ADMIN. Vẫn tiến hành đổi mật khẩu.`);
    }

    const defaultPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    await prisma.user.update({
      where: { username: targetUsername },
      data: { password: hashedPassword },
    });

    console.log('THÀNH CÔNG!');
    console.log(`Mật khẩu của tài khoản '${targetUsername}' đã được khôi phục về mặc định.`);
    console.log(`Mật khẩu mới: ${defaultPassword}`);
    console.log('Lưu ý: Yêu cầu Quản trị viên sử dụng mật khẩu trên để đăng nhập và tiến hành đổi mật khẩu ngay lập tức!');
  }

  static handleError(error: unknown) {
    console.error('Có lỗi không mong muốn xảy ra:');
    console.error(error);
    process.exit(1);
  }

  static async disconnect() {
    await prisma.$disconnect();
  }
}

ResetAdminPasswordScript.run()
  .catch(ResetAdminPasswordScript.handleError)
  .finally(ResetAdminPasswordScript.disconnect);
