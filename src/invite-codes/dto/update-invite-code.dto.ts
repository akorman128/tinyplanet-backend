import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateInviteCodeDto {
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'New expiration date',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  usedById?: number;

  @IsOptional()
  @IsDateString()
  usedAt?: string;
}
