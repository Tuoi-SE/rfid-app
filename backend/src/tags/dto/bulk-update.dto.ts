import { IsArray, IsString, IsUUID, ArrayMinSize } from 'class-validator';

export class AssignTagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tagIds: string[];

  @IsUUID()
  productId: string;
}
