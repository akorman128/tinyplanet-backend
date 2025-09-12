import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { InviteCodesService } from './invite-codes.service';
import { UseInviteCodeDto } from './dto/use-invite-code.dto';
import { FindAllDto } from './dto/find-all.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { InviteCode } from './domain/invite-code';

@ApiTags('Invite Codes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'invite-codes',
  version: '1',
})
export class InviteCodesController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Post('create')
  async create(@Request() request): Promise<InviteCode> {
    return this.inviteCodesService.create(request.user);
  }

  @Get('get-codes')
  async getInviteCodes(@Request() request): Promise<InviteCode[]> {
    return this.inviteCodesService.findByCreatedBy(request.user.id);
  }

  @Post('use')
  async useInviteCode(
    @Body() useInviteCodeDto: UseInviteCodeDto,
    @Request() request,
  ): Promise<InviteCode> {
    const { code } = useInviteCodeDto;
    return this.inviteCodesService.useInviteCode({
      code,
      usedById: request.user.id,
    });
  }

  @Post(':code/send')
  async sendSms(
    @Param('code') code: string,
    @Body() sendSmsDto: SendSmsDto,
  ): Promise<{ message: string }> {
    const { phoneNumber } = sendSmsDto;
    const inviteCode = await this.inviteCodesService.findByCode(code);
    await this.inviteCodesService.sendSms(inviteCode, phoneNumber);
    return { message: 'SMS sent successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.inviteCodesService.remove(+id);
  }

  @Get(':id')
  @SerializeOptions({
    groups: ['admin'],
  })
  async findOne(@Param('id') id: number): Promise<InviteCode> {
    return await this.inviteCodesService.findOne(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(@Query() query: FindAllDto): Promise<InviteCode[]> {
    const page = query?.pagination.offset;
    const limit = query?.pagination.limit;
    return await this.inviteCodesService.findAll({
      page,
      limit,
    });
  }
}
