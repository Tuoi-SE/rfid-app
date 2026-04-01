import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Bắt đầu đồng bộ tạo Kho Xưởng cho toàn bộ Xưởng hiện có...');

  const workshops = await prisma.location.findMany({
    where: { 
      type: 'WORKSHOP',
      deletedAt: null 
    },
    include: {
      children: {
        where: { type: 'WORKSHOP_WAREHOUSE', deletedAt: null }
      }
    }
  });

  let createdCount = 0;

  for (const ws of workshops) {
    if (ws.children.length === 0) {
      console.log(`- Xưởng "${ws.name}" (Code: ${ws.code}) chưa có Kho Xưởng. Khởi tạo...`);
      const warehouseCode = `WH-${ws.code}`;
      
      await prisma.location.create({
        data: {
          code: warehouseCode,
          name: `Kho - ${ws.name}`,
          type: 'WORKSHOP_WAREHOUSE',
          address: ws.address,
          parentId: ws.id,
        }
      });
      createdCount++;
    } else {
      console.log(`- Xưởng "${ws.name}" (Code: ${ws.code}) ĐÃ CÓ Kho Xưởng => Bỏ qua.`);
    }
  }

  // Tự động chuyển các Tag đang kẹt ở trạng thái IN_WORKSHOP (vừa quét nhầm) sang Kho Xưởng tương ứng.
  // Vì luật LBAC mới ép mọi Tag IN_WORKSHOP không được export, nên ta phải fix luôn dữ liệu tồn.
  const stuckTags = await prisma.tag.findMany({
    where: {
      status: 'IN_WORKSHOP',
      locationRel: { type: 'WORKSHOP' }
    },
    include: { locationRel: true }
  });

  if (stuckTags.length > 0) {
    console.log(`\nPhát hiện ${stuckTags.length} thẻ đang bị kẹt ở trạng thái IN_WORKSHOP (chưa vào kho). Đang di chuyển dữ liệu vào Kho Xưởng...`);
    
    for (const tag of stuckTags) {
       const workshopWarehouse = await prisma.location.findFirst({
         where: { parentId: tag.locationId, type: 'WORKSHOP_WAREHOUSE', deletedAt: null }
       });
       if (workshopWarehouse) {
          await prisma.tag.update({
             where: { id: tag.id },
             data: {
               status: 'IN_WAREHOUSE',
               locationId: workshopWarehouse.id
             }
          });
       }
    }
    console.log(`Đã di chuyển thành công các thẻ kẹt vào Kho Xưởng!`);
  }

  console.log(`\nHoàn thành! Đã tạo ${createdCount} Kho Xưởng mới.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
