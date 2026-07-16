import type { FastifyReply } from 'fastify';

export function sendForbidden(
  reply: FastifyReply,
  message = 'Insufficient permissions',
): ReturnType<FastifyReply['status']> {
  return reply.status(403).send({ type: 'forbidden', message });
}

export function sendUnauthorized(
  reply: FastifyReply,
  message = 'Authentication is required',
  type = 'auth_required',
): ReturnType<FastifyReply['status']> {
  return reply.status(401).send({ type, message });
}

export function sendNotFound(
  reply: FastifyReply,
  message = 'Resource not found',
): ReturnType<FastifyReply['status']> {
  return reply.status(404).send({ type: 'not_found', message });
}

export function sendMappedError<Code extends string>(
  reply: FastifyReply,
  error: { code: Code; message: string },
  statusByCode: Record<Code, number>,
  defaultStatus = 400,
): ReturnType<FastifyReply['status']> {
  const status = statusByCode[error.code] ?? defaultStatus;
  return reply.status(status).send({ type: error.code, message: error.message } as any);
}

