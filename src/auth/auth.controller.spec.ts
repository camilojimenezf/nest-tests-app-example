import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      create: jest.fn(),
      login: jest.fn(),
      checkAuthStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
      controllers: [AuthController],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should create user with the proper DTO', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@google.com',
      password: 'Abc123',
      fullName: 'test',
    };

    await authController.createUser(createUserDto);

    expect(authService.create).toHaveBeenCalledWith(createUserDto);
  });

  it('should login user with the proper DTO', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@google.com',
      password: 'Abc123',
    };

    await authController.loginUser(loginUserDto);

    expect(authService.login).toHaveBeenCalledWith(loginUserDto);
  });

  it('should check user status with the proper User', async () => {
    const user: User = {
      email: 'test@google.com',
      password: 'Abc123',
      id: '1',
    } as User;

    await authController.checkAuthStatus(user);

    expect(authService.checkAuthStatus).toHaveBeenCalledWith(user);
  });

  it('should return private route data', () => {
    const user = {
      id: '1',
      email: 'test@gmail.com',
      fullName: 'Test User',
    } as User;

    const request = {} as Express.Request;
    const rawHeaders = ['header1: value1', 'header2: value2'];
    const headers = { header1: 'value1', header2: 'value2' };

    const result = authController.testingPrivateRoute(
      request,
      user,
      user.email,
      rawHeaders,
      headers,
    );

    expect(result).toEqual({
      ok: true,
      message: 'Hola Mundo Private',
      user: { id: '1', email: 'test@gmail.com', fullName: 'Test User' },
      userEmail: 'test@gmail.com',
      rawHeaders: ['header1: value1', 'header2: value2'],
      headers: { header1: 'value1', header2: 'value2' },
    });
  });
});
