import { Router } from 'express';
import { prisma, io } from '../index';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Lấy lịch sử phiên quét
router.get('/', requireAuth, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        _count: {
          select: { scans: true }
        }
      }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Tạo phiên quét mới
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, scans } = req.body;
    // scans: array of { epc: string, rssi: number, time: Date/string }
    
    const session = await prisma.session.create({
      data: {
        name,
        totalTags: scans ? scans.length : 0,
        endedAt: new Date(),
        scans: {
          create: scans ? scans.map((s: any) => ({
            tag: {
              connectOrCreate: {
                where: { epc: s.epc },
                create: { epc: s.epc, name: 'Unknown Tag' }
              }
            },
            rssi: s.rssi,
            scannedAt: new Date(s.time)
          })) : []
        }
      },
      include: {
        scans: true
      }
    });

    io.emit('sessionCreated', session);
    res.json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session & save scans' });
  }
});

// Chi tiết 1 phiên
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        scans: {
          include: { tag: true }
        }
      }
    });
    
    // Gộp kết quả quét (mỗi tag 1 dòng với RSSI cao nhất hoặc lần quét cuối)
    if (session) {
      const mergedScans = session.scans.reduce((acc: any, scan) => {
        if (!acc[scan.tagEpc] || acc[scan.tagEpc].scannedAt < scan.scannedAt) {
          acc[scan.tagEpc] = scan;
        }
        return acc;
      }, {});
      
      const sessionResult = {
        ...session,
        scans: Object.values(mergedScans)
      };
      return res.json(sessionResult);
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session metadata' });
  }
});

export default router;
