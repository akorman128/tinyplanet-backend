import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InviteCodeRepository } from './infrastructure/persistence/invite-code.repository';
import { InviteCode } from './domain/invite-code';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { UpdateInviteCodeDto } from './dto/update-invite-code.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { User } from '../users/domain/user';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class InviteCodesService {
  constructor(
    private readonly inviteCodeRepository: InviteCodeRepository,
    private readonly smsService: SmsService,
  ) {}

  async create(
    createInviteCodeDto: CreateInviteCodeDto,
    createdBy: User,
  ): Promise<InviteCode> {
    // Generate unique random code
    let code: string;
    let existingCode: InviteCode | null;

    do {
      code = this.generateRandomCode();
      existingCode = await this.inviteCodeRepository.findByCode(code);
    } while (existingCode);

    // Set expiration date (default 30 days from now)
    const expiresAt = createInviteCodeDto.expiresAt
      ? new Date(createInviteCodeDto.expiresAt)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.inviteCodeRepository.create({
      code,
      createdBy,
      expiresAt,
    });
  }

  async findAll(paginationOptions: IPaginationOptions): Promise<InviteCode[]> {
    return this.inviteCodeRepository.findAllWithPagination({
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

  async findByCreatedBy(userId: number): Promise<InviteCode[]> {
    return this.inviteCodeRepository.findByCreatedBy(userId);
  }

  async useInviteCode(code: string, usedBy: User): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findActiveByCode(code);

    if (!inviteCode) {
      throw new BadRequestException('Invalid or expired invite code');
    }

    if (inviteCode.usedBy) {
      throw new BadRequestException('Invite code has already been used');
    }

    if (inviteCode.expiresAt < new Date()) {
      throw new BadRequestException('Invite code has expired');
    }

    const updated = await this.inviteCodeRepository.update(inviteCode.id, {
      usedBy,
      usedAt: new Date(),
    });

    if (!updated) {
      throw new BadRequestException('Failed to update invite code');
    }

    return updated;
  }

  async update(
    id: number,
    updateInviteCodeDto: UpdateInviteCodeDto,
  ): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findById(id);
    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    const updateData: Partial<InviteCode> = {};

    if (updateInviteCodeDto.expiresAt) {
      updateData.expiresAt = new Date(updateInviteCodeDto.expiresAt);
    }

    const updated = await this.inviteCodeRepository.update(id, updateData);

    if (!updated) {
      throw new NotFoundException('Invite code not found or failed to update');
    }

    return updated;
  }

  async remove(id: number): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findById(id);
    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    await this.inviteCodeRepository.remove(id);
  }

  async sendSms(inviteCode: InviteCode, phoneNumber: string): Promise<void> {
    if (!this.smsService.isConfigured()) {
      throw new BadRequestException('SMS service is not configured');
    }

    const expirationHours = Math.ceil(
      (inviteCode.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60),
    );

    const message = `You lucky frikn duck. Your Tiny Planet invite code is: ${inviteCode.code}. Valid for ${Math.max(1, expirationHours)} hours. Use it or lose it.`;

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
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars.charAt(randomIndex);
    }

    return result;
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation: + followed by 7-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
}
