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



export function sendDatabaseError(
  reply: FastifyReply,
  message = 'Database error occurred',
  cause?: unknown,
): ReturnType<FastifyReply['status']> {
  if (cause !== undefined) {
    // Log full cause server-side only — never echo DB internals to the client.
    console.error('[database_error]', message, cause);
  }
  return reply.status(500).send({
    type: 'database_error',
    message,
  });
}

export function sendConflict(
  reply: FastifyReply,
  message = 'Conflict',
): ReturnType<FastifyReply['status']> {
  return reply.status(409).send({ type: 'conflict', message });
}

export function sendInvalidCurrentPassword(
  reply: FastifyReply,
  message = 'Current password is incorrect',
): ReturnType<FastifyReply['status']> {
  return reply.status(401).send({ type: 'invalid_current_password', message });
}


