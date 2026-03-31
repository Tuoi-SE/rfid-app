import { IsArray, IsOptional } from 'class-validator';

export class ConfirmTransferDto {
  @IsOptional()
  @IsArray()
  scans?: { epc: string }[];
}
