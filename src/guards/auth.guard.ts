import type { ExecutionContext } from '../http/types.js';

export class AuthGuard {
  canActivate(context: ExecutionContext): boolean {
    context.trace?.push('guard');
    const authorization = context.request.headers.authorization;
    return typeof authorization === 'string' && authorization.trim().length > 0;
  }
}
