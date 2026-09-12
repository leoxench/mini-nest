import { Lifecycle } from './core/lifecycle.js';
import { NotFoundError } from './errors/http.errors.js';
import type { HttpRequest, RouteDefinition } from './http/types.js';
import {
  createUserSchema,
  ZodValidationPipe,
  type CreateUserInput,
} from './pipes/zod-validation.pipe.js';
import { UserRepository } from './repositories/user.repository.js';
import { UserService } from './services/user.service.js';

export class App {
  private readonly service: UserService;
  private readonly createUserPipe = new ZodValidationPipe(createUserSchema);

  constructor(
    private readonly lifecycle = new Lifecycle(),
    repository = new UserRepository(),
  ) {
    this.service = new UserService(repository);
  }

  handle(request: HttpRequest) {
    const route = this.resolveRoute(request);
    return this.lifecycle.handle(request, route);
  }

  private resolveRoute(request: HttpRequest): RouteDefinition {
    const userMatch = request.path.match(/^\/users\/(\d+)$/);
    if (request.method === 'GET' && userMatch) {
      return { handler: () => this.service.findUser(Number(userMatch[1])) };
    }

    if (request.method === 'POST' && request.path === '/users') {
      return {
        pipe: this.createUserPipe,
        handler: (input) => this.service.createUser(input as CreateUserInput),
      };
    }

    return {
      handler: () => {
        throw new NotFoundError(`Route ${request.method} ${request.path} was not found`);
      },
    };
  }
}
