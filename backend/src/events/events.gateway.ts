import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface ScanPayload {
  epc: string;
  rssi: number;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGINS?.split(',') || '*' },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      (client as any).user = payload;

      // Admin joins admin room for dashboard updates
      if (payload.role === 'ADMIN') {
        client.join('admin:dashboard');
      }
      client.join('scan:live');
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup handled by socket.io
  }

  @SubscribeMessage('scanStream')
  async handleScanStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() scans: ScanPayload[],
  ) {
    if (!scans?.length) return;

    const epcs = scans.map((s) => s.epc);

    // 1. Find existing tags
    const existingTags = await this.prisma.tag.findMany({
      where: { epc: { in: epcs } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const tagMap = new Map(existingTags.map((t) => [t.epc, t]));

    // 2. Auto-create unknown tags
    const unknownEpcs = epcs.filter((epc) => !tagMap.has(epc));
    if (unknownEpcs.length > 0) {
      const uniqueUnknown = [...new Set(unknownEpcs)];
      await this.prisma.tag.createMany({
        data: uniqueUnknown.map((epc) => ({ epc })),
        skipDuplicates: true,
      });

      // Fetch newly created tags
      const newTags = await this.prisma.tag.findMany({
        where: { epc: { in: uniqueUnknown } },
        include: { product: { select: { id: true, name: true, sku: true, category: { select: { id: true, name: true } } } } },
      });
      newTags.forEach((t) => tagMap.set(t.epc, t));
    }

    // 3. Build enriched response with SYSTEM IDs (not raw EPCs)
    const enrichedScans = scans.map((scan) => {
      const tag = tagMap.get(scan.epc)!;
      return {
        tagId: tag.id,          // ← System UUID (hiển thị trên web)
        epc: scan.epc,          // ← Mã gốc RFID (tham khảo)
        rssi: scan.rssi,
        status: tag.status,
        product: tag.product,   // ← null nếu chưa gắn sản phẩm
        isNew: unknownEpcs.includes(scan.epc),
      };
    });

    // Emit to scanning room
    this.server.to('scan:live').emit('scanDetected', enrichedScans);

    // Emit summary to admin dashboard
    const summary = {
      totalScanned: scans.length,
      existingTags: enrichedScans.filter((s) => !s.isNew).length,
      newTags: enrichedScans.filter((s) => s.isNew).length,
      timestamp: new Date().toISOString(),
    };
    this.server.to('admin:dashboard').emit('inventoryUpdate', summary);

    return { success: true, count: enrichedScans.length };
  }

  emitTagsUpdated() {
    this.server.emit('tagsUpdated');
  }

  emitLiveScan(scans: { epc: string; rssi: number }[]) {
    this.server.to('scan:live').emit('liveScan', scans);
  }

  emitSessionCreated(session: any) {
    this.server.emit('sessionCreated', session);
  }
}
