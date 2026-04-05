import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
const adapter = new PrismaPg({
  connectionString: databaseUrl,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = 'superadmin';
  const password = 'Superadmin@123';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      username,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Đã tạo/cập nhật Super Admin thành công!`);
  console.log(`Username: ${user.username}`);
  console.log(`Password: ${password}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
