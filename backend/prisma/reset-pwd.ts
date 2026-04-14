import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.update({
    where: { username: 'superadmin' },
    data: { 
      password: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null
    },
  });
  console.log('✅ Đặt lại mật khẩu cho "superadmin" thành "123456"');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
