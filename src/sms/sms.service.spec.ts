import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { SmsService } from './sms.service';

// Mock Twilio
const mockTwilioClient = {
  messages: {
    create: jest.fn(),
  },
};

jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => mockTwilioClient),
  };
});

describe('SmsService', () => {
  let service: SmsService;
  let configService: ConfigService;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createTestingModule = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    configService = module.get<ConfigService>(ConfigService);
    return module;
  };

  describe('Constructor Configuration', () => {
    it('should handle missing Twilio credentials gracefully', async () => {
      process.env.TWILIO_ACCOUNT_SID = '';
      process.env.TWILIO_AUTH_TOKEN = '';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      await createTestingModule();

      expect(service.isConfigured()).toBe(false);
    });

    it('should initialize properly with valid credentials', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      await createTestingModule();

      expect(service.isConfigured()).toBe(true);
    });

    it('should handle missing phone number gracefully', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '';

      await createTestingModule();

      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('sendSms', () => {
    beforeEach(async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
      await createTestingModule();
    });

    it('should send SMS successfully', async () => {
      const mockMessage = { sid: 'message_123' };
      mockTwilioClient.messages.create.mockResolvedValue(mockMessage);

      const result = await service.sendSms({
        to: '+1987654321',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: true,
        messageId: 'message_123',
      });
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        to: '+1987654321',
        from: '+1234567890',
        body: 'Test message',
      });
    });

    it('should handle SMS sending failure', async () => {
      const error = new Error('Twilio API error');
      mockTwilioClient.messages.create.mockRejectedValue(error);

      const result = await service.sendSms({
        to: '+1987654321',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: false,
        error: 'Twilio API error',
      });
    });

    it('should use custom from number when provided', async () => {
      const mockMessage = { sid: 'message_123' };
      mockTwilioClient.messages.create.mockResolvedValue(mockMessage);

      await service.sendSms({
        to: '+1987654321',
        body: 'Test message',
        from: '+1555666777',
      });

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        to: '+1987654321',
        from: '+1555666777',
        body: 'Test message',
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw BadRequestException when service is not configured', async () => {
      process.env.TWILIO_ACCOUNT_SID = '';
      process.env.TWILIO_AUTH_TOKEN = '';
      await createTestingModule();

      await expect(
        service.sendSms({
          to: '+1987654321',
          body: 'Test message',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('isConfigured', () => {
    it('should return true when client is initialized', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
      await createTestingModule();

      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when client is not initialized', async () => {
      process.env.TWILIO_ACCOUNT_SID = '';
      process.env.TWILIO_AUTH_TOKEN = '';
      await createTestingModule();

      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('sendSmsWithRetry', () => {
    beforeEach(async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';
      await createTestingModule();
    });

    it('should succeed on first attempt', async () => {
      const mockMessage = { sid: 'message_123' };
      mockTwilioClient.messages.create.mockResolvedValue(mockMessage);

      const result = await service.sendSmsWithRetry({
        to: '+1987654321',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: true,
        messageId: 'message_123',
      });
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockMessage = { sid: 'message_123' };
      mockTwilioClient.messages.create
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(mockMessage);

      const result = await service.sendSmsWithRetry(
        {
          to: '+1987654321',
          body: 'Test message',
        },
        2,
        10, // Short delay for testing
      );

      expect(result).toEqual({
        success: true,
        messageId: 'message_123',
      });
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(
        new Error('Persistent error'),
      );

      const result = await service.sendSmsWithRetry(
        {
          to: '+1987654321',
          body: 'Test message',
        },
        2,
        10, // Short delay for testing
      );

      expect(result).toEqual({
        success: false,
        error: 'Persistent error',
      });
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
    });
  });
});
