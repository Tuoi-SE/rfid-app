import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const ASSIGN_SESSION_STRATEGIES = ['UNASSIGNED_ONLY', 'OVERWRITE_ALL'] as const;
export type AssignSessionStrategy = typeof ASSIGN_SESSION_STRATEGIES[number];

export class AssignSessionProductDto {
  @ApiProperty({ example: 'product-id-uuid', description: 'ID sản phẩm cần gán' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({
    enum: ASSIGN_SESSION_STRATEGIES,
    description: 'Chiến lược gán: chỉ thẻ chưa gán hoặc gán đè toàn bộ',
  })
  @IsOptional()
  @IsIn(ASSIGN_SESSION_STRATEGIES)
  strategy?: AssignSessionStrategy;
}

