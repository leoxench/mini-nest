import { randomUUID } from 'node:crypto';
import type { ExecutionContext } from '../http/types.js';

export class RequestIdMiddleware {
  getRequestId(context: ExecutionContext): string {
    context.trace?.push('middleware');
    return context.request.headers['x-request-id']?.trim() || randomUUID();
  }
}
