import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInviteCodeDto } from './create-invite-code.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateInviteCodeDto extends PartialType(CreateInviteCodeDto) {
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'New expiration date',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
