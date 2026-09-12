import { requestContext } from '../context/request-context.js';
import { NotFoundError } from '../errors/http.errors.js';

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const users: User[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', age: 36 },
];

export class UserRepository {
  constructor(private readonly writeLog: (line: string) => void = console.log) {}

  async findOne(id: number): Promise<User> {
    await Promise.resolve();
    const requestId = requestContext.getRequestId();
    this.writeLog(`repository requestId=${requestId}`);
    const user = users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundError(`User ${id} was not found`);
    }
    return user;
  }

  async create(input: Omit<User, 'id'>): Promise<User> {
    await Promise.resolve();
    const user = { id: users.length + 1, ...input };
    users.push(user);
    return user;
  }
}
