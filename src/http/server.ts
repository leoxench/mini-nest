import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { App } from '../app.js';
import type { Headers, HttpRequest } from './types.js';

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const normalizeHeaders = (request: IncomingMessage): Headers => {
  const headers: Headers = {};
  for (const [key, value] of Object.entries(request.headers)) {
    headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
  }
  return headers;
};

export const createHttpServer = (app = new App()) =>
  createServer(async (incoming: IncomingMessage, outgoing: ServerResponse) => {
    try {
      const request: HttpRequest = {
        method: incoming.method ?? 'GET',
        path: new URL(incoming.url ?? '/', 'http://localhost').pathname,
        headers: normalizeHeaders(incoming),
        body: await readBody(incoming),
      };
      const response = await app.handle(request);
      outgoing.writeHead(response.statusCode, response.headers);
      outgoing.end(JSON.stringify(response.body));
    } catch {
      outgoing.writeHead(500, { 'content-type': 'application/json' });
      outgoing.end(JSON.stringify({ statusCode: 500, message: 'Internal server error' }));
    }
  });
