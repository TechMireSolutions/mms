import type { FastifyReply } from 'fastify';

export function sendForbidden(
  reply: FastifyReply,
  message = 'Insufficient permissions',
): ReturnType<FastifyReply['status']> {
  return reply.status(403).send({ type: 'forbidden', message });
}
