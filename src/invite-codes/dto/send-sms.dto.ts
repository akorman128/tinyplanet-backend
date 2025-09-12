import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number to send SMS to (E.164 format)',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
