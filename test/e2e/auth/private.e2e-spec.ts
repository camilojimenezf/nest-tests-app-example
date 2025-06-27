import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { User } from '../../../src/auth/entities/user.entity';

import { validate } from 'uuid';

const testingUser = {
  email: 'testing.user@google.com',
  password: 'Abc12345',
  fullName: 'Testing user',
};

const testingAdminUser = {
  email: 'testing.admin@google.com',
  password: 'Abc12345',
  fullName: 'Testing admin',
};

describe('AuthModule Private (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  let token: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    await userRepository.delete({ email: testingUser.email });
    await userRepository.delete({ email: testingAdminUser.email });

    const responseUser = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingUser);
    const responseAdminUser = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingAdminUser);

    token = responseUser.body.token;
    adminToken = responseAdminUser.body.token;

    await userRepository.update(
      { email: testingAdminUser.email },
      { roles: ['admin'] },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/private')
      .send();

    expect(response.status).toBe(401);
  });

  it('should return new token and user if token is provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/check-status')
      .send()
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(200);
    expect(validate(response.body.user.id)).toBe(true);
    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        email: testingUser.email,
        fullName: testingUser.fullName,
        isActive: true,
        roles: ['user'],
      },
      token: expect.any(String),
    });
  });

  it('should return custom object if token is valid', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/private')
      .send()
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        email: testingUser.email,
        fullName: testingUser.fullName,
        isActive: true,
        roles: ['user'],
      },
      userEmail: expect.any(String),
      message: expect.any(String),
      ok: true,
      rawHeaders: expect.arrayContaining([
        'Authorization',
        'Host',
        'Accept-Encoding',
      ]),
      headers: expect.objectContaining({
        host: expect.any(String),
        'accept-encoding': expect.any(String),
        authorization: expect.any(String),
      }),
    });
  });

  it('should return 401 if admin token is not provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/private3')
      .send()
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      `User ${testingUser.fullName} need a valid role: [admin]`,
    );
  });

  it('should return user if admin token is provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/private3')
      .send()
      .set('Authorization', `bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      user: {
        id: expect.any(String),
        email: testingAdminUser.email,
        fullName: testingAdminUser.fullName,
        isActive: true,
        roles: ['admin'],
      },
    });
  });
});
