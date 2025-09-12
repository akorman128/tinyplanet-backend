import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UseInviteCodeDto {
  @ApiProperty({
    example: 'ABC123DEF',
    description: 'The invite code to use',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  code: string;
}
