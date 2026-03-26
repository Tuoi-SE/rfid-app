import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const generateSku = () => {
  return crypto.randomUUID();
};

async function main() {
  console.log(
    '🌱 Bắt đầu chạy Seed dữ liệu từ Báo Giá Excel với logic bóc tách Nâng Cao...',
  );

  const filePath = path.resolve(
    __dirname,
    '../../template/BÁO GIÁ SỈ T10.2025xlsx.xlsx',
  );
  console.log(`Đang đọc file: ${filePath}`);

  const workbook = xlsx.readFile(filePath);
  let totalProducts = 0;
  let totalCategories = 0;

  console.log('Xoá dữ liệu cũ...');
  // Delete all scans and tags first due to foreign keys if they existed, though product cascade should handle tags if configured
  await prisma.scan.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log('Đã xoá dữ liệu cũ.');

  for (const sheetName of workbook.SheetNames) {
    console.log(`\n📦 Xử lý Sheet (Danh mục): [${sheetName}]`);
    const category = await prisma.category.upsert({
      where: { name: sheetName },
      update: {},
      create: {
        name: sheetName,
        description: `Danh mục tự động tạo từ Sheet Excel`,
      },
    });
    totalCategories++;

    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let currentSubCategory = 'Không phân loại';
    let rowIndex = 0;

    for (const row of data) {
      if (!row || !Array.isArray(row)) continue;

      const col0 = row[0];
      const col1 = row[1];

      const isCol0Number = typeof col0 === 'number';
      const col0Str = typeof col0 === 'string' ? col0.trim() : '';
      const col1Str = typeof col1 === 'string' ? col1.trim() : '';

      if (isCol0Number) {
        // [PRODUCT ROW]
        const name = col1Str;
        let sku = String(row[2] || '').trim();

        if (!name) continue;

        if (!sku || sku === 'NO_SKU' || sku === 'Cái' || sku === 'Bộ') {
          sku = generateSku();
        }

        try {
          const desc =
            currentSubCategory !== 'Không phân loại'
              ? `Nhóm/Phân loại: ${currentSubCategory}`
              : `Imported from ${sheetName}`;

          await prisma.product.upsert({
            where: { sku: sku },
            update: {
              name: name,
              categoryId: category.id,
              description: desc,
            },
            create: {
              name: name,
              sku: sku,
              categoryId: category.id,
              description: desc,
            },
          });
          process.stdout.write('+');
          totalProducts++;
        } catch (e) {
          console.error(`\nLỗi khi import sản phẩm: ${name} (SKU: ${sku})`, e);
        }
      } else {
        // [SUB-CATEGORY DETECTION ROW]
        if (
          col0Str &&
          col0Str !== 'STT' &&
          col0Str.length > 2 &&
          !col0Str.includes('CÔNG TY') &&
          !col0Str.includes('Ghi chú') &&
          !col0Str.includes('BẢNG BÁO GIÁ') &&
          !col0Str.includes('Bảng giá')
        ) {
          currentSubCategory = col0Str;
        } else if (
          !col0Str &&
          col1Str &&
          col1Str === col1Str.toUpperCase() &&
          col1Str !== 'TÊN SẢN PHẨM ' &&
          col1Str !== 'TÊN SẢN PHẨM' &&
          !col1Str.includes('CÔNG TY')
        ) {
          currentSubCategory = col1Str;
        }
      }
      rowIndex++;
    }
    console.log(`\n✅ Hoàn tất nhập sheet [${sheetName}]`);
  }

  console.log(`\n🎉 Bóc tách và Seed dữ liệu thành công!`);
  console.log(`Đã tạo/cập nhật: ${totalCategories} danh mục.`);
  console.log(`Đã tạo/cập nhật: ${totalProducts} sản phẩm.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
