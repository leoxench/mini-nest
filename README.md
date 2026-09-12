# mini-Nest — Part 3: Request Lifecycle

Навчальна реалізація повного HTTP lifecycle без `@nestjs/*`, Express або Fastify. Проєкт використовує лише Node.js HTTP API, `AsyncLocalStorage`, `reflect-metadata` і Zod 4.

## Життєвий цикл

```text
Request
  │
  ▼
Middleware (request-id)
  │
  ▼
Guard (Authorization) ── false ──► 403
  │ true
  ▼
Interceptor: before + timer
  │
  ▼
Pipe (Zod validation/transform)
  │
  ▼
Handler → Service → Repository
  │
  ▼
Interceptor: after + METHOD /path — N.N ms
  │
  ▼
Response

Exception Filter огортає весь цикл Guard → Interceptor → Pipe → Handler
і перетворює помилки на безпечні HTTP-відповіді.
```

Guard відповідає, чи можна пропустити запит далі, і повертає `boolean`. Interceptor обгортає наступний етап, тому бачить як вхід, так і результат або помилку.

## Чому AsyncLocalStorage, а не глобальна змінна

Глобальна змінна спільна для всіх запитів. Коли один запит очікує `await`, event loop починає обробляти інший запит і перезаписує глобальний `requestId`; після відновлення першого запиту логер уже бачить чужий id. `AsyncLocalStorage` створює окремий контекст для кожного асинхронного ланцюга. Тому сервіс і репозиторій читають правильний `requestId` без додавання його до параметрів кожного методу.

## Запуск

```bash
npm ci
npm test
npm start
```

Сервер працює на `http://localhost:3000`.

```bash
curl -i \
  -H 'Authorization: Bearer demo' \
  -H 'X-Request-Id: my-request-1' \
  http://localhost:3000/users/1
```

Створення користувача з Zod pipe:

```bash
curl -i -X POST \
  -H 'Authorization: Bearer demo' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Grace Hopper","email":"grace@example.com","age":"30"}' \
  http://localhost:3000/users
```

## Docker

```bash
docker compose build
docker compose run --rm api npm test
docker compose up
```

## Acceptance checks

```bash
grep -RE "@nestjs|express|fastify" package.json src/
grep -rn "from 'zod'" src/
npm test
```

Перша команда має повернути порожній результат, друга — знайти Zod pipe, а тестів має бути щонайменше 10.
