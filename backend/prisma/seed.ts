import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ═══════════════════════════════════════════════════════════
// DỮ LIỆU THỰC TẾ - CÔNG TY TNHH TM-DV RIOTECH
// Nguồn: BÁO GIÁ SỈ T10.2025
// ═══════════════════════════════════════════════════════════

const CATEGORIES = [
  { name: 'Vải T200 100% Poly Cán Lụa', description: 'Ga trải giường T200' },
  { name: 'Vải T250 100% Cotton', description: 'Ga trải giường T250 cotton' },
  { name: 'Vải T300 100% Cotton', description: 'Ga trải giường T300 cotton cao cấp' },
  { name: 'Vải T350 Satin', description: 'Ga trải giường T350 satin' },
  { name: 'Phụ kiện Khách sạn', description: 'Phụ kiện khách sạn, resort, spa' },
  { name: 'Tấm trải', description: 'Tấm trải bàn, tấm trải sàn' },
  { name: 'Ga tròn', description: 'Ga giường tròn các kích thước' },
  { name: 'Tấm trang trí', description: 'Tấm trang trí giường, phòng' },
  { name: 'Bình dầu gội', description: 'Bình đựng dầu gội, sữa tắm' },
  { name: 'Tici', description: 'Vải tici, vỏ gối tici' },
];

