import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class UseInviteCodeDto {
  @ApiProperty({
    example: 'ABC123DEF',
    description: 'The invite code to use',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Transform(({ value }) => value?.toUpperCase())
  code: string;
}
