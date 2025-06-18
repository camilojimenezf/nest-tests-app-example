import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const mockUserRepository = {
      findOneBy: jest.fn(),
    };
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user if user exists and is active', async () => {
    const payload: JwtPayload = { id: '123' };
    const mockUser = { id: '123', isActive: true } as User;

    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

    const response = await strategy.validate(payload);

    expect(response).toBeDefined();
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: payload.id });
    expect(response).toEqual(mockUser);
  });

  it('should throw UnauthorizedException if user does not exists', async () => {
    const payload: JwtPayload = { id: '123' };

    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(undefined);

    try {
      await strategy.validate(payload);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('Token not valid');
    }
  });

  it('should thrown UnauthorizedExceptio if user is not active', async () => {
    const payload: JwtPayload = { id: '123' };
    const mockUser = { id: '123', isActive: false } as User;

    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

    try {
      await strategy.validate(payload);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('User is inactive, talk with an admin');
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: payload.id });
    }
  });
});
