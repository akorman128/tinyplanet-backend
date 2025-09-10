import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

export class InviteCodeDto {
  @ApiProperty()
  id: number | string;

  @ApiProperty({ example: 'ABC123DEF' })
  code: string;

  @ApiProperty({ type: () => User })
  createdBy: User;

  @ApiProperty({ type: () => User })
  usedBy?: User | null;

  @ApiProperty()
  usedAt?: Date | null;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
