import { IsEnum, IsArray, ValidateNested, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 'xxx-yyy-zzz', description: 'ID của sản phẩm' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 50, description: 'Số lượng đặt' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, example: 'INBOUND', description: 'Loại đơn hàng' })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ example: 'loc-uuid-123', description: 'ID Vị trí tạo order', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ type: [OrderItemDto], description: 'Danh sách sản phẩm' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
