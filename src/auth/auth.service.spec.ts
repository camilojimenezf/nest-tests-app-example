import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { CreateUserDto, LoginUserDto } from './dto';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should create a user and return user with token', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@gmail.com',
      password: 'Abc123',
      fullName: 'test',
    };

    const user = {
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      id: '1',
      isActive: true,
      roles: ['user'],
    } as User;

    jest.spyOn(userRepository, 'create').mockReturnValue(user);
    const bcryptSpy = jest
      .spyOn(bcrypt, 'hashSync')
      .mockReturnValue('XHCSDH!"/(!/&!');

    const response = await authService.create(createUserDto);

    expect(response).toEqual({
      user,
      token: 'mock-jwt-token',
    });
    expect(bcryptSpy).toHaveBeenCalledWith(createUserDto.password, 10);
  });

  it('should throw an error if email already exist', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@gmail.com',
      password: 'Abc123',
      fullName: 'test',
    };

    jest
      .spyOn(userRepository, 'save')
      .mockRejectedValue({ code: '23505', detail: 'Email already exists' });

    await expect(authService.create(createUserDto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(authService.create(createUserDto)).rejects.toThrow(
      'Email already exists',
    );
  });

  it('should throw an internal server error', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@gmail.com',
      password: 'Abc123',
      fullName: 'test',
    };

    const saveUserSpy = jest
      .spyOn(userRepository, 'save')
      .mockRejectedValue({ code: '99999' });
    const consoleSpy = jest.spyOn(console, 'log');

    await expect(authService.create(createUserDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(authService.create(createUserDto)).rejects.toThrow(
      'Please check server logs',
    );
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(saveUserSpy).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });

  it('should login user and return token', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@gmail.com',
      password: 'Abc123',
    };

    const user = {
      email: loginUserDto.email,
      password: loginUserDto.password,
      isActive: true,
      roles: ['user'],
      fullName: 'test',
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

    const response = await authService.login(loginUserDto);

    expect(response.user.password).toBeUndefined();
    expect(response).toEqual({
      user,
      token: 'mock-jwt-token',
    });
  });

  it('should throw an UnauthorizedException if credentials are not valid (email)', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@gmail.com',
      password: 'Abc123',
    };

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

    try {
      await authService.login(loginUserDto);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.status).toBe(401);
      expect(error.message).toBe('Credentials are not valid (email)');
    }
  });

  it('should throw an UnauthorizedException if credentials are not valid (password)', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@gmail.com',
      password: 'Abc123',
    };

    const user = {
      email: loginUserDto.email,
      password: loginUserDto.password,
      isActive: true,
      roles: ['user'],
      fullName: 'test',
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

    try {
      await authService.login(loginUserDto);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.status).toBe(401);
      expect(error.message).toBe('Credentials are not valid (password)');
    }
  });

  it('should check auth status and return user with new token', async () => {
    const user = {
      email: 'test@gmail.com',
      password: 'Abc123',
      isActive: true,
      roles: ['user'],
      fullName: 'test',
    } as User;

    const response = await authService.checkAuthStatus(user);

    expect(response).toEqual({
      user,
      token: 'mock-jwt-token',
    });
  });
});
