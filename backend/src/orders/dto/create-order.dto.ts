import { IsEnum, IsArray, ValidateNested, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '@prisma/client';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsEnum(OrderType)
  type: OrderType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
