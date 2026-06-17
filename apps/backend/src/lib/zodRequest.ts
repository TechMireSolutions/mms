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
