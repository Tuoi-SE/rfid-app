import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔧 Tạo tài khoản SUPER_ADMIN trên production...\n');

  // 1. Kiểm tra tài khoản đã tồn tại chưa
  const existing = await prisma.user.findUnique({
    where: { username: 'superadmin' },
  });

  if (existing) {
    console.log('ℹ️  Tài khoản "superadmin" đã tồn tại.');
    console.log(`   Role hiện tại: ${existing.role}`);

    if (existing.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN' },
      });
      console.log('✅ Đã upgrade role lên SUPER_ADMIN');
    }
  } else {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
      data: {
        username: 'superadmin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('✅ Tài khoản SUPER_ADMIN đã được tạo thành công!');
  }

  // 2. Upgrade admin hiện tại lên SUPER_ADMIN (nếu muốn)
  const adminUser = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (adminUser && adminUser.role === 'ADMIN') {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: 'SUPER_ADMIN' },
    });
    console.log('✅ Đã upgrade tài khoản "admin" từ ADMIN → SUPER_ADMIN');
  }

  // 3. Hiển thị danh sách user
  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, role: true },
    orderBy: { role: 'asc' },
  });

  console.log('\n📋 Danh sách tài khoản hiện tại:');
  console.table(allUsers.map(u => ({
    Username: u.username,
    Role: u.role,
    ID: u.id.slice(0, 8) + '...',
  })));
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
