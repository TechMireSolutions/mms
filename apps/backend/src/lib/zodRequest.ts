import type { FastifyReply } from 'fastify';
import type { ZodType } from 'zod';

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function parseRequest<T>(schema: ZodType<T>, value: unknown): ParseResult<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.message };
  }
  return { ok: true, data: parsed.data };
}

export function replyValidationError(
  reply: FastifyReply,
  message = 'Invalid request',
): ReturnType<FastifyReply['status']> {
  return reply.status(400).send({ type: 'validation_error', message });
}

export function validateOrThrow(schema: ZodType<unknown>, value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = schema.safeParse(item);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
      }
    }
  } else {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
  }
}
