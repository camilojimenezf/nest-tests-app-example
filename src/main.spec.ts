import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { bootstrap } from './main';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockReturnValue({
    log: jest.fn(),
  }),
  ValidationPipe: jest.requireActual('@nestjs/common').ValidationPipe,
}));

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn(),
    }),
  },
}));

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn().mockReturnValue({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnThis(),
  }),
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue('document'),
    setup: jest.fn(),
  },
}));

jest.mock('./app.module', () => ({
  AppModule: jest.fn().mockReturnValue('AppModule'),
}));

describe('Main.ts', () => {
  let mockApp: {
    setGlobalPrefix: jest.Mock;
    enableCors: jest.Mock;
    useGlobalPipes: jest.Mock;
    listen: jest.Mock;
  };

  let mockLogger: {
    log: jest.Mock;
  };

  beforeEach(() => {
    mockApp = {
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (Logger as unknown as jest.Mock).mockReturnValue(mockLogger);
  });

  it('should create the application with AppModule', async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(mockLogger.log).toHaveBeenCalledWith('App running on port 3000');
  });

  it('should create the application runnin on env.PORT', async () => {
    process.env.PORT = '8080';

    await bootstrap();

    expect(mockLogger.log).toHaveBeenCalledWith('App running on port 8080');
  });

  it('should set global prefix', async () => {
    await bootstrap();

    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
  });

  it('should set global pipes', async () => {
    await bootstrap();

    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.objectContaining({
        errorHttpStatusCode: 400,
        validatorOptions: expect.objectContaining({
          forbidNonWhitelisted: true,
          forbidUnknownValues: false,
          whitelist: true,
        }),
      }),
    );
  });

  it('should call DocumentBuilder', async () => {
    await bootstrap();

    expect(DocumentBuilder).toHaveBeenCalled();
  });

  it('should create swagger document', async () => {
    await bootstrap();

    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'api',
      expect.anything(),
      'document',
    );
  });
});
