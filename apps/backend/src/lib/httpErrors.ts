import type { FastifyReply } from 'fastify';
import { logger } from './logger.js';

export function sendForbidden(
  reply: FastifyReply,
  message = 'Insufficient permissions',
): FastifyReply {
  return reply.status(403).send({ type: 'forbidden', message });
}

export function sendUnauthorized(
  reply: FastifyReply,
  message = 'Authentication is required',
  type = 'auth_required',
): FastifyReply {
  return reply.status(401).send({ type, message });
}

export function sendNotFound(
  reply: FastifyReply,
  message = 'Resource not found',
): FastifyReply {
  return reply.status(404).send({ type: 'not_found', message });
}

export function sendBadRequest(
  reply: FastifyReply,
  message = 'Bad request',
): FastifyReply {
  return reply.status(400).send({ type: 'bad_request', message });
}

/** Domain errors thrown from use-cases with an explicit HTTP status + type. */
export function sendIfHttpDomainError(
  reply: FastifyReply,
  error: unknown,
): FastifyReply | null {
  if (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number' &&
    'type' in error &&
    typeof (error as { type?: unknown }).type === 'string'
  ) {
    const domainError = error as Error & { statusCode: number; type: string };
    return reply.status(domainError.statusCode).send({
      type: domainError.type,
      message: domainError.message,
    });
  }
  return null;
}

export function sendDatabaseError(
  reply: FastifyReply,
  message = 'Database error occurred',
  cause?: unknown,
): FastifyReply {
  if (cause !== undefined) {
    // Log full cause server-side only — never echo DB internals to the client.
    logger.error({ err: cause }, message);
  }
  return reply.status(500).send({
    type: 'database_error',
    message,
  });
}

export function sendConflict(
  reply: FastifyReply,
  message = 'Conflict',
): FastifyReply {
  return reply.status(409).send({ type: 'conflict', message });
}

export function sendInvalidCurrentPassword(
  reply: FastifyReply,
  message = 'Current password is incorrect',
): FastifyReply {
  return reply.status(401).send({ type: 'invalid_current_password', message });
}

export function sendServiceUnavailable(
  reply: FastifyReply,
  message = 'Service unavailable',
): FastifyReply {
  return reply.status(503).send({ type: 'service_unavailable', message });
}
