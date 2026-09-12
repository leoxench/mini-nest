export class ForbiddenError extends Error {
  constructor(message = 'Authorization header is required') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  constructor(public readonly fields: ValidationIssue[]) {
    super('Request validation failed');
    this.name = 'ValidationError';
  }
}
