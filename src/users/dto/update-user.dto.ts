import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

import { Transform, Type } from 'class-transformer';
import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { RoleDto } from '../../roles/dto/role.dto';
import { StatusDto } from '../../statuses/dto/status.dto';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(6)
  password?: string;

  provider?: string;

  socialId?: string | null;

  @ApiPropertyOptional({ example: 'John', type: String })
  @IsOptional()
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Doe', type: String })
  @IsOptional()
  lastName?: string | null;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  photo?: FileDto | null;

  @ApiPropertyOptional({ type: () => RoleDto })
  @IsOptional()
  @Type(() => RoleDto)
  role?: RoleDto | null;

  @ApiPropertyOptional({ type: () => StatusDto })
  @IsOptional()
  @Type(() => StatusDto)
  status?: StatusDto;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'User birthday',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  birthday?: Date | null;

  @ApiPropertyOptional({
    example: 'New York, NY',
    description: 'User hometown',
  })
  @IsOptional()
  hometown?: string | null;

  @ApiPropertyOptional({
    example: { type: 'Point', coordinates: [-74.006, 40.7128] },
    description: 'Current location coordinates (longitude, latitude)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  currentLocation?: { type: 'Point'; coordinates: [number, number] } | null;

  @ApiPropertyOptional({
    example: 'ABC123DEF',
    description: 'Invite code used to join',
  })
  @IsOptional()
  inviteCode?: string | null;

  @ApiPropertyOptional({
    example: 3,
    description: 'Number of invite codes remaining',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  invitesRemaining?: number;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number in E.164 format',
  })
  @IsOptional()
  phoneNumber?: string | null;
}
