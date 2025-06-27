import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from './../../../src/app.module';
import { User } from './../../../src/auth/entities/user.entity';

const testingUser = {
  email: 'testing.user@google.com',
  password: 'Abc12345',
  fullName: 'Testing User',
};

const testingAdminUser = {
  email: 'testing.admin.user@google.com',
  password: 'Abc12345',
  fullName: 'Testing Admin User',
};

describe('Auth Feature - Login', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

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

    await request(app.getHttpServer()).post('/auth/register').send(testingUser);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testingAdminUser);

    await userRepository.update(
      { email: testingAdminUser.email },
      { roles: ['admin'] },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) - should throw 400 if no body', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login');
    const errorMessages = [
      'email must be an email',
      'email must be a string',
      'The password must have a Uppercase, lowercase letter and a number',
      'password must be shorter than or equal to 50 characters',
      'password must be longer than or equal to 6 characters',
      'password must be a string',
    ];

    expect(response.status).toBe(400);
    errorMessages.forEach((errorMsg) => {
      expect(response.body.message).toContain(errorMsg);
    });
  });

  it('/auth/login (POST) - wrong credentials - email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        password: testingUser.password,
        email: 'test1@google2.com',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credentials are not valid (email)');
  });

  it('/auth/login (POST) - wrong credentials - password', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        password: 'Abc123999',
        email: testingUser.email,
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credentials are not valid (password)');
  });

  it('/auth/login (POST) - valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        password: testingUser.password,
        email: testingUser.email,
      });

    expect(response.status).toBe(201);
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
});
