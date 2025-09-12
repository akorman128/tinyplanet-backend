import { ApiProperty } from '@nestjs/swagger';

const idType = Number;

export class InviteCode {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'ABC123DEF',
    description: 'Unique invite code',
  })
  code: string;

  @ApiProperty({
    type: idType,
    description: 'ID of user who created this invite code',
  })
  createdById: number | string;

  @ApiProperty({
    type: idType,
    description: 'ID of user who used this invite code',
    required: false,
  })
  usedById?: number | string | null;

  @ApiProperty({
    type: Date,
    description: 'When the invite code was used',
  })
  usedAt?: Date | null;

  @ApiProperty({
    type: Date,
    description: 'When the invite code expires',
  })
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
