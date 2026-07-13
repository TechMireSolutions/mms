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
