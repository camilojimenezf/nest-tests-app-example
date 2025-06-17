import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should work with default parameters', async () => {
    const dto = plainToClass(PaginationDto, {});
    const errors = await validate(dto);

    expect(dto).toBeDefined();
    expect(errors.length).toBe(0);
  });

  it('should validate limit as a positive number', async () => {
    const dto = plainToClass(PaginationDto, { limit: -1 });

    const errors = await validate(dto);
    const limitError = errors.find((error) => error.property === 'limit');

    expect(limitError).toBeDefined();
    expect(limitError.constraints.isPositive).toBe(
      'limit must be a positive number',
    );
  });

  it('should validate offset as a non-negative number', async () => {
    const dto = plainToClass(PaginationDto, { offset: -1 });

    const errors = await validate(dto);
    const offsetError = errors.find((error) => error.property === 'offset');

    expect(offsetError).toBeDefined();
    expect(offsetError.constraints.min).toBe('offset must not be less than 0');
  });

  it('should allow optional gender field with valid values', async () => {
    const validValues = ['men', 'women', 'unisex', 'kid'];

    validValues.forEach(async (gender) => {
      const dto = plainToClass(PaginationDto, { gender });
      const errors = await validate(dto);
      const genderError = errors.find((error) => error.property === 'gender');

      expect(genderError).toBeUndefined();
    });
  });

  it('should validate gender field with invalid values', async () => {
    const validValues = ['invalid', 'other-value', 'test'];

    validValues.forEach(async (gender) => {
      const dto = plainToClass(PaginationDto, { gender });
      const errors = await validate(dto);
      const genderError = errors.find((error) => error.property === 'gender');

      expect(genderError).toBeDefined();
      expect(genderError.constraints.isIn).toBe(
        'gender must be one of the following values: men, women, unisex, kid',
      );
    });
  });
});
