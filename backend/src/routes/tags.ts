import { Router } from 'express';
import { prisma, io } from '../index';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Lấy danh sách tags
router.get('/', requireAuth, async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(tags);
  } catch (error) {
    console.error('Fetch tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Thêm tag mới
router.post('/', requireAuth, async (req, res) => {
  try {
    const { epc, name, category, location, description } = req.body;
    const tag = await prisma.tag.create({
      data: { epc, name, category, location, description }
    });
    io.emit('tagsUpdated'); // Broadcast update
    res.json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Broadcast live scan từ thiết bị Mobile
router.post('/live', async (req, res) => {
  try {
    const scans: { epc: string, rssi: number }[] = req.body;
    if (!scans || !Array.isArray(scans)) {
      return res.status(400).json({ error: 'Invalid payload format' });
    }
    
    // Phát ngay lập tức tệp EPC thu được xuống Web Client đang nghe
    io.emit('liveScan', scans);
    res.json({ success: true, count: scans.length });
  } catch (error) {
    console.error('Live scan broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast live scan' });
  }
});

// Cập nhật tag hàng loạt (Bulk Update)
router.patch('/bulk', requireAuth, async (req, res) => {
  try {
    const updates: { epc: string, name: string, category?: string, location?: string }[] = req.body;
    
    // Prisma transaction cho bulk update
    const transactions = updates.map(update => 
      prisma.tag.upsert({
        where: { epc: update.epc },
        update: { 
          name: update.name,
          category: update.category,
          location: update.location
        },
        create: {
          epc: update.epc,
          name: update.name,
          category: update.category,
          location: update.location
        }
      })
    );
    
    await prisma.$transaction(transactions);
    io.emit('tagsUpdated'); // Broadcast update realtime đến Mobile App
    res.json({ success: true, count: updates.length });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to bulk-update tags' });
  }
});

// Cập nhật 1 tag
router.patch('/:epc', requireAuth, async (req, res) => {
  try {
    const epc = req.params.epc as string;
    const tag = await prisma.tag.update({
      where: { epc },
      data: req.body
    });
    io.emit('tagsUpdated');
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Xóa tag
router.delete('/:epc', requireAuth, async (req, res) => {
  try {
    const epc = req.params.epc as string;
    await prisma.tag.delete({ where: { epc } });
    io.emit('tagsUpdated');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
