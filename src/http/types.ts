export type Headers = Record<string, string | undefined>;

export interface HttpRequest {
  method: string;
  path: string;
  headers: Headers;
  body?: unknown;
  params?: Record<string, string>;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface ExecutionContext {
  request: HttpRequest;
  trace?: string[];
}

export type Handler = (argument?: unknown) => unknown | Promise<unknown>;

export interface RouteDefinition {
  handler: Handler;
  pipe?: { transform(value: unknown): unknown };
}