const PRODUCTS: { category: string; name: string; sku: string; desc: string }[] = [
  // ── T200 (34 sp) ──
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.0m 2T', sku: 'RS.102', desc: 'Ga trải giường T200 1.0m 2 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.2m 2T', sku: 'RS.122', desc: 'Ga trải giường T200 1.2m 2 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.4m 2T', sku: 'RS.142', desc: 'Ga trải giường T200 1.4m 2 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.6m 2T', sku: 'RS.162', desc: 'Ga trải giường T200 1.6m 2 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.8m 2T', sku: 'RS.182', desc: 'Ga trải giường T200 1.8m 2 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 2mx2m 2T', sku: 'RS.202', desc: 'Ga trải giường T200 2mx2m 2 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 2.2m 2T', sku: 'RS.222', desc: 'Ga trải giường T200 2.2m 2 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.0m 3T', sku: 'RS.103', desc: 'Ga trải giường T200 1.0m 3 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.2m 3T', sku: 'RS.123', desc: 'Ga trải giường T200 1.2m 3 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.4m 3T', sku: 'RS.143', desc: 'Ga trải giường T200 1.4m 3 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.6m 3T', sku: 'RS.163', desc: 'Ga trải giường T200 1.6m 3 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.8m 3T', sku: 'RS.183', desc: 'Ga trải giường T200 1.8m 3 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 2mx2m 3T', sku: 'RS.203', desc: 'Ga trải giường T200 2mx2m 3 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 2.2m 3T', sku: 'RS.223', desc: 'Ga trải giường T200 2.2m 3 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.0m 4T', sku: 'RS.104', desc: 'Ga trải giường T200 1.0m 4 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.2m 4T', sku: 'RS.124', desc: 'Ga trải giường T200 1.2m 4 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.4m 4T', sku: 'RS.144', desc: 'Ga trải giường T200 1.4m 4 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.6m 4T', sku: 'RS.164', desc: 'Ga trải giường T200 1.6m 4 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 1.8m 4T', sku: 'RS.184', desc: 'Ga trải giường T200 1.8m 4 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 2mx2m 4T', sku: 'RS.204', desc: 'Ga trải giường T200 2mx2m 4 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Ga T200 2.2m 4T', sku: 'RS.224', desc: 'Ga trải giường T200 2.2m 4 thun' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Vỏ gối T200 50x70', sku: 'RS.VG5070', desc: 'Vỏ gối T200 kích thước 50x70' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Vỏ gối T200 35x105', sku: 'RS.VG35105', desc: 'Vỏ gối ôm T200 35x105' },
  { category: 'Vải T200 100% Poly Cán Lụa', name: 'Vỏ gối T200 35x50', sku: 'RS.VG3550', desc: 'Vỏ gối T200 nhỏ 35x50' },

  // ── T250 (mẫu đại diện) ──
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.0m 2T', sku: 'T250.102', desc: 'Ga trải giường T250 cotton 1.0m 2 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.2m 2T', sku: 'T250.122', desc: 'Ga trải giường T250 cotton 1.2m 2 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.4m 2T', sku: 'T250.142', desc: 'Ga trải giường T250 cotton 1.4m 2 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.6m 2T', sku: 'T250.162', desc: 'Ga trải giường T250 cotton 1.6m 2 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.8m 2T', sku: 'T250.182', desc: 'Ga trải giường T250 cotton 1.8m 2 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 2mx2m 2T', sku: 'T250.202', desc: 'Ga trải giường T250 cotton 2mx2m 2 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 2.2m 2T', sku: 'T250.222', desc: 'Ga trải giường T250 cotton 2.2m 2 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.0m 3T', sku: 'T250.103', desc: 'Ga trải giường T250 cotton 1.0m 3 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.2m 3T', sku: 'T250.123', desc: 'Ga trải giường T250 cotton 1.2m 3 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.4m 3T', sku: 'T250.143', desc: 'Ga trải giường T250 cotton 1.4m 3 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.6m 3T', sku: 'T250.163', desc: 'Ga trải giường T250 cotton 1.6m 3 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 1.8m 3T', sku: 'T250.183', desc: 'Ga trải giường T250 cotton 1.8m 3 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 2mx2m 3T', sku: 'T250.203', desc: 'Ga trải giường T250 cotton 2mx2m 3 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Ga T250 2.2m 3T', sku: 'T250.223', desc: 'Ga trải giường T250 cotton 2.2m 3 thun' },
  { category: 'Vải T250 100% Cotton', name: 'Vỏ gối T250 50x70', sku: 'T250.VG5070', desc: 'Vỏ gối T250 cotton 50x70' },
  { category: 'Vải T250 100% Cotton', name: 'Drap T250 1.6m', sku: 'T250.DR16', desc: 'Drap T250 cotton 1.6m' },
  { category: 'Vải T250 100% Cotton', name: 'Drap T250 1.8m', sku: 'T250.DR18', desc: 'Drap T250 cotton 1.8m' },
  { category: 'Vải T250 100% Cotton', name: 'Drap T250 2mx2m', sku: 'T250.DR20', desc: 'Drap T250 cotton 2mx2m' },

  // ── T300 (mẫu đại diện) ──
  { category: 'Vải T300 100% Cotton', name: 'Ga T300 1.0m 2T', sku: 'T300.102', desc: 'Ga trải giường T300 cotton cao cấp 1.0m 2 thun' },
  { category: 'Vải T300 100% Cotton', name: 'Ga T300 1.2m 2T', sku: 'T300.122', desc: 'Ga trải giường T300 cotton cao cấp 1.2m 2 thun' },
  { category: 'Vải T300 100% Cotton', name: 'Ga T300 1.4m 2T', sku: 'T300.142', desc: 'Ga trải giường T300 cotton cao cấp 1.4m 2 thun' },
  { category: 'Vải T300 100% Cotton', name: 'Ga T300 1.6m 2T', sku: 'T300.162', desc: 'Ga trải giường T300 cotton cao cấp 1.6m 2 thun' },
  { category: 'Vải T300 100% Cotton', name: 'Ga T300 1.8m 2T', sku: 'T300.182', desc: 'Ga trải giường T300 cotton cao cấp 1.8m 2 thun' },
  { category: 'Vải T300 100% Cotton', name: 'Ga T300 2mx2m 2T', sku: 'T300.202', desc: 'Ga trải giường T300 cotton cao cấp 2mx2m 2 thun' },
  { category: 'Vải T300 100% Cotton', name: 'Ga T300 2.2m 2T', sku: 'T300.222', desc: 'Ga trải giường T300 cotton cao cấp 2.2m 2 thun' },
  { category: 'Vải T300 100% Cotton', name: 'Vỏ gối T300 50x70', sku: 'T300.VG5070', desc: 'Vỏ gối T300 cotton cao cấp 50x70' },
  { category: 'Vải T300 100% Cotton', name: 'Drap T300 1.6m', sku: 'T300.DR16', desc: 'Drap T300 cotton cao cấp 1.6m' },
  { category: 'Vải T300 100% Cotton', name: 'Drap T300 1.8m', sku: 'T300.DR18', desc: 'Drap T300 cotton cao cấp 1.8m' },
  { category: 'Vải T300 100% Cotton', name: 'Drap T300 2mx2m', sku: 'T300.DR20', desc: 'Drap T300 cotton cao cấp 2mx2m' },

  // ── T350 Satin ──
  { category: 'Vải T350 Satin', name: 'Ga T350 1.0m 2T', sku: 'T350.102', desc: 'Ga trải giường T350 satin 1.0m 2 thun' },
  { category: 'Vải T350 Satin', name: 'Ga T350 1.2m 2T', sku: 'T350.122', desc: 'Ga trải giường T350 satin 1.2m 2 thun' },
  { category: 'Vải T350 Satin', name: 'Ga T350 1.4m 2T', sku: 'T350.142', desc: 'Ga trải giường T350 satin 1.4m 2 thun' },
  { category: 'Vải T350 Satin', name: 'Ga T350 1.6m 2T', sku: 'T350.162', desc: 'Ga trải giường T350 satin 1.6m 2 thun' },
  { category: 'Vải T350 Satin', name: 'Ga T350 1.8m 2T', sku: 'T350.182', desc: 'Ga trải giường T350 satin 1.8m 2 thun' },
  { category: 'Vải T350 Satin', name: 'Ga T350 2mx2m 2T', sku: 'T350.202', desc: 'Ga trải giường T350 satin 2mx2m 2 thun' },
  { category: 'Vải T350 Satin', name: 'Vỏ gối T350 50x70', sku: 'T350.VG5070', desc: 'Vỏ gối T350 satin 50x70' },

  // ── Phụ kiện Khách sạn (mẫu đại diện) ──
  { category: 'Phụ kiện Khách sạn', name: 'Khăn mặt 28x48', sku: 'PK.KM2848', desc: 'Khăn mặt khách sạn 28x48cm' },
  { category: 'Phụ kiện Khách sạn', name: 'Khăn mặt 30x50', sku: 'PK.KM3050', desc: 'Khăn mặt khách sạn 30x50cm' },
  { category: 'Phụ kiện Khách sạn', name: 'Khăn mặt 30x60', sku: 'PK.KM3060', desc: 'Khăn mặt khách sạn 30x60cm' },
  { category: 'Phụ kiện Khách sạn', name: 'Khăn mặt 34x80', sku: 'PK.KM3480', desc: 'Khăn mặt khách sạn 34x80cm' },
  { category: 'Phụ kiện Khách sạn', name: 'Khăn tắm 60x120', sku: 'PK.KT60120', desc: 'Khăn tắm khách sạn 60x120cm' },
  { category: 'Phụ kiện Khách sạn', name: 'Khăn tắm 70x140', sku: 'PK.KT70140', desc: 'Khăn tắm khách sạn 70x140cm' },
  { category: 'Phụ kiện Khách sạn', name: 'Khăn tắm 80x160', sku: 'PK.KT80160', desc: 'Khăn tắm khách sạn 80x160cm' },
  { category: 'Phụ kiện Khách sạn', name: 'Áo choàng tắm', sku: 'PK.ACT', desc: 'Áo choàng tắm khách sạn' },
  { category: 'Phụ kiện Khách sạn', name: 'Dép đi trong phòng', sku: 'PK.DEP', desc: 'Dép đi trong phòng khách sạn' },
  { category: 'Phụ kiện Khách sạn', name: 'Ruột gối nằm', sku: 'PK.RGN', desc: 'Ruột gối nằm khách sạn' },
  { category: 'Phụ kiện Khách sạn', name: 'Ruột gối ôm', sku: 'PK.RGO', desc: 'Ruột gối ôm khách sạn' },
  { category: 'Phụ kiện Khách sạn', name: 'Tấm Topper', sku: 'PK.TOPPER', desc: 'Tấm Topper lót nệm khách sạn' },

  // ── Tấm trải ──
  { category: 'Tấm trải', name: 'Tấm trải bàn 1.4m', sku: 'TT.14', desc: 'Tấm trải bàn 1.4m' },
  { category: 'Tấm trải', name: 'Tấm trải bàn 1.6m', sku: 'TT.16', desc: 'Tấm trải bàn 1.6m' },
  { category: 'Tấm trải', name: 'Tấm trải bàn 1.8m', sku: 'TT.18', desc: 'Tấm trải bàn 1.8m' },
  { category: 'Tấm trải', name: 'Tấm trải bàn 2.0m', sku: 'TT.20', desc: 'Tấm trải bàn 2.0m' },

  // ── Ga tròn ──
  { category: 'Ga tròn', name: 'Ga tròn D1.6m', sku: 'GT.D16', desc: 'Ga giường tròn đường kính 1.6m' },
  { category: 'Ga tròn', name: 'Ga tròn D1.8m', sku: 'GT.D18', desc: 'Ga giường tròn đường kính 1.8m' },
  { category: 'Ga tròn', name: 'Ga tròn D2.0m', sku: 'GT.D20', desc: 'Ga giường tròn đường kính 2.0m' },
  { category: 'Ga tròn', name: 'Ga tròn D2.2m', sku: 'GT.D22', desc: 'Ga giường tròn đường kính 2.2m' },

  // ── Tấm trang trí ──
  { category: 'Tấm trang trí', name: 'Tấm trang trí giường 1.6m', sku: 'TTR.16', desc: 'Tấm trang trí giường 1.6m' },
  { category: 'Tấm trang trí', name: 'Tấm trang trí giường 1.8m', sku: 'TTR.18', desc: 'Tấm trang trí giường 1.8m' },
  { category: 'Tấm trang trí', name: 'Tấm trang trí giường 2.0m', sku: 'TTR.20', desc: 'Tấm trang trí giường 2.0m' },

  // ── Bình dầu gội ──
  { category: 'Bình dầu gội', name: 'Bình dầu gội 500ml', sku: 'BDG.500', desc: 'Bình đựng dầu gội 500ml' },
  { category: 'Bình dầu gội', name: 'Bình sữa tắm 500ml', sku: 'BST.500', desc: 'Bình đựng sữa tắm 500ml' },

  // ── Tici ──
  { category: 'Tici', name: 'Vỏ gối Tici 50x70', sku: 'TC.VG5070', desc: 'Vỏ gối Tici 50x70cm' },
  { category: 'Tici', name: 'Vỏ gối ôm Tici 35x105', sku: 'TC.VGO35105', desc: 'Vỏ gối ôm Tici 35x105cm' },
  { category: 'Tici', name: 'Ga Tici 1.0m', sku: 'TC.G10', desc: 'Ga Tici 1.0m' },
  { category: 'Tici', name: 'Ga Tici 1.2m', sku: 'TC.G12', desc: 'Ga Tici 1.2m' },
  { category: 'Tici', name: 'Ga Tici 1.4m', sku: 'TC.G14', desc: 'Ga Tici 1.4m' },
  { category: 'Tici', name: 'Ga Tici 1.6m', sku: 'TC.G16', desc: 'Ga Tici 1.6m' },
  { category: 'Tici', name: 'Ga Tici 1.8m', sku: 'TC.G18', desc: 'Ga Tici 1.8m' },
];

