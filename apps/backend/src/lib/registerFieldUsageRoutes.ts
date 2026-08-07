import type { FastifyInstance } from 'fastify';
import type { ZodTypeAny } from 'zod';
import {
  fieldUsageBatchBodySchema,
  fieldUsageParamsSchema,
  type User,
} from '@mms/shared';
import { sendDatabaseError, sendForbidden } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';

export type RegisterFieldUsageRoutesOptions = {
  canRead: (user: User) => boolean;
  loadCount: (fieldKey: string) => Promise<number>;
  loadCounts: (fieldKeys: string[]) => Promise<Record<string, number>>;
  paramsSchema?: ZodTypeAny;
  batchBodySchema?: ZodTypeAny;
};

/** Register GET `/field-usage/:fieldKey` + POST `/field-usage` for a module. */
export function registerFieldUsageRoutes(
  fastify: FastifyInstance,
  options: RegisterFieldUsageRoutesOptions,
): void {
  const paramsSchema = options.paramsSchema ?? fieldUsageParamsSchema;
  const batchBodySchema = options.batchBodySchema ?? fieldUsageBatchBodySchema;

  fastify.get('/field-usage/:fieldKey', async (request, reply) => {
    const user = request.user as User;
    if (!options.canRead(user)) return sendForbidden(reply);
    const params = parseRequest(paramsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const fieldKey = (params.data as { fieldKey: string }).fieldKey;
      const count = await options.loadCount(fieldKey);
      return reply.send({ count });
    } catch {
      return sendDatabaseError(reply, 'Failed to load field usage');
    }
  });

  fastify.post('/field-usage', async (request, reply) => {
    const user = request.user as User;
    if (!options.canRead(user)) return sendForbidden(reply);
    const parsed = parseRequest(batchBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const fieldKeys = (parsed.data as { fieldKeys: string[] }).fieldKeys;
      const counts = await options.loadCounts(fieldKeys);
      return reply.send({ counts });
    } catch {
      return sendDatabaseError(reply, 'Failed to load field usage');
    }
  });
}
