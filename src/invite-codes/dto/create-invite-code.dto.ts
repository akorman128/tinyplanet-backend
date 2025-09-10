import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class CreateInviteCodeDto {
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description:
      'Expiration date. If not provided, defaults to 30 days from creation',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
