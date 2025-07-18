import { ValidRoles } from './valid-roles';

describe('Valid roles Enum', () => {
  it('should have correct values', () => {
    expect(ValidRoles.admin).toBe('admin');
    expect(ValidRoles.superUser).toBe('super-user');
    expect(ValidRoles.user).toBe('user');
  });

  it('should contain all expected values', () => {
    const values = ['admin', 'super-user', 'user'];

    expect(Object.values(ValidRoles)).toEqual(expect.arrayContaining(values));
  });
});
