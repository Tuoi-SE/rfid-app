import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BatchScanService, MAX_BUFFER_SIZE } from '../scanning/batch-scan.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TAGS_UPDATED_EVENT } from '@common/interfaces/scan.interface';

interface ScanPayload {
  epc: string;
  rssi: number;
}

@WebSocketGateway({
  cors: true, // CORS sẽ được inject động qua afterInit
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private batchScanService: BatchScanService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    // Subscribe to tags:updated event from InventoryService via EventEmitter2 (D-01, D-03)
    this.eventEmitter.on(TAGS_UPDATED_EVENT, () => {
      this.emitTagsUpdated();
    });
  }

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

  @SubscribeMessage('batchScan')
  async handleBatchScan(
    @ConnectedSocket() client: Socket,
    @MessageBody() epcs: string[],
  ) {
    if (!epcs?.length) {
      return { success: false, error: 'No EPCs provided' };
    }

    // Extract userId from JWT payload
    const userId = (client as any).user?.id || (client as any).user?.sub || 'system';

    // D-05: Reject batches exceeding MAX_BUFFER_SIZE
    if (epcs.length > MAX_BUFFER_SIZE) {
      return { success: false, error: `Batch size exceeds MAX_BUFFER_SIZE (${MAX_BUFFER_SIZE})` };
    }

    // D-02: D-04: Process each EPC through buffer
    let processedCount = 0;
    for (const epc of epcs) {
      const result = await this.batchScanService.addEpc(epc, -60, userId);
      if (result.flushed) {
        processedCount += result.bufferSize;
      }
    }

    // D-01: Flush remaining buffer and get final count
    const flushResult = await this.batchScanService.flush(userId);
    processedCount += flushResult.processed;

    // D-01: Return processed count (sync processing)
    return {
      success: true,
      processed: processedCount,
      timestamp: new Date().toISOString(),
    };
  }

  emitTagsUpdated() {
    this.server.emit('tagsUpdated');
  }

  emitLiveScan(scans: { epc: string; rssi: number }[]) {
    this.server.to('scan:live').emit('liveScan', scans);
  }

  emitSessionCreated(session: unknown) {
    this.server.emit('sessionCreated', session);
  }
}
