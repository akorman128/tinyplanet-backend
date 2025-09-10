import request from 'supertest';
import { APP_URL, TESTER_EMAIL, TESTER_PASSWORD } from '../utils/constants';

describe('Invite Codes Module (Admin)', () => {
  const app = APP_URL;
  let adminApiToken: string;

  beforeAll(async () => {
    // Login as admin to get API token
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: TESTER_EMAIL, password: TESTER_PASSWORD })
      .then(({ body }) => {
        adminApiToken = body.token;
      });
  });

  describe('Admin Invite Code Management', () => {
    let createdInviteCodeId: number;
    let inviteCodeValue: string;

    it('should create invite code as admin: /api/v1/invite-codes (POST)', async () => {
      const response = await request(app)
        .post('/api/v1/invite-codes')
        .auth(adminApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      expect(response.body.code).toBeDefined();
      expect(response.body.code).toMatch(/^[A-Z0-9]{8}$/);
      expect(response.body.expiresAt).toBeDefined();
      expect(response.body.createdBy).toBeDefined();
      expect(response.body.usedBy).toBeNull();
      expect(response.body.usedAt).toBeNull();

      createdInviteCodeId = response.body.id;
      inviteCodeValue = response.body.code;
    });

    it('should view all invite codes as admin: /api/v1/invite-codes (GET)', async () => {
      const response = await request(app)
        .get('/api/v1/invite-codes?page=1&limit=10')
        .auth(adminApiToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.hasNextPage).toBeDefined();
    });

    it('should view specific invite code as admin: /api/v1/invite-codes/:id (GET)', async () => {
      const response = await request(app)
        .get(`/api/v1/invite-codes/${createdInviteCodeId}`)
        .auth(adminApiToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.id).toBe(createdInviteCodeId);
      expect(response.body.code).toBe(inviteCodeValue);
      expect(response.body.createdBy).toBeDefined();
    });

    it('should update invite code as admin: /api/v1/invite-codes/:id (PATCH)', async () => {
      const newExpirationDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .patch(`/api/v1/invite-codes/${createdInviteCodeId}`)
        .auth(adminApiToken, { type: 'bearer' })
        .send({ expiresAt: newExpirationDate.toISOString() })
        .expect(200);

      expect(new Date(response.body.expiresAt)).toEqual(newExpirationDate);
    });

    it('should delete invite code as admin: /api/v1/invite-codes/:id (DELETE)', async () => {
      // Create a new invite code for deletion
      const createResponse = await request(app)
        .post('/api/v1/invite-codes')
        .auth(adminApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      const deleteableId = createResponse.body.id;

      await request(app)
        .delete(`/api/v1/invite-codes/${deleteableId}`)
        .auth(adminApiToken, { type: 'bearer' })
        .expect(204);

      // Verify it's deleted
      await request(app)
        .get(`/api/v1/invite-codes/${deleteableId}`)
        .auth(adminApiToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('Malformed Code Handling', () => {
    it('should handle malformed codes that are too short gracefully', async () => {
      const shortCodes = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE']; // All under 6 characters

      for (const shortCode of shortCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(adminApiToken, { type: 'bearer' })
          .send({ code: shortCode })
          .expect(400)
          .expect(({ body }) => {
            expect(body.message).toContain(
              'code must be longer than or equal to 6 characters',
            );
          });
      }
    });

    it('should handle malformed codes that are too long gracefully', async () => {
      const longCodes = [
        'ABCDEFGHIJKLMNOPQRSTU', // 21 characters
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789', // 35 characters
        'A'.repeat(50), // 50 characters
        'A'.repeat(100), // 100 characters
      ];

      for (const longCode of longCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(adminApiToken, { type: 'bearer' })
          .send({ code: longCode })
          .expect(400)
          .expect(({ body }) => {
            expect(body.message).toContain(
              'code must be shorter than or equal to 20 characters',
            );
          });
      }
    });

    it('should handle empty and whitespace codes gracefully', async () => {
      const invalidCodes = ['', '   ', '\t', '\n', '  \t\n  '];

      for (const invalidCode of invalidCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(adminApiToken, { type: 'bearer' })
          .send({ code: invalidCode })
          .expect(400)
          .expect(({ body }) => {
            const hasValidationMessage =
              body.message.includes('should not be empty') ||
              body.message.includes(
                'must be longer than or equal to 6 characters',
              );
            expect(hasValidationMessage).toBe(true);
          });
      }
    });

    it('should handle special characters in codes gracefully', async () => {
      const specialCharCodes = [
        'ABC123!@#',
        'CODE-WITH-DASHES',
        'CODE_WITH_UNDERSCORES',
        'CODE.WITH.DOTS',
        'CODE WITH SPACES',
        'CODE\tWITH\tTABS',
        'CODE\nWITH\nNEWLINES',
      ];

      for (const specialCode of specialCharCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(adminApiToken, { type: 'bearer' })
          .send({ code: specialCode })
          .expect(400)
          .expect(({ body }) => {
            // Should fail validation or return "Invalid or expired invite code"
            const hasInvalidMessage =
              body.message.includes('Invalid or expired') ||
              body.message.includes('string');
            expect(hasInvalidMessage).toBe(true);
          });
      }
    });

    it('should handle null and undefined codes gracefully', async () => {
      // Test null code
      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(adminApiToken, { type: 'bearer' })
        .send({ code: null })
        .expect(400);

      // Test missing code property
      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(adminApiToken, { type: 'bearer' })
        .send({})
        .expect(400);
    });

    it('should handle numeric codes gracefully', async () => {
      const numericCodes = [123456, 1234567890, 999999999999];

      for (const numericCode of numericCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(adminApiToken, { type: 'bearer' })
          .send({ code: numericCode })
          .expect(400)
          .expect(({ body }) => {
            expect(body.message).toContain('must be a string');
          });
      }
    });

    it('should handle array and object codes gracefully', async () => {
      const invalidInputs = [
        { code: ['ABCDEFGH'] },
        { code: { value: 'ABCDEFGH' } },
        { code: true },
        { code: false },
      ];

      for (const invalidInput of invalidInputs) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(adminApiToken, { type: 'bearer' })
          .send(invalidInput)
          .expect(400)
          .expect(({ body }) => {
            expect(body.message).toContain('must be a string');
          });
      }
    });
  });

  describe('Invite Code Usage Edge Cases', () => {
    let validInviteCode: string;

    beforeAll(async () => {
      // Create a valid invite code for testing
      const response = await request(app)
        .post('/api/v1/invite-codes')
        .auth(adminApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      validInviteCode = response.body.code;
    });

    it('should prevent double usage of the same invite code', async () => {
      // First usage should succeed
      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(adminApiToken, { type: 'bearer' })
        .send({ code: validInviteCode })
        .expect(200);

      // Second usage should fail
      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(adminApiToken, { type: 'bearer' })
        .send({ code: validInviteCode })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toContain('already been used');
        });
    });

    it('should reject codes with only whitespace after transformation', async () => {
      const whitespaceCodes = ['      ', '\t\t\t\t\t\t', '\n\n\n\n\n\n'];

      for (const whitespaceCode of whitespaceCodes) {
        await request(app)
          .post('/api/v1/invite-codes/use')
          .auth(adminApiToken, { type: 'bearer' })
          .send({ code: whitespaceCode })
          .expect(400);
      }
    });

    it('should handle concurrent usage attempts of the same code', async () => {
      // Create a fresh invite code for concurrent testing
      const createResponse = await request(app)
        .post('/api/v1/invite-codes')
        .auth(adminApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      const concurrentCode = createResponse.body.code;

      // Attempt to use the same code concurrently
      const promises = Array(3)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/invite-codes/use')
            .auth(adminApiToken, { type: 'bearer' })
            .send({ code: concurrentCode }),
        );

      const results = await Promise.allSettled(promises);

      // Only one should succeed, others should fail
      const successes = results.filter(
        (r) => r.status === 'fulfilled' && (r.value as any).status === 200,
      );
      const failures = results.filter(
        (r) => r.status === 'fulfilled' && (r.value as any).status === 400,
      );

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(2);
    });

    it('should maintain referential integrity when codes are used', async () => {
      // Create and use an invite code
      const createResponse = await request(app)
        .post('/api/v1/invite-codes')
        .auth(adminApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      const newCode = createResponse.body.code;
      const newCodeId = createResponse.body.id;

      await request(app)
        .post('/api/v1/invite-codes/use')
        .auth(adminApiToken, { type: 'bearer' })
        .send({ code: newCode })
        .expect(200);

      // Verify the code is properly marked as used
      const getResponse = await request(app)
        .get(`/api/v1/invite-codes/${newCodeId}`)
        .auth(adminApiToken, { type: 'bearer' })
        .expect(200);

      expect(getResponse.body.usedBy).toBeDefined();
      expect(getResponse.body.usedAt).toBeDefined();
      expect(getResponse.body.usedBy.email).toBe(TESTER_EMAIL);
    });
  });

  describe('Code Generation Validation', () => {
    it('should generate unique codes consistently', async () => {
      // Create multiple invite codes to test uniqueness
      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/invite-codes')
            .auth(adminApiToken, { type: 'bearer' })
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

    it('should create codes with correct format and length', async () => {
      const response = await request(app)
        .post('/api/v1/invite-codes')
        .auth(adminApiToken, { type: 'bearer' })
        .send({})
        .expect(201);

      const code = response.body.code;
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
      expect(code).not.toContain(' ');
      expect(code).not.toContain('-');
      expect(code).not.toContain('_');
      expect(code).not.toMatch(/[a-z]/); // Should be all uppercase
    });
  });
});
