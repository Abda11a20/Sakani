import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testUser = {
    name: 'Test Tenant User',
    phone: '01012345678',
    email: 'test.tenant@example.com',
    nationalId: '29901011234567',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'tenant',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Clean up test users first
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: testUser.email }, { phone: testUser.phone }],
      },
    });
  });

  afterAll(async () => {
    // Cleanup test users after tests
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: testUser.email }, { phone: testUser.phone }],
      },
    });
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should successfully register a new user', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBeDefined();
        });

      // Manually verify user's email in database so they can log in
      await prisma.user.update({
        where: { email: testUser.email },
        data: { emailVerifiedAt: new Date() },
      });
    });

    it('should return 409 Conflict if email is already registered', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should successfully log in with email identifier', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user.email).toBe(testUser.email);
        });
    });

    it('should successfully log in with phone identifier', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.phone,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data.user.phone).toBe(testUser.phone);
        });
    });

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
