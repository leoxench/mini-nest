import type { CreateUserInput } from '../pipes/zod-validation.pipe.js';
import { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  findUser(id: number) {
    return this.loadUser(id);
  }

  private loadUser(id: number) {
    return this.repository.findOne(id);
  }

  createUser(input: CreateUserInput) {
    return this.repository.create(input);
  }
}
