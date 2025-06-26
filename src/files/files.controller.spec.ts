import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  const mockFilesService = {
    getStaticProductImage: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
      controllers: [FilesController],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return file path when findProductImage is called', () => {
    const mockResponse = { sendFile: jest.fn() } as unknown as Response;
    const imageName = 'test-image.jpg';
    const filePath = `/static/products${imageName}`;

    jest.spyOn(service, 'getStaticProductImage').mockReturnValue(filePath);

    controller.findProductImage(mockResponse, imageName);

    expect(mockResponse.sendFile).toHaveBeenCalledTimes(1);
    expect(mockResponse.sendFile).toHaveBeenCalledWith(filePath);
  });

  it('should return a secureUrl when uploadProduct image is called with a file', async () => {
    const domain = 'https://domain.com';
    const file = {
      file: 'test-image.jpg',
      filename: 'testimagename.jpg',
    } as unknown as Express.Multer.File;

    jest.spyOn(mockConfigService, 'get').mockReturnValue(domain);

    const result = await controller.uploadProductImage(file);

    expect(result).toEqual({
      secureUrl: `${domain}/files/product/testimagename.jpg`,
      fileName: 'testimagename.jpg',
    });
  });

  it('should throw BadRequestException if no file was provided', async () => {
    try {
      await controller.uploadProductImage(null);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Make sure that the file is an image');
    }
  });
});
