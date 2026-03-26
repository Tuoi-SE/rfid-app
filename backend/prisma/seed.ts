import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed admin user
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created (admin / admin123)');
  } else {
    console.log('ℹ️  Admin user already exists, skipping.');
  }

  // Seed categories
  const categories = [
    { name: 'Điện tử', description: 'Thiết bị điện tử, linh kiện' },
    { name: 'Thực phẩm', description: 'Hàng thực phẩm, đồ uống' },
    { name: 'Vật liệu', description: 'Vật liệu xây dựng, nguyên liệu' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories seeded');

  // Seed Locations - D-05
  const locations = await Promise.all([
    // ADMIN - vị trí gốc khi tag được tạo
    prisma.location.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        code: 'ADMIN',
        name: 'Kho Admin',
        type: 'ADMIN',
        address: 'Trung tâm quản lý',
      },
    }),

    // WAREHOUSE - Kho Tổng Hà Nội
    prisma.location.upsert({
      where: { code: 'WH-HN-01' },
      update: {},
      create: {
        code: 'WH-HN-01',
        name: 'Kho Tổng Hà Nội',
        type: 'WAREHOUSE',
        address: 'Hà Nội',
      },
    }),

    // WAREHOUSE - Kho Tổng HCM
    prisma.location.upsert({
      where: { code: 'WH-HCM-01' },
      update: {},
      create: {
        code: 'WH-HCM-01',
        name: 'Kho Tổng HCM',
        type: 'WAREHOUSE',
        address: 'Hồ Chí Minh',
      },
    }),

    // WORKSHOP - Xưởng May A
    prisma.location.upsert({
      where: { code: 'WS-A' },
      update: {},
      create: {
        code: 'WS-A',
        name: 'Xưởng May A',
        type: 'WORKSHOP',
        address: 'Khu công nghiệp A',
      },
    }),

    // WORKSHOP - Xưởng May B
    prisma.location.upsert({
      where: { code: 'WS-B' },
      update: {},
      create: {
        code: 'WS-B',
        name: 'Xưởng May B',
        type: 'WORKSHOP',
        address: 'Khu công nghiệp B',
      },
    }),
  ]);

  console.log(`✅ Seeded ${locations.length} locations`);

  // Seed sample products
  const electronicsCategory = await prisma.category.findUnique({
    where: { name: 'Điện tử' },
  });

  if (electronicsCategory) {
    const products = [
      { name: 'Arduino Uno R3', sku: 'ELEC-001', description: 'Board Arduino Uno R3', categoryId: electronicsCategory.id },
      { name: 'Raspberry Pi 4', sku: 'ELEC-002', description: 'Board Raspberry Pi 4 Model B', categoryId: electronicsCategory.id },
      { name: 'ESP32 DevKit', sku: 'ELEC-003', description: 'ESP32 Development Kit', categoryId: electronicsCategory.id },
    ];

    for (const prod of products) {
      await prisma.product.upsert({
        where: { sku: prod.sku },
        update: {},
        create: prod,
      });
    }
    console.log('✅ Sample products seeded');
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
