import { z, type ZodType } from 'zod';
import { ValidationError } from '../errors/http.errors.js';

export class ZodValidationPipe<T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }

    throw new ValidationError(
      result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    );
  }
}

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  age: z.coerce.number().int().min(18).max(120),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
