import { IsString, IsOptional } from 'class-validator';

// D-03: Only name and address are editable, type is fixed after creation
export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // Explicitly exclude type and code - they cannot be changed
}
