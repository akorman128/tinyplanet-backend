import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { UpdateInviteCodeDto } from './dto/update-invite-code.dto';
import { UseInviteCodeDto } from './dto/use-invite-code.dto';
import { InviteCodeDto } from './dto/invite-code.dto';
import { QueryInviteCodeDto } from './dto/query-invite-code.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Invite Codes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'invite-codes',
  version: '1',
})
export class InviteCodesController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: InviteCodeDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async create(
    @Body() createInviteCodeDto: CreateInviteCodeDto,
    @Request() request,
  ): Promise<InviteCodeDto> {
    return this.inviteCodesService.create(createInviteCodeDto, request.user);
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
  async findAll(
    @Query() query: QueryInviteCodeDto,
  ): Promise<InfinityPaginationResponseDto<InviteCodeDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const data = await this.inviteCodesService.findAll({
      page,
      limit,
    });

    return infinityPagination(data, { page, limit });
  }

  @Get('my-codes')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InviteCodeDto],
  })
  async findMyInviteCodes(@Request() request): Promise<InviteCodeDto[]> {
    return this.inviteCodesService.findByCreatedBy(Number(request.user.id));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    type: InviteCodeDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findOne(@Param('id') id: string): Promise<InviteCodeDto> {
    return this.inviteCodesService.findOne(+id);
  }

  @Post('use')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    type: InviteCodeDto,
  })
  async useInviteCode(
    @Body() useInviteCodeDto: UseInviteCodeDto,
    @Request() request,
  ): Promise<InviteCodeDto> {
    return this.inviteCodesService.useInviteCode(
      useInviteCodeDto.code,
      request.user,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    type: InviteCodeDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async update(
    @Param('id') id: string,
    @Body() updateInviteCodeDto: UpdateInviteCodeDto,
  ): Promise<InviteCodeDto> {
    return this.inviteCodesService.update(+id, updateInviteCodeDto);
  }

  @Post(':id/send-sms')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS sent successfully',
  })
  async sendSms(
    @Param('id') id: string,
    @Body() sendSmsDto: SendSmsDto,
  ): Promise<{ message: string }> {
    const inviteCode = await this.inviteCodesService.findOne(+id);
    await this.inviteCodesService.sendSms(inviteCode, sendSmsDto.phoneNumber);
    return { message: 'SMS sent successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SerializeOptions({
    groups: ['admin'],
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.inviteCodesService.remove(+id);
  }
}
