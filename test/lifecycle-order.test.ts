import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Lifecycle } from '../src/core/lifecycle.js';
import type { HttpRequest } from '../src/http/types.js';
import { LoggingInterceptor } from '../src/interceptors/logging.interceptor.js';

const authorizedRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'POST',
  path: '/users',
  headers: { authorization: 'Bearer training-token' },
  body: { value: true },
  ...overrides,
});

test('executes all six lifecycle stages in the exact order', async () => {
  const trace: string[] = [];
  const lifecycle = new Lifecycle({ interceptor: new LoggingInterceptor(() => {}) });

  const response = await lifecycle.handle(
    authorizedRequest(),
    {
      pipe: { transform: (value) => value },
      handler: () => ({ ok: true }),
    },
    trace,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(trace, [
    'middleware',
    'guard',
    'interceptor:before',
    'pipe',
    'handler',
    'interceptor:after',
  ]);
});

test('guard rejects an unauthenticated request before handler', async () => {
  let handlerCalls = 0;
  const lifecycle = new Lifecycle({ interceptor: new LoggingInterceptor(() => {}) });

  const response = await lifecycle.handle(
    authorizedRequest({ headers: {} }),
    { handler: () => void handlerCalls++ },
  );

  assert.equal(response.statusCode, 403);
  assert.equal(handlerCalls, 0);
});

test('logging interceptor writes route and elapsed milliseconds', async () => {
  const logs: string[] = [];
  const times = [100, 112.3];
  const interceptor = new LoggingInterceptor(
    (line) => logs.push(line),
    () => times.shift() ?? 112.3,
  );
  const lifecycle = new Lifecycle({ interceptor });

  await lifecycle.handle(authorizedRequest({ method: 'GET', path: '/users/1' }), {
    handler: () => ({ id: 1 }),
  });

  assert.match(logs[0], /^GET \/users\/1 — 12\.3 ms$/);
});

test('interceptor after-stage and timing log run even when handler throws', async () => {
  const logs: string[] = [];
  const trace: string[] = [];
  const lifecycle = new Lifecycle({
    interceptor: new LoggingInterceptor((line) => logs.push(line)),
  });

  const response = await lifecycle.handle(
    authorizedRequest(),
    { handler: () => { throw new Error('hidden failure'); } },
    trace,
  );

  assert.equal(response.statusCode, 500);
  assert.equal(trace.at(-1), 'interceptor:after');
  assert.match(logs[0], /POST \/users — [0-9]+(\.[0-9]+)? ms/);
});
