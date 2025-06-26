import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ProductsService } from './products.service';
import { Product, ProductImage } from './entities';
import { CreateProductDto } from './dto/create-product.dto';
import { User } from '../auth/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let productImageRepository: Repository<ProductImage>;

  let mockQueryBuilder: {
    where: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    getOne: jest.Mock;
  };

  let mockQueryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    manager: {
      save: jest.Mock;
      delete: jest.Mock;
    };
    commitTransaction: jest.Mock;
    release: jest.Mock;
    rollbackTransaction: jest.Mock;
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        save: jest.fn(),
        delete: jest.fn(),
      },
      commitTransaction: jest.fn(),
      release: jest.fn(),
      rollbackTransaction: jest.fn(),
    };

    const mockProductRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    };

    const mockProductImageRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockProductImageRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    productImageRepository = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product', async () => {
    const dto = {
      title: 'Test Product',
      price: 100,
      images: ['img1.jpg'],
    } as CreateProductDto;

    const user = {
      id: '1',
      email: 'test@google.com',
    } as User;

    const product = {
      id: '1',
      ...dto,
      user,
    } as unknown as Product;

    jest.spyOn(productRepository, 'create').mockImplementation((data) => {
      return {
        ...data,
      } as unknown as Product;
    });
    jest.spyOn(productRepository, 'save').mockResolvedValue(product);
    jest
      .spyOn(productImageRepository, 'create')
      .mockImplementation(({ url }) => {
        return {
          url,
          id: 1,
        } as unknown as ProductImage;
      });

    const result = await service.create(dto, user);

    expect(result).toEqual({
      title: 'Test Product',
      price: 100,
      images: [{ url: 'img1.jpg', id: 1 }],
      user: { id: '1', email: 'test@google.com' },
      rawImages: ['img1.jpg'],
    });
  });

  it('should throw a BadRequestException if create product fails', async () => {
    const dto = {
      title: 'Test Product',
      price: 100,
      images: ['img1.jpg'],
    } as CreateProductDto;

    const user = {
      id: '1',
      email: 'test@google.com',
    } as User;

    const error = {
      code: '23505',
      detail: 'Cannot create product because XYZ',
    };

    jest.spyOn(productRepository, 'save').mockRejectedValue(error);

    try {
      await service.create(dto, user);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
    }
  });

  it('should find all products', async () => {
    const dto: PaginationDto = {};

    const products = [
      {
        id: 1,
        title: 'product1',
        price: 10,
        images: [],
      },
      {
        id: 2,
        title: 'product2',
        price: 20,
        images: [],
      },
    ] as unknown as Product[];

    jest.spyOn(productRepository, 'find').mockResolvedValue(products);
    jest.spyOn(productRepository, 'count').mockResolvedValue(products.length);

    const result = await service.findAll(dto);

    expect(result).toEqual({
      count: products.length,
      pages: 1,
      products,
    });
  });

  it('should find a product by valid ID', async () => {
    const productId = '884c574e-9920-4e1b-81f9-cba11203dd39';
    const product = {
      id: productId,
      title: 'Product 1',
    } as Product;

    jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(product);

    const result = await service.findOne(productId);

    expect(result).toEqual(product);
  });

  it('should throw an error if ID was not found', async () => {
    const productId = '884c574e-9920-4e1b-81f9-cba11203dd39';

    jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(null);

    try {
      await service.findOne(productId);

      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe(`Product with ${productId} not found`);
    }
  });

  it('should return product by term or slug', async () => {
    const product = {
      id: 1,
      title: 'product one special edition',
    };

    jest.spyOn(mockQueryBuilder, 'getOne').mockResolvedValue(product);

    const result = await service.findOne('product one');
    expect(result).toEqual(product);
  });

  it('should throw an error NotFoundException if product not found on update product', async () => {
    const productId = '884c574e-9920-4e1b-81f9-cba11203dd39';
    const dto = {
      title: 'Test Product',
      price: 100,
      images: ['img1.jpg'],
    } as UpdateProductDto;

    const user = {
      id: '1',
      email: 'test@google.com',
    } as User;

    jest.spyOn(productRepository, 'preload').mockResolvedValue(null);

    try {
      await service.update(productId, dto, user);

      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe(`Product with id: ${productId} not found`);
    }
  });

  it('should update product successfully', async () => {
    const productId = '884c574e-9920-4e1b-81f9-cba11203dd39';
    const dto = {
      title: 'Updated test Product',
      price: 100,
      images: [],
    } as UpdateProductDto;

    const user = {
      id: '1',
      email: 'test@google.com',
    } as User;

    const product = {
      id: productId,
      ...dto,
    } as unknown as Product;

    jest.spyOn(productRepository, 'preload').mockResolvedValue(product);
    jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(product);

    const result = await service.update(productId, dto, user);

    expect(product).toEqual(result);
  });

  it('should update product and commit transaction', async () => {
    const productId = '884c574e-9920-4e1b-81f9-cba11203dd39';
    const dto = {
      title: 'Updated test Product',
      price: 100,
      images: [],
    } as UpdateProductDto;

    const user = {
      id: '1',
      email: 'test@google.com',
    } as User;

    const product = {
      id: productId,
      ...dto,
    } as unknown as Product;

    jest.spyOn(productRepository, 'preload').mockResolvedValue(product);
    jest.spyOn(productRepository, 'findOneBy').mockResolvedValue(product);

    await service.update(productId, dto, user);

    expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
  });
});
