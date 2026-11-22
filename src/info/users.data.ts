import { User } from './models/user.model';

export const TEMP_USERS: User[] = [
  {
    id: '1',
    name: 'Asha Rao',
    email: 'asha@example.com',
    role: 'Admin',
    city: 'Hyderabad',
    temporary: true,
  },
  {
    id: '2',
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    role: 'Developer',
    city: 'Bengaluru',
    temporary: true,
  },
  {
    id: '3',
    name: 'Meera Iyer',
    email: 'meera@example.com',
    role: 'Designer',
    city: 'Chennai',
    temporary: true,
  },
];
