import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { existsSync } from 'fs';

import { FilesService } from './files.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct path if image exists', () => {
    const image = 'test-image.jpg';
    const expectedPath = join(__dirname, '../../static/products', image);

    (existsSync as jest.Mock).mockReturnValue(true);

    const result = service.getStaticProductImage(image);
    expect(result).toBe(expectedPath);
  });

  it('should throw a BadRequestException if the image does not exist', () => {
    const image = 'test-image.jpg';

    (existsSync as jest.Mock).mockReturnValue(false);

    try {
      service.getStaticProductImage(image);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
    }
  });
});
