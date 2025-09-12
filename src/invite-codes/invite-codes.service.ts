import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InviteCodeRepository } from './infrastructure/persistence/invite-code.repository';
import { InviteCode } from './domain/invite-code';
import { UpdateInviteCodeDto } from './dto/update-invite-code.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class InviteCodesService {
  constructor(
    private readonly inviteCodeRepository: InviteCodeRepository,
    private readonly smsService: SmsService,
  ) {}

  readonly MAX_CODES_PER_MONTH = 3;
  readonly VALID_DAYS = 1;

  async create(createdById: number | string): Promise<InviteCode> {
    // Generate unique random code
    let code: string;
    let existingCode: InviteCode | null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const usedCodesThisMonth = await this.inviteCodeRepository.findByCreatedBy(
      Number(createdById),
      {
        start: startOfMonth,
        end: endOfMonth,
      },
    );

    if (usedCodesThisMonth.length >= this.MAX_CODES_PER_MONTH) {
      throw new BadRequestException(
        `You have reached the maximum number of codes per month (${this.MAX_CODES_PER_MONTH})`,
      );
    }

    do {
      // keep generating codes until we find a unique one
      code = this.generateRandomCode();
      existingCode = await this.inviteCodeRepository.findByCode(code);
    } while (existingCode);

    // Set expiration date (default 7 days from now)
    const expiresAt = new Date(
      Date.now() + this.VALID_DAYS * 24 * 60 * 60 * 1000,
    );

    return await this.inviteCodeRepository.create({
      code,
      createdById,
      expiresAt,
    });
  }

  async findAll(paginationOptions: IPaginationOptions): Promise<InviteCode[]> {
    return await this.inviteCodeRepository.findAllWithPagination({
      paginationOptions,
    });
  }

  async findOne(id: number): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findById(id);
    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }
    return inviteCode;
  }

  async findByCode(code: string): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findByCode(code);
    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }
    return inviteCode;
  }

  async findByCreatedBy(
    userId: number,
    dateRange?: { start: Date; end: Date },
  ): Promise<InviteCode[]> {
    return await this.inviteCodeRepository.findByCreatedBy(userId, dateRange);
  }

  async useInviteCode(input: {
    code: string;
    usedById: number;
  }): Promise<InviteCode> {
    const { code, usedById } = input;
    const inviteCode = await this.inviteCodeRepository.findByCode(code);

    if (!inviteCode) {
      throw new BadRequestException('Invalid or expired invite code');
    }

    if (inviteCode.usedById) {
      throw new BadRequestException('Invite code has already been used');
    }

    if (inviteCode.expiresAt < new Date()) {
      throw new BadRequestException('Invite code has expired');
    }

    return await this.inviteCodeRepository.update(Number(inviteCode.id), {
      usedById: usedById,
      usedAt: new Date().toISOString(),
    });
  }

  async update(
    id: number,
    updateInviteCodeDto: UpdateInviteCodeDto,
  ): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findById(id);
    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    return await this.inviteCodeRepository.update(id, updateInviteCodeDto);
  }

  async remove(id: number): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findById(id);
    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    await this.inviteCodeRepository.remove(id);
  }

  async sendSms(inviteCode: InviteCode, phoneNumber: string): Promise<void> {
    const message = `You lucky frikn duck. Your Tiny Planet invite code is: 
                    ${inviteCode.code}. Valid for 24 hours. Use it or lose it.`;

    const result = await this.smsService.sendSmsWithRetry({
      to: phoneNumber,
      body: message,
    });

    if (!result.success) {
      throw new BadRequestException(`Failed to send SMS: ${result.error}`);
    }
  }

  private generateRandomCode(): string {
    // Use crypto-safe random generation for better security
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    // Generate 8 character code
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars.charAt(randomIndex);
    }

    return result;
  }
}
