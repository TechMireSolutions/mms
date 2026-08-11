import { FastifyInstance } from 'fastify';
import type { ZodType } from 'zod';

import type { User } from '@mms/shared';
import { canReadCollection, canWriteCollection } from './rbacCanHelpers.js';
import { sendForbidden, sendDatabaseError } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';

export interface PaginatedListRouteOptions<TQuery, TPageResult, TAllResult = unknown[]> {
  path?: string;
  collection: string;
  schema: ZodType<TQuery>;
  loadPageFn: (query: TQuery & { includeDeleted: boolean }) => Promise<TPageResult>;
  defaultPageSize: number;
  errorMessagePrefix: string;
  canWriteDeletedCheck?: (user: User) => boolean;
  responseTransform?: (result: TPageResult | TAllResult, user: User) => Promise<unknown> | unknown;
  loadAllFn?: (options: { includeDeleted: boolean }) => Promise<TAllResult>;
}

export function registerPaginatedListRoute<
  TQuery extends { page?: number; limit?: number; includeDeleted?: string },
  TPageResult,
  TAllResult = unknown[],
>(
  fastify: FastifyInstance,
  options: PaginatedListRouteOptions<TQuery, TPageResult, TAllResult>,
): void {
  const {
    path,
    collection,
    schema,
    loadPageFn,
    defaultPageSize,
    errorMessagePrefix,
    canWriteDeletedCheck,
    responseTransform,
    loadAllFn,
  } = options;

  fastify.get(path || '/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    const queryParsed = parseRequest(schema, request.query);
    if (!queryParsed.ok) return replyValidationError(reply, queryParsed.message);
    try {
      const query = queryParsed.data;
      const includeDeleted = query.includeDeleted === 'true';
      if (includeDeleted) {
        const allowed = canWriteDeletedCheck
          ? canWriteDeletedCheck(user)
          : canWriteCollection(user, collection);
        if (!allowed) return sendForbidden(reply);
      }

      if (query.page != null) {
        const page = await loadPageFn({
          ...query,
          limit: query.limit ?? defaultPageSize,
          includeDeleted,
        });
        const responseData = responseTransform ? await responseTransform(page, user) : page;
        return reply.send(responseData);
      }

      if (loadAllFn) {
        const all = await loadAllFn({ includeDeleted });
        const responseData = responseTransform ? await responseTransform(all, user) : all;
        return reply.send({ [errorMessagePrefix]: responseData });
      }

      // If page is null and loadAllFn is not defined, execute page = 1 by default
      const page = await loadPageFn({
        ...query,
        page: 1,
        limit: defaultPageSize,
        includeDeleted,
      });
      const responseData = responseTransform ? await responseTransform(page, user) : page;
      return reply.send(responseData);
    } catch {
      return sendDatabaseError(reply, `Failed to list ${errorMessagePrefix}`);
    }
  });
}
