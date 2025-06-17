import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { getUser } from './get-user.decorator';
import { ValidRoles } from '../interfaces';

jest.mock('@nestjs/common', () => ({
  createParamDecorator: jest.fn().mockImplementation(() => jest.fn()),
  InternalServerErrorException:
    jest.requireActual('@nestjs/common').InternalServerErrorException,
}));

const mockUserRoles = [ValidRoles.admin, ValidRoles.user];
const mockUser = {
  email: 'test@gmail.com',
  roles: mockUserRoles,
};

describe('GetUser Decorator', () => {
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: mockUser,
      }),
    }),
  } as unknown as ExecutionContext;

  it('should return the user from the request', () => {
    const result = getUser('', mockExecutionContext);

    expect(result).toEqual(
      expect.objectContaining({
        ...mockUser,
      }),
    );
  });

  it('should return specific property of the user from the request', () => {
    const result = getUser('roles', mockExecutionContext);

    expect(result).toBeInstanceOf(Array);
    expect(result).toEqual(expect.arrayContaining(mockUserRoles));
  });

  it("should throw an error if user don't exists", () => {
    const mockExecutionContextWithoutUser = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: undefined }),
      }),
    } as unknown as ExecutionContext;

    try {
      getUser('roles', mockExecutionContextWithoutUser);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error.message).toBe('User not found (request)');
    }
  });

  it('should call createParamDecorator with getUser', () => {
    expect(createParamDecorator).toHaveBeenCalledWith(getUser);
  });
});
