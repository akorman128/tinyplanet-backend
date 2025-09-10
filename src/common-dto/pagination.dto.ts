import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsEnum, IsNumberString } from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationInput {
  @IsNumber()
  @IsOptional()
  offset: number = 0;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Math.min(30, value))
  limit: number = 30;

  @IsOptional()
  orderBy?: string;

  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.ASC;
}

export class RedisPaginationInput {
  @IsNumberString()
  @IsOptional()
  cursor: string = '0';

  @IsNumber()
  @IsOptional()
  offset: number = 0;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Math.min(30, value))
  limit: number = 30;
}
