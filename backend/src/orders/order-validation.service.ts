import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { BusinessException } from '@common/exceptions/business.exception';
import { INBOUND_ALLOWED_DESTINATION_TYPES, OUTBOUND_ALLOWED_DESTINATION_TYPES } from '@common/constants/location-types.constant';

@Injectable()
export class OrderValidationService {
  constructor(private prisma: PrismaService) {}

  async validateInboundDestination(
    locationId?: string,
    fallbackLocationId?: string,
  ) {
    const resolvedLocationId = locationId || fallbackLocationId;
    if (!resolvedLocationId) {
      throw new BusinessException(
        'Phiếu nhập kho bắt buộc chọn nơi nhập.',
        'INBOUND_DESTINATION_REQUIRED',
        HttpStatus.BAD_REQUEST,
      );
    }

    const destination = await this.prisma.location.findFirst({
      where: { id: resolvedLocationId, deletedAt: null },
      select: { id: true, type: true },
    });

    if (!destination) {
      throw new BusinessException(
        'Không tìm thấy vị trí nhận hàng cho phiếu nhập kho.',
        'LOCATION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!INBOUND_ALLOWED_DESTINATION_TYPES.includes(destination.type)) {
      throw new BusinessException(
        'Nơi nhập kho không hợp lệ. Chỉ hỗ trợ: kho xưởng hoặc kho tổng.',
        'INBOUND_DESTINATION_INVALID',
        HttpStatus.BAD_REQUEST,
      );
    }

    return destination.id;
  }

  async validateOutboundDestination(locationId?: string) {
    if (!locationId) {
      throw new BusinessException(
        'Phiếu xuất kho bắt buộc chọn nơi xuất đến.',
        'OUTBOUND_DESTINATION_REQUIRED',
        HttpStatus.BAD_REQUEST,
      );
    }

    const destination = await this.prisma.location.findFirst({
      where: { id: locationId, deletedAt: null },
      select: { id: true, type: true },
    });

    if (!destination) {
      throw new BusinessException(
        'Không tìm thấy vị trí đích cho phiếu xuất kho.',
        'LOCATION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!OUTBOUND_ALLOWED_DESTINATION_TYPES.includes(destination.type)) {
      throw new BusinessException(
        'Nơi xuất đến không hợp lệ. Chỉ hỗ trợ: kho tổng, kho xưởng hoặc khách hàng.',
        'OUTBOUND_DESTINATION_INVALID',
        HttpStatus.BAD_REQUEST,
      );
    }

    return destination.id;
  }

  async ensureManagerCanAccessOrder(
    order: { createdById?: string | null },
    user: { id: string; role: string; locationId?: string },
  ) {
    if (user.role !== 'WAREHOUSE_MANAGER') return;

    if (order.createdById !== user.id) {
      throw new BusinessException(
        'Không có quyền truy cập đơn hàng của manager khác',
        'ORDER_FORBIDDEN',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
