import { IsOptional } from 'class-validator';
import { PaginationInput } from '../../common-dto/pagination.dto';
import { Type } from 'class-transformer';

export class FindAllDto {
  @IsOptional()
  @Type(() => PaginationInput)
  pagination: PaginationInput;
}
