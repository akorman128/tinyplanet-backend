import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

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
    type: () => User,
    description: 'User who created this invite code',
  })
  createdBy: User;

  @ApiProperty({
    type: () => User,
    description: 'User who used this invite code',
  })
  usedBy?: User | null;

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
