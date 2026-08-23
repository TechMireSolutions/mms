import type { FastifyReply, FastifyRequest } from 'fastify';

export async function csrfGuard(request: FastifyRequest, reply: FastifyReply) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

  const headerToken = request.headers['x-csrf-token'];
  const cookieToken = request.cookies['csrf_token'];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return reply.status(403).send({
      code: 'CSRF_VALIDATION_FAILED',
      message: 'Invalid or missing CSRF token',
    });
  }
}
