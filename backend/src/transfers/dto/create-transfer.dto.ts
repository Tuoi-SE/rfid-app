import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  sourceId: string;  // Location ADMIN

  @IsUUID()
  destinationId: string;  // Location WORKSHOP

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  tagIds: string[];
}
