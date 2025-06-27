import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

import { AppModule } from '../../../src/app.module';

describe('FilesModule (e2e)', () => {
  let app: INestApplication;
  const testImagePath = join(__dirname, 'test-image.jpg');

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
  });

  afterEach(async () => {
    await app.close();
  });

  it('should throw an error if no file selected', async () => {
    const response = await request(app.getHttpServer()).post('/files/product');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Make sure that the file is an image',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should throw an error if no valid file is selected', async () => {
    const response = await request(app.getHttpServer())
      .post('/files/product')
      .attach('file', Buffer.from('this is a test file'), 'test.txt');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Make sure that the file is an image',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('should upload image file successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/files/product')
      .attach('file', testImagePath);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      secureUrl: expect.any(String),
      fileName: expect.any(String),
    });

    const filePath = join(
      __dirname,
      '../../../static/products',
      response.body.fileName,
    );
    const fileExists = existsSync(filePath);

    expect(fileExists).toBe(true);
    unlinkSync(filePath);
  });

  it('should throw an 400 error if the requested image does not exists', async () => {
    const imageName = 'not-exists-image.jpg';
    const response = await request(app.getHttpServer()).get(
      `/files/product/${imageName}`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: `No product found with image ${imageName}`,
      error: 'Bad Request',
      statusCode: 400,
    });
  });
});
