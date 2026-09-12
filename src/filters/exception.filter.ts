import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../errors/http.errors.js';
import type { HttpResponse } from '../http/types.js';

export class ExceptionFilter {
  catch(error: unknown): Omit<HttpResponse, 'headers'> {
    if (error instanceof ForbiddenError) {
      return { statusCode: 403, body: { statusCode: 403, message: error.message } };
    }

    if (error instanceof NotFoundError) {
      return { statusCode: 404, body: { statusCode: 404, message: error.message } };
    }

    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: {
          statusCode: 400,
          message: error.message,
          fields: error.fields,
        },
      };
    }

    return {
      statusCode: 500,
      body: { statusCode: 500, message: 'Internal server error' },
    };
  }
}
