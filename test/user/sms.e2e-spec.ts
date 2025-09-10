import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('SMS Service (E2E)', () => {
  const app = APP_URL;
  let userApiToken: string;
  let createdInviteCodeId: number;

  const newUserFirstName = `SmsUser${Date.now()}`;
  const newUserLastName = `E2E`;
  const newUserEmail = `sms.user.${Date.now()}@example.com`;
  const newUserPassword = `secret`;

  beforeAll(async () => {
    // Register a new user for SMS tests
    await request(app)
      .post('/api/v1/auth/email/register')
      .send({
        email: newUserEmail,
        password: newUserPassword,
        firstName: newUserFirstName,
        lastName: newUserLastName,
      })
      .expect(204);

    // Login to get API token
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: newUserEmail, password: newUserPassword })
      .then(({ body }) => {
        userApiToken = body.token;
      });

    // Create an invite code for SMS tests
    const createResponse = await request(app)
      .post('/api/v1/invite-codes')
      .auth(userApiToken, { type: 'bearer' })
      .send({})
      .expect(201);

    createdInviteCodeId = createResponse.body.id;
  });

  describe('Send SMS with Invite Code', () => {
    it('should validate phone number format: POST /api/v1/invite-codes/:id/send-sms', async () => {
      const response = await request(app)
        .post(`/api/v1/invite-codes/${createdInviteCodeId}/send-sms`)
        .auth(userApiToken, { type: 'bearer' })
        .send({
          phoneNumber: '', // Invalid empty phone number
        })
        .expect(422);

      expect(response.body.message).toContain(
        'phoneNumber should not be empty',
      );
    });

    it('should require phoneNumber field: POST /api/v1/invite-codes/:id/send-sms', async () => {
      const response = await request(app)
        .post(`/api/v1/invite-codes/${createdInviteCodeId}/send-sms`)
        .auth(userApiToken, { type: 'bearer' })
        .send({}) // Missing phoneNumber
        .expect(422);

      expect(response.body.message).toContain('phoneNumber');
    });

    it('should require authentication: POST /api/v1/invite-codes/:id/send-sms', async () => {
      await request(app)
        .post(`/api/v1/invite-codes/${createdInviteCodeId}/send-sms`)
        .send({
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        })
        .expect(401);
    });

    it('should handle non-existent invite code: POST /api/v1/invite-codes/:id/send-sms', async () => {
      const nonExistentId = 999999;

      await request(app)
        .post(`/api/v1/invite-codes/${nonExistentId}/send-sms`)
        .auth(userApiToken, { type: 'bearer' })
        .send({
          phoneNumber: '+1234567890',
        })
        .expect(404);
    });

    it('should validate phone number as string: POST /api/v1/invite-codes/:id/send-sms', async () => {
      const response = await request(app)
        .post(`/api/v1/invite-codes/${createdInviteCodeId}/send-sms`)
        .auth(userApiToken, { type: 'bearer' })
        .send({
          phoneNumber: 1234567890, // Number instead of string
        })
        .expect(422);

      expect(response.body.message).toContain('phoneNumber must be a string');
    });
  });
});
