import type { FastifyError, FastifyInstance } from 'fastify';

export function registerErrorHandlers(app: FastifyInstance, isProd: boolean): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        type: 'validation_error',
        message: 'Invalid request',
      });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error({ err: error, statusCode }, 'unhandled server error');
    }

    if (statusCode >= 500 && isProd) {
      return reply.status(500).send({
        type: 'server_error',
        message: 'Internal server error',
      });
    }

    return reply.status(statusCode).send({
      type: error.code ?? 'server_error',
      message: error.message,
    });
  });
}
