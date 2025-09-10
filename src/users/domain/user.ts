import { Exclude, Expose } from 'class-transformer';
import { FileType } from '../../files/domain/file';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';
import { ApiProperty } from '@nestjs/swagger';

const idType = Number;

export class User {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @Expose({ groups: ['me', 'admin'] })
  socialId?: string | null;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    type: () => FileType,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  role?: Role | null;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;

  @ApiProperty({
    type: Date,
    example: '1990-01-01',
    description: 'User birthday',
  })
  birthday?: Date | null;

  @ApiProperty({
    type: String,
    example: 'New York, NY',
    description: 'User hometown',
  })
  hometown?: string | null;

  @ApiProperty({
    type: 'object',
    example: { type: 'Point', coordinates: [-74.006, 40.7128] },
    description: 'Current location coordinates (longitude, latitude)',
    additionalProperties: true,
  })
  currentLocation?: { type: 'Point'; coordinates: [number, number] } | null;

  @ApiProperty({
    type: String,
    example: 'ABC123DEF',
    description: 'Invite code used to join',
  })
  inviteCode?: string | null;

  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Number of invite codes remaining',
  })
  invitesRemaining: number;
}
