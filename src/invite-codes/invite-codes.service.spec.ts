import { Test, TestingModule } from '@nestjs/testing';
import { InviteCodesService } from './invite-codes.service';
import { InviteCodeRepository } from './infrastructure/persistence/invite-code.repository';
import { SmsService } from '../sms/sms.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InviteCode } from './domain/invite-code';

describe('InviteCodesService', () => {
  let service: InviteCodesService;
  let inviteCodeRepository: jest.Mocked<InviteCodeRepository>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteCodesService,
        {
          provide: InviteCodeRepository,
          useValue: {
            create: jest.fn(),
            findByCode: jest.fn(),
            findByCreatedBy: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findAllWithPagination: jest.fn(),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendSmsWithRetry: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InviteCodesService>(InviteCodesService);
    inviteCodeRepository = module.get(InviteCodeRepository);
    smsService = module.get(SmsService);
  });

  describe('create', () => {
    it('should create invite code successfully', async () => {
      const createdById = 123;
      const mockInviteCode = {
        id: 1,
        code: 'ABC123',
        createdById,
        usedById: null,
        usedAt: null,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InviteCode;

      inviteCodeRepository.findByCreatedBy.mockResolvedValue([]);
      inviteCodeRepository.findByCode.mockResolvedValue(null);
      inviteCodeRepository.create.mockResolvedValue(mockInviteCode);

      const result = await service.create(createdById);

      expect(result).toEqual(mockInviteCode);
      expect(inviteCodeRepository.findByCreatedBy).toHaveBeenCalledWith(
        createdById,
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        }),
      );
      expect(inviteCodeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdById,
          code: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should throw when monthly limit exceeded', async () => {
      const createdById = 123;
      const existingCodes = new Array(3).fill({}).map((_, i) => ({
        id: i + 1,
        code: `CODE${i}`,
        createdById,
      })) as InviteCode[];

      inviteCodeRepository.findByCreatedBy.mockResolvedValue(existingCodes);

      await expect(service.create(createdById)).rejects.toThrow(
        BadRequestException,
      );

      expect(inviteCodeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('useInviteCode', () => {
    it('should redeem code successfully', async () => {
      const code = 'ABC123';
      const usedById = 456;
      const mockInviteCode = {
        id: 1,
        code,
        createdById: 123,
        usedById: null,
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InviteCode;

      const updatedInviteCode = {
        ...mockInviteCode,
        usedById,
        usedAt: new Date(),
      };

      inviteCodeRepository.findByCode.mockResolvedValue(mockInviteCode);
      inviteCodeRepository.update.mockResolvedValue(updatedInviteCode);

      const result = await service.useInviteCode({ code, usedById });

      expect(result.usedById).toBe(usedById);
      expect(inviteCodeRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          usedById,
          usedAt: expect.any(String),
        }),
      );
    });

    it('should throw when code already used', async () => {
      const code = 'ABC123';
      const usedById = 456;
      const mockInviteCode = {
        id: 1,
        code,
        createdById: 123,
        usedById: 789,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      } as InviteCode;

      inviteCodeRepository.findByCode.mockResolvedValue(mockInviteCode);

      await expect(service.useInviteCode({ code, usedById })).rejects.toThrow(
        BadRequestException,
      );

      expect(inviteCodeRepository.update).not.toHaveBeenCalled();
    });

    it('should throw when code not found', async () => {
      const code = 'INVALID';
      const usedById = 456;

      inviteCodeRepository.findByCode.mockResolvedValue(null);

      await expect(service.useInviteCode({ code, usedById })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when code is expired', async () => {
      const code = 'ABC123';
      const usedById = 456;
      const mockInviteCode = {
        id: 1,
        code,
        createdById: 123,
        usedById: null,
        usedAt: null,
        expiresAt: new Date(Date.now() - 86400000), // expired
      } as InviteCode;

      inviteCodeRepository.findByCode.mockResolvedValue(mockInviteCode);

      await expect(service.useInviteCode({ code, usedById })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sendSms', () => {
    it('should send SMS successfully', async () => {
      const phoneNumber = '+1234567890';
      const mockInviteCode = {
        id: 1,
        code: 'ABC123',
        createdById: 123,
      } as InviteCode;

      smsService.sendSmsWithRetry.mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      });

      await service.sendSms(mockInviteCode, phoneNumber);

      expect(smsService.sendSmsWithRetry).toHaveBeenCalledWith({
        to: phoneNumber,
        body: expect.stringContaining('ABC123'),
      });
    });

    it('should throw when SMS fails', async () => {
      const phoneNumber = '+1234567890';
      const mockInviteCode = {
        id: 1,
        code: 'ABC123',
        createdById: 123,
      } as InviteCode;

      smsService.sendSmsWithRetry.mockResolvedValue({
        success: false,
        error: 'SMS failed',
      });

      await expect(
        service.sendSms(mockInviteCode, phoneNumber),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return invite code when found', async () => {
      const id = 1;
      const mockInviteCode = { id, code: 'ABC123' } as InviteCode;

      inviteCodeRepository.findById.mockResolvedValue(mockInviteCode);

      const result = await service.findOne(id);

      expect(result).toEqual(mockInviteCode);
    });

    it('should throw when not found', async () => {
      const id = 999;

      inviteCodeRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });
});
