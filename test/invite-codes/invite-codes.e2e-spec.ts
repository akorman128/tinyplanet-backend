import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { InviteCodeEntity } from '../../src/invite-codes/infrastructure/persistence/relational/entities/invite-code.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('InviteCodes E2E', () => {
  let app: INestApplication;
  let inviteCodeRepository: Repository<InviteCodeEntity>;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    inviteCodeRepository = moduleRef.get(getRepositoryToken(InviteCodeEntity));

    const signUpResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/email/register')
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = signUpResponse.body.token;
    userId = signUpResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await inviteCodeRepository.delete({});
  });

  describe('Create and use invite code flow', () => {
    it('should create and successfully use invite code', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/invite-codes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId })
        .expect(201);

      const { code } = createResponse.body;
      expect(code).toBeDefined();
      expect(code).toHaveLength(6);

      const useResponse = await request(app.getHttpServer())
        .post('/api/v1/invite-codes/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code, userId })
        .expect(200);

      expect(useResponse.body.isUsed).toBe(true);
    });
  });

  describe('Expired code validation', () => {
    it('should reject expired invite code', async () => {
      const expiredCode = await inviteCodeRepository.save({
        code: '999999',
        userId,
        isUsed: false,
        expiresAt: new Date(Date.now() - 86400000),
      });

      await request(app.getHttpServer())
        .post('/api/v1/invite-codes/use')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: expiredCode.code, userId })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toContain('expired');
        });
    });
  });
});
