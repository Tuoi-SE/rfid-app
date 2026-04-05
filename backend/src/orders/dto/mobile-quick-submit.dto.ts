import { IsEnum, IsArray, IsString, IsOptional } from 'class-validator';
import { OrderType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class MobileQuickSubmitDto {
  @ApiProperty({ enum: OrderType, example: 'INBOUND', description: 'Loại đơn hàng (Nhập/Xuất)' })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({
    example: 'loc-uuid-123',
    description: 'ID vị trí liên quan đến order. OUTBOUND: nơi xuất đến. INBOUND: tự động lấy kho của manager.',
    required: false,
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Danh sách EPC đã quét', type: [String] })
  @IsArray()
  @IsString({ each: true })
  epcs: string[];
}
