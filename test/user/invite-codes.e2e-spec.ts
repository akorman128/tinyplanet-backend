import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('Invite Codes Module (User)', () => {
  const app = APP_URL;
  let userApiToken: string;
  let createdInviteCodeId: number;
  let inviteCodeValue: string;

  const newUserFirstName = `InviteUser${Date.now()}`;
  const newUserLastName = `E2E`;
  const newUserEmail = `invite.user.${Date.now()}@example.com`;
  const newUserPassword = `secret`;

  beforeAll(async () => {
    // Register a new user for invite code tests
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
  });

  describe('Create Invite Code', () => {
    it('should successfully create an invite code: /api/v1/invite-codes (POST)', async () => {
      const response = await request(app)
        .post('/api/v1/invite-codes')
        .auth(userApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      expect(response.body.code).toBeDefined();
      expect(response.body.code).toMatch(/^[A-Z0-9]{8}$/);
      expect(response.body.expiresAt).toBeDefined();
      expect(response.body.createdBy).toBeDefined();
      expect(response.body.createdBy.email).toBe(newUserEmail);
      expect(response.body.usedBy).toBeNull();
      expect(response.body.usedAt).toBeNull();

      createdInviteCodeId = response.body.id;
      inviteCodeValue = response.body.code;
    });

    it('should create invite code with custom expiration: /api/v1/invite-codes (POST)', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const response = await request(app)
        .post('/api/v1/invite-codes')
        .auth(userApiToken, { type: 'bearer' })
        .send({ expiresAt: futureDate.toISOString() })
        .expect(201);

      expect(response.body.code).toBeDefined();
      expect(new Date(response.body.expiresAt)).toEqual(futureDate);
    });

    it('should fail without authentication: /api/v1/invite-codes (POST)', async () => {
      await request(app).post('/api/v1/invite-codes').send({}).expect(401);
    });
  });

  describe('Get My Invite Codes', () => {
    it("should retrieve user's own invite codes: /api/v1/invite-codes/my-codes (GET)", async () => {
      const response = await request(app)
        .get('/api/v1/invite-codes/my-codes')
        .auth(userApiToken, { type: 'bearer' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const userInviteCode = response.body.find(
        (code) => code.id === createdInviteCodeId,
      );
      expect(userInviteCode).toBeDefined();
      expect(userInviteCode.createdBy.email).toBe(newUserEmail);
    });

    it('should fail without authentication: /api/v1/invite-codes/my-codes (GET)', async () => {
      await request(app).get('/api/v1/invite-codes/my-codes').expect(401);
    });
  });

  describe('Use Invite Code', () => {
    let anotherUserApiToken: string;
    const anotherUserEmail = `another.invite.user.${Date.now()}@example.com`;

    beforeAll(async () => {
      // Register another user to use the invite code
      await request(app)
        .post('/api/v1/auth/email/register')
        .send({
          email: anotherUserEmail,
          password: newUserPassword,
          firstName: 'AnotherUser',
          lastName: 'E2E',
        })
        .expect(204);

      // Login to get API token
      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: anotherUserEmail, password: newUserPassword })
        .then(({ body }) => {
          anotherUserApiToken = body.token;
        });
    });

    it('should successfully use an invite code: /api/v1/invite-codes/use (POST)', async () => {
      const response = await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(anotherUserApiToken, { type: 'bearer' })
        .send({ code: inviteCodeValue })
        .expect(200);

      expect(response.body.code).toBe(inviteCodeValue);
      expect(response.body.usedBy).toBeDefined();
      expect(response.body.usedBy.email).toBe(anotherUserEmail);
      expect(response.body.usedAt).toBeDefined();
    });

    it('should fail to use an already used invite code: /api/v1/invite-codes/use (POST)', async () => {
      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(userApiToken, { type: 'bearer' })
        .send({ code: inviteCodeValue })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toContain('already been used');
        });
    });

    it('should fail to use non-existent invite code: /api/v1/invite-codes/use (POST)', async () => {
      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(userApiToken, { type: 'bearer' })
        .send({ code: 'INVALID1' })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toContain('Invalid or expired');
        });
    });

    it('should fail to use expired invite code: /api/v1/invite-codes/use (POST)', async () => {
      // Create an expired invite code
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      const createResponse = await request(app)
        .post('/api/v1/invite-codes')
        .auth(userApiToken, { type: 'bearer' })
        .send({ expiresAt: pastDate.toISOString() })
        .expect(201);

      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(anotherUserApiToken, { type: 'bearer' })
        .send({ code: createResponse.body.code })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toContain('expired');
        });
    });

    it('should fail without authentication: /api/v1/invite-codes/use (POST)', async () => {
      await request(app)
        .post('/api/v1/invite-codes/use')
        .send({ code: 'SOMECODE' })
        .expect(401);
    });

    it('should fail with invalid code format: /api/v1/invite-codes/use (POST)', async () => {
      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(userApiToken, { type: 'bearer' })
        .send({ code: '' })
        .expect(400);
    });
  });

  describe('Update Invite Code', () => {
    let updateableInviteCodeId: number;

    beforeAll(async () => {
      // Create a new invite code for update testing
      const response = await request(app)
        .post('/api/v1/invite-codes')
        .auth(userApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      updateableInviteCodeId = response.body.id;
    });

    it('should successfully update invite code expiration: /api/v1/invite-codes/:id (PATCH)', async () => {
      const newExpirationDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

      const response = await request(app)
        .patch(`/api/v1/invite-codes/${updateableInviteCodeId}`)
        .auth(userApiToken, { type: 'bearer' })
        .send({ expiresAt: newExpirationDate.toISOString() })
        .expect(200);

      expect(new Date(response.body.expiresAt)).toEqual(newExpirationDate);
    });

    it('should fail to update non-existent invite code: /api/v1/invite-codes/:id (PATCH)', async () => {
      await request(app)
        .patch('/api/v1/invite-codes/99999')
        .auth(userApiToken, { type: 'bearer' })
        .send({ expiresAt: new Date().toISOString() })
        .expect(404);
    });

    it('should fail without authentication: /api/v1/invite-codes/:id (PATCH)', async () => {
      await request(app)
        .patch(`/api/v1/invite-codes/${updateableInviteCodeId}`)
        .send({ expiresAt: new Date().toISOString() })
        .expect(401);
    });
  });

  describe('Get Single Invite Code', () => {
    it('should successfully get invite code by ID: /api/v1/invite-codes/:id (GET)', async () => {
      const response = await request(app)
        .get(`/api/v1/invite-codes/${createdInviteCodeId}`)
        .auth(userApiToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.id).toBe(createdInviteCodeId);
      expect(response.body.code).toBeDefined();
      expect(response.body.createdBy).toBeDefined();
    });

    it('should fail to get non-existent invite code: /api/v1/invite-codes/:id (GET)', async () => {
      await request(app)
        .get('/api/v1/invite-codes/99999')
        .auth(userApiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail without authentication: /api/v1/invite-codes/:id (GET)', async () => {
      await request(app)
        .get(`/api/v1/invite-codes/${createdInviteCodeId}`)
        .expect(401);
    });
  });

  describe('Get All Invite Codes (Paginated)', () => {
    beforeAll(async () => {
      // Create a few more invite codes for pagination testing
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/invite-codes')
          .auth(userApiToken, { type: 'bearer' })
          .send({});
      }
    });

    it('should successfully get paginated invite codes: /api/v1/invite-codes (GET)', async () => {
      const response = await request(app)
        .get('/api/v1/invite-codes?page=1&limit=5')
        .auth(userApiToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.hasNextPage).toBeDefined();
    });

    it('should respect pagination limits: /api/v1/invite-codes (GET)', async () => {
      const response = await request(app)
        .get('/api/v1/invite-codes?page=1&limit=2')
        .auth(userApiToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should enforce maximum limit of 50: /api/v1/invite-codes (GET)', async () => {
      const response = await request(app)
        .get('/api/v1/invite-codes?page=1&limit=100')
        .auth(userApiToken, { type: 'bearer' })
        .expect(200);

      // Should be limited to 50 or fewer items
      expect(response.body.data.length).toBeLessThanOrEqual(50);
    });

    it('should fail without authentication: /api/v1/invite-codes (GET)', async () => {
      await request(app).get('/api/v1/invite-codes').expect(401);
    });
  });

  describe('Delete Invite Code', () => {
    let deletableInviteCodeId: number;

    beforeAll(async () => {
      // Create a new invite code for deletion testing
      const response = await request(app)
        .post('/api/v1/invite-codes')
        .auth(userApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      deletableInviteCodeId = response.body.id;
    });

    it('should successfully delete invite code: /api/v1/invite-codes/:id (DELETE)', async () => {
      await request(app)
        .delete(`/api/v1/invite-codes/${deletableInviteCodeId}`)
        .auth(userApiToken, { type: 'bearer' })
        .expect(204);

      // Verify it's deleted by trying to get it
      await request(app)
        .get(`/api/v1/invite-codes/${deletableInviteCodeId}`)
        .auth(userApiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to delete non-existent invite code: /api/v1/invite-codes/:id (DELETE)', async () => {
      await request(app)
        .delete('/api/v1/invite-codes/99999')
        .auth(userApiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail without authentication: /api/v1/invite-codes/:id (DELETE)', async () => {
      await request(app)
        .delete(`/api/v1/invite-codes/${createdInviteCodeId}`)
        .expect(401);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle multiple concurrent invite code creations', async () => {
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/invite-codes')
            .auth(userApiToken, { type: 'bearer' })
            .send({}),
        );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.code).toMatch(/^[A-Z0-9]{8}$/);
      });

      // Verify all codes are unique
      const codes = responses.map((r) => r.body.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should validate invite code format on use - comprehensive malformed code testing', async () => {
      // Test codes that are too short (under 6 characters)
      const tooShortCodes = ['', 'A', 'AB', 'ABC', 'ABCD', 'ABCDE'];
      for (const shortCode of tooShortCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(userApiToken, { type: 'bearer' })
          .send({ code: shortCode })
          .expect(400)
          .expect(({ body }) => {
            expect(
              body.message.includes('should not be empty') ||
                body.message.includes(
                  'must be longer than or equal to 6 characters',
                ),
            ).toBe(true);
          });
      }

      // Test codes that are too long (over 20 characters)
      const tooLongCodes = [
        'ABCDEFGHIJKLMNOPQRSTU', // 21 characters
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456', // 32 characters
        'A'.repeat(25),
        'A'.repeat(50),
      ];
      for (const longCode of tooLongCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(userApiToken, { type: 'bearer' })
          .send({ code: longCode })
          .expect(400)
          .expect(({ body }) => {
            expect(body.message).toContain(
              'must be shorter than or equal to 20 characters',
            );
          });
      }

      // Test special characters and invalid formats
      const invalidFormatCodes = [
        'invalid-chars!',
        'CODE WITH SPACES',
        'code@with#symbols',
        'CODE\tWITH\tTABS',
        'CODE\nWITH\nLINES',
      ];
      for (const invalidCode of invalidFormatCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(userApiToken, { type: 'bearer' })
          .send({ code: invalidCode })
          .expect(400);
      }
    });

    it('should handle date validation for expiration', async () => {
      const invalidDate = 'invalid-date';

      await request(app)
        .post('/api/v1/invite-codes')
        .auth(userApiToken, { type: 'bearer' })
        .send({ expiresAt: invalidDate })
        .expect(400);
    });
  });
});
