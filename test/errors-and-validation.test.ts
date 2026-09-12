import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Lifecycle } from '../src/core/lifecycle.js';
import { NotFoundError } from '../src/errors/http.errors.js';
import { LoggingInterceptor } from '../src/interceptors/logging.interceptor.js';
import {
  createUserSchema,
  ZodValidationPipe,
} from '../src/pipes/zod-validation.pipe.js';

const request = (body?: unknown) => ({
  method: 'POST',
  path: '/users',
  headers: { authorization: 'Bearer token' },
  body,
});

const lifecycle = () =>
  new Lifecycle({ interceptor: new LoggingInterceptor(() => {}) });

test('Zod pipe validates and coerces a valid body', async () => {
  const response = await lifecycle().handle(request({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    age: '30',
  }), {
    pipe: new ZodValidationPipe(createUserSchema),
    handler: (input) => input,
  });

  assert.equal(response.statusCode, 200);
  assert.equal((response.body as { age: number }).age, 30);
});

test('invalid body becomes 400 with a list of fields', async () => {
  const response = await lifecycle().handle(request({
    name: '',
    email: 'wrong',
    age: 12,
  }), {
    pipe: new ZodValidationPipe(createUserSchema),
    handler: () => ({ shouldNotRun: true }),
  });

  assert.equal(response.statusCode, 400);
  const body = response.body as { fields: Array<{ field: string }> };
  assert.deepEqual(body.fields.map((item) => item.field), ['name', 'email', 'age']);
});

test('NotFoundError becomes a meaningful 404 response', async () => {
  const response = await lifecycle().handle(request(), {
    handler: () => { throw new NotFoundError('User 404 was not found'); },
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    statusCode: 404,
    message: 'User 404 was not found',
  });
});

test('unexpected error becomes sanitized 500 without message or stack', async () => {
  const response = await lifecycle().handle(request(), {
    handler: () => { throw new Error('boom'); },
  });

  assert.equal(response.statusCode, 500);
  const serialized = JSON.stringify(response.body);
  assert.doesNotMatch(serialized, /boom|at .*\.ts:/);
  assert.deepEqual(response.body, {
    statusCode: 500,
    message: 'Internal server error',
  });
});
