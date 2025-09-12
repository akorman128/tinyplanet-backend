import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RelationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
