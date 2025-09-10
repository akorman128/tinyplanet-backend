import { IsOptional } from 'class-validator';
import { PaginationInput } from '../../common-dto/pagination.dto';
import { Type } from 'class-transformer';

export class QueryInviteCodeDto {
  @IsOptional()
  @Type(() => PaginationInput)
  pagination: PaginationInput;
}
