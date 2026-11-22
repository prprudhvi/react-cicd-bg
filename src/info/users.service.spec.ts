import { UsersService } from './users.service';

describe('UsersService', () => {
  const service = new UsersService();

  it('returns every temporary user', () => {
    const users = service.findAll();
    expect(users).toHaveLength(3);
    expect(users.every((user) => user.temporary)).toBe(true);
    expect(users.map((user) => user.name)).toEqual(['Asha Rao', 'Ravi Kumar', 'Meera Iyer']);
  });

  it('returns a copy so a caller cannot edit the source list', () => {
    const [first] = service.findAll();
    first.name = 'Changed';
    expect(service.findAll()[0]?.name).toBe('Asha Rao');
  });

  it('returns one user by id', () => {
    expect(service.findOne('2')).toMatchObject({ name: 'Ravi Kumar', city: 'Bengaluru' });
  });

  it('returns null for an unknown id', () => {
    expect(service.findOne('999')).toBeNull();
  });
});
