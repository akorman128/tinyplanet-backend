import request from 'supertest';
import { APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/constants';

describe('SMS Service - Admin (E2E)', () => {
  const app = APP_URL;
  let adminApiToken: string;
  let testInviteCodeId: number;

  beforeAll(async () => {
    // Login as admin to get API token
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .then(({ body }) => {
        adminApiToken = body.token;
      });

    // Create an invite code as admin for SMS tests
    const createResponse = await request(app)
      .post('/api/v1/invite-codes')
      .auth(adminApiToken, { type: 'bearer' })
      .send({})
      .expect(201);

    testInviteCodeId = createResponse.body.id;
  });

  describe('Admin SMS Operations', () => {
    it('should allow admin to send SMS with invite code: POST /api/v1/invite-codes/:id/send-sms', async () => {
      const response = await request(app)
        .post(`/api/v1/invite-codes/${testInviteCodeId}/send-sms`)
        .auth(adminApiToken, { type: 'bearer' })
        .send({
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        });

      // Should either succeed (200) or fail due to SMS service configuration (400)
      expect([200, 400]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.message).toContain(
          'SMS service is not configured',
        );
      } else if (response.status === 200) {
        expect(response.body.message).toBe('SMS sent successfully');
      }
    });

    it('should validate admin SMS request body: POST /api/v1/invite-codes/:id/send-sms', async () => {
      const response = await request(app)
        .post(`/api/v1/invite-codes/${testInviteCodeId}/send-sms`)
        .auth(adminApiToken, { type: 'bearer' })
        .send({
          phoneNumber: null, // Invalid null value
        })
        .expect(400);

      expect(response.body.message).toContain('phoneNumber');
    });

    it('should handle admin access to other users invite codes: POST /api/v1/invite-codes/:id/send-sms', async () => {
      // Create a regular user first
      const testUserEmail = `test.user.${Date.now()}@example.com`;
      const testUserPassword = 'secret';

      await request(app)
        .post('/api/v1/auth/email/register')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(204);

      // Login as test user
      const loginResponse = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: testUserEmail, password: testUserPassword });

      const userApiToken = loginResponse.body.token;

      // Create invite code as regular user
      const userInviteCodeResponse = await request(app)
        .post('/api/v1/invite-codes')
        .auth(userApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      const userInviteCodeId = userInviteCodeResponse.body.id;

      // Admin should be able to send SMS for any invite code
      const response = await request(app)
        .post(`/api/v1/invite-codes/${userInviteCodeId}/send-sms`)
        .auth(adminApiToken, { type: 'bearer' })
        .send({
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        });

      // Should either succeed (200) or fail due to SMS service configuration (400)
      expect([200, 400]).toContain(response.status);
    });
  });
});
