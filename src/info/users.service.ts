import { Injectable } from '@nestjs/common';
import { User } from './models/user.model';
import { TEMP_USERS } from './users.data';

@Injectable()
export class UsersService {
  findAll(): User[] {
    return TEMP_USERS.map((user) => ({ ...user }));
  }

  findOne(id: string): User | null {
    const user = TEMP_USERS.find((entry) => entry.id === id);
    return user ? { ...user } : null;
  }
}
