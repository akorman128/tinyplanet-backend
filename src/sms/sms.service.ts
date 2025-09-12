import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

interface SendSmsOptions {
  to: string;
  body: string;
  from?: string;
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: Twilio | undefined;
  private readonly fromPhoneNumber: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      throw new BadRequestException('Twilio credentials not configured.');
    }

    if (!fromPhoneNumber) {
      this.logger.warn(
        'Twilio phone number not configured. SMS service will be disabled.',
      );
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    this.fromPhoneNumber = fromPhoneNumber;
    this.logger.log('Twilio SMS service initialized successfully');
  }

  async sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    const { to, body, from = this.fromPhoneNumber } = options;

    try {
      const message = await this.client!.messages.create({
        to,
        from,
        body,
      });

      this.logger.log(
        `SMS sent successfully to ${to}, messageId: ${message.sid}`,
      );

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendSmsWithRetry(
    options: SendSmsOptions,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<SendSmsResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.sendSms(options);

        if (result.success) {
          if (attempt > 1) {
            this.logger.log(
              `SMS sent successfully on attempt ${attempt} to ${options.to}`,
            );
          }
          return result;
        }

        lastError = result.error;

        if (attempt < maxRetries) {
          this.logger.warn(
            `SMS attempt ${attempt} failed for ${options.to}: ${lastError}. Retrying in ${delayMs}ms...`,
          );
          await this.delay(delayMs * attempt);
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : 'Unknown error occurred';

        if (attempt < maxRetries) {
          this.logger.warn(
            `SMS attempt ${attempt} failed for ${options.to}: ${lastError}. Retrying in ${delayMs}ms...`,
          );
          await this.delay(delayMs * attempt);
        }
      }
    }

    this.logger.error(
      `Failed to send SMS to ${options.to} after ${maxRetries} attempts. Last error: ${lastError}`,
    );

    return {
      success: false,
      error: lastError || 'Failed after multiple retry attempts',
    };
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
