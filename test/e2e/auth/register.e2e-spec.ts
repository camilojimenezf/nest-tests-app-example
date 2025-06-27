import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { User } from '../../../src/auth/entities/user.entity';

const testingUser = {
  email: 'testing.user@google.com',
  password: 'Abc12345',
  fullName: 'Testing user',
};

describe('AuthModule Register (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeEach(async () => {
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

    await request(app.getHttpServer()).post('/auth/register').send(testingUser);
  });

  afterEach(async () => {
    await userRepository.delete({ email: testingUser.email });
    await app.close();
  });

  it('/auth/register (POST) - no body', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register');
    const errorMessages = [
      'email must be an email',
      'email must be a string',
      'The password must have a Uppercase, lowercase letter and a number',
      'password must be shorter than or equal to 50 characters',
      'password must be longer than or equal to 6 characters',
      'password must be a string',
      'fullName must be longer than or equal to 1 characters',
      'fullName must be a string',
    ];

    expect(response.status).toBe(400);
    errorMessages.forEach((errorMsg) => {
      expect(response.body.message).toContain(errorMsg);
    });
  });

  it('/auth/register (POST) - same email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        password: 'Abc123',
        email: testingUser.email,
        fullName: 'New User',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      `Key (email)=(${testingUser.email}) already exists.`,
    );
  });

  it('/auth/register (POST) - unsafe password', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        password: '123',
        email: testingUser.email,
        fullName: 'New User',
      });

    const errorMessages = [
      'The password must have a Uppercase, lowercase letter and a number',
      'password must be longer than or equal to 6 characters',
    ];

    expect(response.status).toBe(400);
    errorMessages.forEach((errorMsg) => {
      expect(response.body.message).toContain(errorMsg);
    });
  });

  it('/auth/register (POST) - valid credentials', async () => {
    await userRepository.delete({ email: testingUser.email });
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingUser);

    expect(response.body).toEqual({
      user: {
        email: testingUser.email,
        fullName: testingUser.fullName,
        isActive: true,
        roles: ['user'],
        id: expect.any(String),
      },
      token: expect.any(String),
    });
  });
});
