import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { Lifecycle } from '../src/core/lifecycle.js';
import { requestContext } from '../src/context/request-context.js';
import { LoggingInterceptor } from '../src/interceptors/logging.interceptor.js';
import { UserRepository } from '../src/repositories/user.repository.js';
import { UserService } from '../src/services/user.service.js';

const lifecycle = () =>
  new Lifecycle({ interceptor: new LoggingInterceptor(() => {}) });

test('client X-Request-Id is returned unchanged', async () => {
  const response = await lifecycle().handle({
    method: 'GET',
    path: '/users/1',
    headers: {
      authorization: 'Bearer token',
      'x-request-id': 'client-request-42',
    },
  }, { handler: () => ({ ok: true }) });

  assert.equal(response.headers['x-request-id'], 'client-request-42');
});

test('request id is generated when client does not send one', async () => {
  const response = await lifecycle().handle({
    method: 'GET',
    path: '/users/1',
    headers: { authorization: 'Bearer token' },
  }, { handler: () => ({ ok: true }) });

  assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/);
});

test('repository reads the same id two levels below handler without an argument', async () => {
  const logs: string[] = [];
  const service = new UserService(new UserRepository((line) => logs.push(line)));
  const response = await lifecycle().handle({
    method: 'GET',
    path: '/users/1',
    headers: {
      authorization: 'Bearer token',
      'x-request-id': 'deep-context-id',
    },
  }, { handler: () => service.findUser(1) });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(logs, ['repository requestId=deep-context-id']);
});

test('ten concurrent requests never leak request ids', async () => {
  const ids = Array.from({ length: 10 }, (_, index) => `parallel-${index}`);
  const responses = await Promise.all(ids.map((id, index) =>
    lifecycle().handle({
      method: 'GET',
      path: '/context',
      headers: { authorization: 'Bearer token', 'x-request-id': id },
    }, {
      handler: async () => {
        await delay((10 - index) * 2);
        return { observed: requestContext.getRequestId() };
      },
    }),
  ));

  responses.forEach((response, index) => {
    assert.equal(response.headers['x-request-id'], ids[index]);
    assert.equal((response.body as { observed: string }).observed, ids[index]);
  });
});
