import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'E200001B641401340910A381', description: 'Mã định danh chíp RFID (EPC)' })
  @IsString()
  @MaxLength(100)
  epc: string;
}
