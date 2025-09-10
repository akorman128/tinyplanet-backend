import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InviteCodesController } from './invite-codes.controller';
import { InviteCodesService } from './invite-codes.service';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { UpdateInviteCodeDto } from './dto/update-invite-code.dto';
import { UseInviteCodeDto } from './dto/use-invite-code.dto';
import { QueryInviteCodeDto } from './dto/query-invite-code.dto';
import { User } from '../users/domain/user';
import { InviteCode } from './domain/invite-code';

describe('InviteCodesController', () => {
  let controller: InviteCodesController;

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

  const mockRequest = { user: mockUser };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCreatedBy: jest.fn(),
    useInviteCode: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InviteCodesController],
      providers: [
        {
          provide: InviteCodesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<InviteCodesController>(InviteCodesController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create invite code correctly', async () => {
      const createDto: CreateInviteCodeDto = {};
      mockService.create.mockResolvedValueOnce(mockInviteCode);

      const result = await controller.create(createDto, mockRequest);

      expect(result).toEqual(mockInviteCode);
      expect(mockService.create).toHaveBeenCalledWith(createDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated invite codes', async () => {
      const query: QueryInviteCodeDto = { page: 1, limit: 10 };
      const inviteCodes = [mockInviteCode];
      mockService.findAll.mockResolvedValueOnce(inviteCodes);

      const result = await controller.findAll(query);

      expect(mockService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual({
        data: inviteCodes,
        hasNextPage: false,
      });
    });

    it('should handle default pagination values', async () => {
      const query: QueryInviteCodeDto = {};
      const inviteCodes = [mockInviteCode];
      mockService.findAll.mockResolvedValueOnce(inviteCodes);

      await controller.findAll(query);

      expect(mockService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should limit maximum page size to 50', async () => {
      const query: QueryInviteCodeDto = { page: 1, limit: 100 };
      const inviteCodes = [mockInviteCode];
      mockService.findAll.mockResolvedValueOnce(inviteCodes);

      await controller.findAll(query);

      expect(mockService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
      });
    });
  });

  describe('findMyInviteCodes', () => {
    it('should return current user invite codes', async () => {
      const inviteCodes = [mockInviteCode];
      mockService.findByCreatedBy.mockResolvedValueOnce(inviteCodes);

      const result = await controller.findMyInviteCodes(mockRequest);

      expect(result).toEqual(inviteCodes);
      expect(mockService.findByCreatedBy).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should find invite code by id', async () => {
      mockService.findOne.mockResolvedValueOnce(mockInviteCode);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockInviteCode);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('useInviteCode', () => {
    it('should handle malformed codes gracefully - too short', async () => {
      const useDto: UseInviteCodeDto = { code: 'ABC' }; // Too short
      mockService.useInviteCode.mockRejectedValueOnce(
        new BadRequestException('Invalid or expired invite code'),
      );

      await expect(
        controller.useInviteCode(useDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle malformed codes gracefully - too long', async () => {
      const useDto: UseInviteCodeDto = { code: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' }; // Too long
      mockService.useInviteCode.mockRejectedValueOnce(
        new BadRequestException('Invalid or expired invite code'),
      );

      await expect(
        controller.useInviteCode(useDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-existent invite codes', async () => {
      const useDto: UseInviteCodeDto = { code: 'NONEXIST' };
      mockService.useInviteCode.mockRejectedValueOnce(
        new BadRequestException('Invalid or expired invite code'),
      );

      await expect(
        controller.useInviteCode(useDto, mockRequest),
      ).rejects.toThrow(
        new BadRequestException('Invalid or expired invite code'),
      );
    });

    it('should reject already used invite codes', async () => {
      const useDto: UseInviteCodeDto = { code: 'USED1234' };
      mockService.useInviteCode.mockRejectedValueOnce(
        new BadRequestException('Invite code has already been used'),
      );

      await expect(
        controller.useInviteCode(useDto, mockRequest),
      ).rejects.toThrow(
        new BadRequestException('Invite code has already been used'),
      );
    });

    it('should successfully use valid invite code', async () => {
      const useDto: UseInviteCodeDto = { code: 'ABC123DEF' };
      const usedInviteCode = {
        ...mockInviteCode,
        usedBy: mockUser,
        usedAt: new Date(),
      };
      mockService.useInviteCode.mockResolvedValueOnce(usedInviteCode);

      const result = await controller.useInviteCode(useDto, mockRequest);

      expect(result).toEqual(usedInviteCode);
      expect(mockService.useInviteCode).toHaveBeenCalledWith(
        'ABC123DEF',
        mockUser,
      );
    });

    it('should pass code to service (transformation handled by DTO validation)', async () => {
      const useDto: UseInviteCodeDto = { code: 'ABC123DEF' };
      const usedInviteCode = {
        ...mockInviteCode,
        usedBy: mockUser,
        usedAt: new Date(),
      };
      mockService.useInviteCode.mockResolvedValueOnce(usedInviteCode);

      await controller.useInviteCode(useDto, mockRequest);

      expect(mockService.useInviteCode).toHaveBeenCalledWith(
        'ABC123DEF',
        mockUser,
      );
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
      mockService.update.mockResolvedValueOnce(updatedInviteCode);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual(updatedInviteCode);
      expect(mockService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove invite code successfully', async () => {
      mockService.remove.mockResolvedValueOnce(undefined);

      await controller.remove('1');

      expect(mockService.remove).toHaveBeenCalledWith(1);
    });
  });
});
