import { User } from './user.entity';

describe('UserEntity', () => {
  it('should create an UserInstance', () => {
    const user = new User();

    expect(user).toBeInstanceOf(User);
  });

  it('should clear email before insert', () => {
    const user = new User();
    const upperCaseEmail = 'Test@Gmail.com';
    user.email = upperCaseEmail;
    user.checkFieldsBeforeInsert();

    expect(user.email).toBe(upperCaseEmail.toLowerCase());
  });

  it('should clear email before update', () => {
    const user = new User();
    const upperCaseEmail = 'Test@Gmail.com';
    user.email = upperCaseEmail;
    user.checkFieldsBeforeUpdate();

    expect(user.email).toBe(upperCaseEmail.toLowerCase());
  });
});
