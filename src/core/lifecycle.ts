import { requestContext } from '../context/request-context.js';
import { ForbiddenError } from '../errors/http.errors.js';
import { ExceptionFilter } from '../filters/exception.filter.js';
import { AuthGuard } from '../guards/auth.guard.js';
import type {
  ExecutionContext,
  HttpRequest,
  HttpResponse,
  RouteDefinition,
} from '../http/types.js';
import { LoggingInterceptor } from '../interceptors/logging.interceptor.js';
import { RequestIdMiddleware } from '../middleware/request-id.middleware.js';

export interface LifecycleOptions {
  middleware?: RequestIdMiddleware;
  guard?: AuthGuard;
  interceptor?: LoggingInterceptor;
  filter?: ExceptionFilter;
}

export class Lifecycle {
  private readonly middleware: RequestIdMiddleware;
  private readonly guard: AuthGuard;
  private readonly interceptor: LoggingInterceptor;
  private readonly filter: ExceptionFilter;

  constructor(options: LifecycleOptions = {}) {
    this.middleware = options.middleware ?? new RequestIdMiddleware();
    this.guard = options.guard ?? new AuthGuard();
    this.interceptor = options.interceptor ?? new LoggingInterceptor();
    this.filter = options.filter ?? new ExceptionFilter();
  }

  async handle(
    request: HttpRequest,
    route: RouteDefinition,
    trace?: string[],
  ): Promise<HttpResponse> {
    const context: ExecutionContext = { request, trace };
    const requestId = this.middleware.getRequestId(context);

    return requestContext.run(requestId, async () => {
      const headers = { 'x-request-id': requestId, 'content-type': 'application/json' };

      try {
        if (!this.guard.canActivate(context)) {
          throw new ForbiddenError();
        }

        const body = await this.interceptor.intercept(context, async () => {
          let argument = request.body;
          if (route.pipe) {
            context.trace?.push('pipe');
            argument = route.pipe.transform(argument);
          }
          context.trace?.push('handler');
          return route.handler(argument);
        });

        return { statusCode: 200, headers, body };
      } catch (error) {
        const mapped = this.filter.catch(error);
        return { ...mapped, headers };
      }
    });
  }
}
