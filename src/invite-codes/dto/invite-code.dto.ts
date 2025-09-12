import { ApiProperty } from '@nestjs/swagger';

export class InviteCodeDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'ABC123DEF' })
  code: string;

  @ApiProperty()
  createdById: number;

  @ApiProperty()
  usedById?: number | null;

  @ApiProperty()
  usedAt?: Date | null;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
