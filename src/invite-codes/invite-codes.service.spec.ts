import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InviteCodesService } from './invite-codes.service';
import { InviteCodeRepository } from './infrastructure/persistence/invite-code.repository';
import { InviteCode } from './domain/invite-code';
import { User } from '../users/domain/user';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { UpdateInviteCodeDto } from './dto/update-invite-code.dto';

describe('InviteCodesService', () => {
  let service: InviteCodesService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: { id: 1, name: 'user' },
    status: { id: 1, name: 'active' },
    provider: 'email',
    socialId: null,
    photo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  } as User;

  const mockInviteCode: InviteCode = {
    id: 1,
    code: 'ABC123DEF',
    createdBy: mockUser,
    usedBy: null,
    usedAt: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findActiveByCode: jest.fn(),
    findByCreatedBy: jest.fn(),
    findAllWithPagination: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteCodesService,
        {
          provide: InviteCodeRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InviteCodesService>(InviteCodesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create invite code correctly', async () => {
      const createDto: CreateInviteCodeDto = {};
      mockRepository.findByCode.mockResolvedValueOnce(null);
      mockRepository.create.mockResolvedValueOnce(mockInviteCode);

      const result = await service.create(createDto, mockUser);

      expect(result).toEqual(mockInviteCode);
      expect(mockRepository.findByCode).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith({
        code: expect.any(String),
        createdBy: mockUser,
        expiresAt: expect.any(Date),
      });
    });

    it('should generate unique code when collision occurs', async () => {
      const createDto: CreateInviteCodeDto = {};
      mockRepository.findByCode
        .mockResolvedValueOnce(mockInviteCode) // First code exists
        .mockResolvedValueOnce(null); // Second code is unique
      mockRepository.create.mockResolvedValueOnce(mockInviteCode);

      await service.create(createDto, mockUser);

      expect(mockRepository.findByCode).toHaveBeenCalledTimes(2);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should use provided expiration date', async () => {
      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const createDto: CreateInviteCodeDto = {
        expiresAt: expirationDate.toISOString(),
      };
      mockRepository.findByCode.mockResolvedValueOnce(null);
      mockRepository.create.mockResolvedValueOnce(mockInviteCode);

      await service.create(createDto, mockUser);

      expect(mockRepository.create).toHaveBeenCalledWith({
        code: expect.any(String),
        createdBy: mockUser,
        expiresAt: new Date(expirationDate),
      });
    });
  });

  describe('useInviteCode', () => {
    it('should reject non-existent invite codes', async () => {
      mockRepository.findActiveByCode.mockResolvedValueOnce(null);

      await expect(
        service.useInviteCode('NONEXISTENT', mockUser),
      ).rejects.toThrow(
        new BadRequestException('Invalid or expired invite code'),
      );
    });

    it('should reject already used invite codes', async () => {
      const usedInviteCode = {
        ...mockInviteCode,
        usedBy: { ...mockUser, id: 2 },
        usedAt: new Date(),
      };
      mockRepository.findActiveByCode.mockResolvedValueOnce(usedInviteCode);

      await expect(
        service.useInviteCode('ABC123DEF', mockUser),
      ).rejects.toThrow(
        new BadRequestException('Invite code has already been used'),
      );
    });

    it('should reject expired invite codes', async () => {
      const expiredInviteCode = {
        ...mockInviteCode,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      };
      mockRepository.findActiveByCode.mockResolvedValueOnce(expiredInviteCode);

      await expect(
        service.useInviteCode('ABC123DEF', mockUser),
      ).rejects.toThrow(new BadRequestException('Invite code has expired'));
    });

    it('should successfully use valid invite code', async () => {
      const updatedInviteCode = {
        ...mockInviteCode,
        usedBy: mockUser,
        usedAt: new Date(),
      };
      mockRepository.findActiveByCode.mockResolvedValueOnce(mockInviteCode);
      mockRepository.update.mockResolvedValueOnce(updatedInviteCode);

      const result = await service.useInviteCode('ABC123DEF', mockUser);

      expect(result).toEqual(updatedInviteCode);
      expect(mockRepository.update).toHaveBeenCalledWith(mockInviteCode.id, {
        usedBy: mockUser,
        usedAt: expect.any(Date),
      });
    });

    it('should handle failed update during use', async () => {
      mockRepository.findActiveByCode.mockResolvedValueOnce(mockInviteCode);
      mockRepository.update.mockResolvedValueOnce(null);

      await expect(
        service.useInviteCode('ABC123DEF', mockUser),
      ).rejects.toThrow(
        new BadRequestException('Failed to update invite code'),
      );
    });
  });

  describe('findByCode', () => {
    it('should find invite code by code', async () => {
      mockRepository.findByCode.mockResolvedValueOnce(mockInviteCode);

      const result = await service.findByCode('ABC123DEF');

      expect(result).toEqual(mockInviteCode);
      expect(mockRepository.findByCode).toHaveBeenCalledWith('ABC123DEF');
    });

    it('should throw NotFoundException for non-existent code', async () => {
      mockRepository.findByCode.mockResolvedValueOnce(null);

      await expect(service.findByCode('NONEXISTENT')).rejects.toThrow(
        new NotFoundException('Invite code not found'),
      );
    });
  });

  describe('findOne', () => {
    it('should find invite code by id', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockInviteCode);

      const result = await service.findOne(1);

      expect(result).toEqual(mockInviteCode);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Invite code not found'),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated invite codes', async () => {
      const paginationOptions = { page: 1, limit: 10 };
      const inviteCodes = [mockInviteCode];
      mockRepository.findAllWithPagination.mockResolvedValueOnce(inviteCodes);

      const result = await service.findAll(paginationOptions);

      expect(result).toEqual(inviteCodes);
      expect(mockRepository.findAllWithPagination).toHaveBeenCalledWith({
        paginationOptions,
      });
    });
  });

  describe('findByCreatedBy', () => {
    it('should find invite codes by creator', async () => {
      const inviteCodes = [mockInviteCode];
      mockRepository.findByCreatedBy.mockResolvedValueOnce(inviteCodes);

      const result = await service.findByCreatedBy(1);

      expect(result).toEqual(inviteCodes);
      expect(mockRepository.findByCreatedBy).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update invite code successfully', async () => {
      const updateDto: UpdateInviteCodeDto = {
        expiresAt: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
      const updatedInviteCode = { ...mockInviteCode, ...updateDto };

      mockRepository.findById.mockResolvedValueOnce(mockInviteCode);
      mockRepository.update.mockResolvedValueOnce(updatedInviteCode);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedInviteCode);
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        expiresAt: new Date(updateDto.expiresAt!),
      });
    });

    it('should throw NotFoundException for non-existent invite code', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.update(999, {})).rejects.toThrow(
        new NotFoundException('Invite code not found'),
      );
    });

    it('should throw NotFoundException when update fails', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockInviteCode);
      mockRepository.update.mockResolvedValueOnce(null);

      await expect(service.update(1, {})).rejects.toThrow(
        new NotFoundException('Invite code not found or failed to update'),
      );
    });
  });

  describe('remove', () => {
    it('should remove invite code successfully', async () => {
      mockRepository.findById.mockResolvedValueOnce(mockInviteCode);
      mockRepository.remove.mockResolvedValueOnce(undefined);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException for non-existent invite code', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Invite code not found'),
      );
    });
  });

  describe('generateRandomCode (private method testing via create)', () => {
    it('should generate 8-character codes', async () => {
      const createDto: CreateInviteCodeDto = {};
      mockRepository.findByCode.mockResolvedValueOnce(null);
      mockRepository.create.mockImplementation((data) => {
        expect(data.code).toHaveLength(8);
        expect(data.code).toMatch(/^[A-Z0-9]{8}$/);
        return Promise.resolve(mockInviteCode);
      });

      await service.create(createDto, mockUser);
    });
  });
});
