import 'reflect-metadata';
import { createHttpServer } from './http/server.js';

const port = Number(process.env.PORT ?? 3000);
const server = createHttpServer();

server.listen(port, '0.0.0.0', () => {
  console.log(`mini-Nest listening on http://localhost:${port}`);
});