class SeedRunner {
  static async run() {
    // ── 1. Admin user ──
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

    // ── 2. Warehouse Manager user ──
    const managerExists = await prisma.user.findUnique({
      where: { username: 'manager' },
    });

    if (!managerExists) {
      const hashedPassword = await bcrypt.hash('manager123', 10);
      await prisma.user.create({
        data: {
          username: 'manager',
          password: hashedPassword,
          role: 'WAREHOUSE_MANAGER',
        },
      });
      console.log('✅ Manager user created (manager / manager123)');
    } else {
      console.log('ℹ️  Manager user already exists, skipping.');
    }

    // ── 3. Categories (10 danh mục thực tế RIOTECH) ──
    const categoryMap = new Map<string, string>();
    for (const cat of CATEGORIES) {
      const created = await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: cat,
      });
      categoryMap.set(cat.name, created.id);
    }
    console.log(`✅ Seeded ${CATEGORIES.length} categories (RIOTECH)`);

    // ── 4. Products (sản phẩm thực tế) ──
    let productCount = 0;
    for (const prod of PRODUCTS) {
      const categoryId = categoryMap.get(prod.category);
      if (!categoryId) continue;

      await prisma.product.upsert({
        where: { sku: prod.sku },
        update: {},
        create: {
          name: prod.name,
          sku: prod.sku,
          description: prod.desc,
          categoryId,
        },
      });
      productCount++;
    }
    console.log(`✅ Seeded ${productCount} products (RIOTECH)`);

    // ── 5. Locations (hệ thống kho vận thực tế) ──
    const locations = await Promise.all([
      prisma.location.upsert({
        where: { code: 'ADMIN' },
        update: {},
        create: { code: 'ADMIN', name: 'Kho Admin', type: 'ADMIN', address: 'Trung tâm quản lý' },
      }),
      prisma.location.upsert({
        where: { code: 'WH-HCM-01' },
        update: {},
        create: { code: 'WH-HCM-01', name: 'Kho Tổng HCM', type: 'WAREHOUSE', address: '618 Lê Trọng Tấn, P.Bình Hưng Hòa, Q.Bình Tân, TPHCM' },
      }),
      prisma.location.upsert({
        where: { code: 'WH-HN-01' },
        update: {},
        create: { code: 'WH-HN-01', name: 'Kho Tổng Hà Nội', type: 'WAREHOUSE', address: 'Hà Nội' },
      }),
      prisma.location.upsert({
        where: { code: 'WS-A' },
        update: {},
        create: { code: 'WS-A', name: 'Xưởng May A', type: 'WORKSHOP', address: 'Khu công nghiệp A' },
      }),
      prisma.location.upsert({
        where: { code: 'WS-B' },
        update: {},
        create: { code: 'WS-B', name: 'Xưởng May B', type: 'WORKSHOP', address: 'Khu công nghiệp B' },
      }),
      prisma.location.upsert({
        where: { code: 'KS-HN-01' },
        update: {},
        create: { code: 'KS-HN-01', name: 'Khách Sạn Hà Nội 1', type: 'HOTEL', address: '123 Nguyễn Chí Thanh, Hà Nội' },
      }),
      prisma.location.upsert({
        where: { code: 'RS-HN-01' },
        update: {},
        create: { code: 'RS-HN-01', name: 'Resort Hà Nội 1', type: 'RESORT', address: '456 Hồ Tây, Hà Nội' },
      }),
      prisma.location.upsert({
        where: { code: 'SPA-HN-01' },
        update: {},
        create: { code: 'SPA-HN-01', name: 'Spa Hà Nội 1', type: 'SPA', address: '789 Trúc Bạch, Hà Nội' },
      }),
      prisma.location.upsert({
        where: { code: 'KS-HCM-01' },
        update: {},
        create: { code: 'KS-HCM-01', name: 'Khách Sạn HCM 1', type: 'HOTEL', address: '1 Đồng Khởi, TPHCM' },
      }),
    ]);

    console.log(`✅ Seeded ${locations.length} locations`);
    console.log('🎉 Seed hoàn tất!');
  }

  static handleError(error: unknown) {
    console.error('Seed error:', error);
    process.exit(1);
  }

  static disconnect() {
    return prisma.$disconnect();
  }
}

SeedRunner.run()
  .catch(SeedRunner.handleError)
  .finally(SeedRunner.disconnect);
