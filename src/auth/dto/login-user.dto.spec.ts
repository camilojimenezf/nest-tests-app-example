import { validate, ValidationError } from 'class-validator';
import { LoginUserDto } from './login-user.dto';

describe('CreateUserDto', () => {
  it('should have the correct properties', async () => {
    const dto = new LoginUserDto();

    dto.email = 'test1@google.com';
    dto.password = 'Abc123';

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should throw errors if password is not valid', async () => {
    const dto = new LoginUserDto();

    dto.email = 'test1@google.com';
    dto.password = 'abcdef';

    const errors = await validate(dto);
    const passwordError: ValidationError = errors.find(
      (error) => error.property === 'password',
    );

    expect(passwordError).toBeDefined();
    expect(passwordError.constraints.matches).toBe(
      'The password must have a Uppercase, lowercase letter and a number',
    );
  });
});
