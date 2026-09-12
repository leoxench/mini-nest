import type { ExecutionContext } from '../http/types.js';

export type LogWriter = (message: string) => void;

export class LoggingInterceptor {
  constructor(
    private readonly writeLog: LogWriter = console.log,
    private readonly now: () => number = () => performance.now(),
  ) {}

  async intercept<T>(context: ExecutionContext, next: () => Promise<T>): Promise<T> {
    context.trace?.push('interceptor:before');
    const startedAt = this.now();

    try {
      return await next();
    } finally {
      context.trace?.push('interceptor:after');
      const duration = this.now() - startedAt;
      this.writeLog(
        `${context.request.method.toUpperCase()} ${context.request.path} — ${duration.toFixed(1)} ms`,
      );
    }
  }
}
